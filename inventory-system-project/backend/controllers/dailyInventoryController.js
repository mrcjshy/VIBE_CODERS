const { DailyInventory, InventoryItem, Settings, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

// Generate today's inventory entries for all products
const generateTodayInventory = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Get all active inventory items
    const inventoryItems = await InventoryItem.findAll({
      where: { isActive: true }
    });

    const generatedEntries = [];

    for (const item of inventoryItems) {
      // Check if today's entry already exists
      const existingEntry = await DailyInventory.findOne({
        where: {
          inventoryItemId: item.id,
          date: today
        }
      });

      if (!existingEntry) {
        // Get yesterday's entry to determine beginning inventory
        const yesterdayEntry = await DailyInventory.findOne({
          where: {
            inventoryItemId: item.id,
            date: yesterdayStr
          }
        });

        const beginning = yesterdayEntry ? yesterdayEntry.remaining : 0;

        // Create today's entry
        const newEntry = await DailyInventory.create({
          inventoryItemId: item.id,
          date: today,
          beginning: beginning,
          inQuantity: 0,
          outQuantity: 0,
          spoilage: 0,
          remaining: beginning
        });

        generatedEntries.push(newEntry);
      }
    }

    // Fetch today's entries with product information
    const todayEntries = await DailyInventory.findAll({
      where: { date: today },
      include: [
        {
          model: InventoryItem,
          attributes: ['id', 'name', 'unit', 'category']
        }
      ],
      order: [
        [InventoryItem, 'category', 'ASC'],
        [InventoryItem, 'name', 'ASC']
      ]
    });

    res.status(200).json({
      message: `Generated ${generatedEntries.length} new entries for ${today}`,
      generatedCount: generatedEntries.length,
      totalEntries: todayEntries.length,
      entries: todayEntries
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error generating daily inventory', 
      error: error.message 
    });
  }
};

// Get daily inventory entries for a specific date
const getDailyInventory = async (req, res) => {
  try {
    const { date } = req.params;
    const { page = 1, limit = 50, search = '', category = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause for inventory item filtering
    const inventoryItemWhere = {};
    
    if (search) {
      inventoryItemWhere.name = { [Op.iLike]: `%${search}%` };
    }
    
    if (category) {
      inventoryItemWhere.category = category;
    }

    const entries = await DailyInventory.findAndCountAll({
      where: { date },
      include: [
        {
          model: InventoryItem,
          attributes: ['id', 'name', 'unit', 'category'],
          where: inventoryItemWhere
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['id', 'username'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        [InventoryItem, 'category', 'ASC'],
        [InventoryItem, 'name', 'ASC']
      ]
    });

    // Calculate summary statistics
    const summary = await DailyInventory.findAll({
      where: { date },
      include: [
        {
          model: InventoryItem,
          attributes: [],
          where: inventoryItemWhere
        }
      ],
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('DailyInventory.id')), 'totalProducts'],
        [sequelize.fn('SUM', sequelize.col('beginning')), 'totalBeginning'],
        [sequelize.fn('SUM', sequelize.col('inQuantity')), 'totalIn'],
        [sequelize.fn('SUM', sequelize.col('outQuantity')), 'totalOut'],
        [sequelize.fn('SUM', sequelize.col('spoilage')), 'totalSpoilage'],
        [sequelize.fn('SUM', sequelize.col('remaining')), 'totalRemaining']
      ],
      raw: true
    });

    res.status(200).json({
      entries: entries.rows,
      summary: summary[0] || {
        totalProducts: 0,
        totalBeginning: 0,
        totalIn: 0,
        totalOut: 0,
        totalSpoilage: 0,
        totalRemaining: 0
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(entries.count / limit),
        totalCount: entries.count,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching daily inventory', 
      error: error.message 
    });
  }
};

// Update a single daily inventory entry
const updateDailyInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { inQuantity, outQuantity, spoilage, notes } = req.body;
    const userId = req.user.id; // Get user from auth middleware

    const entry = await DailyInventory.findByPk(id, {
      include: [
        {
          model: InventoryItem,
          attributes: ['id', 'name', 'unit', 'category']
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['id', 'username'],
          required: false
        }
      ]
    });

    if (!entry) {
      return res.status(404).json({ message: 'Daily inventory entry not found' });
    }

    // Update the entry (remaining will be auto-calculated by the hook)
    await entry.update({
      inQuantity: parseInt(inQuantity) || 0,
      outQuantity: parseInt(outQuantity) || 0,
      spoilage: parseInt(spoilage) || 0,
      notes,
      updatedBy: userId
    });

    // Reload with updated user info
    await entry.reload({
      include: [
        {
          model: InventoryItem,
          attributes: ['id', 'name', 'unit', 'category']
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['id', 'username'],
          required: false
        }
      ]
    });

    res.status(200).json({
      message: 'Daily inventory entry updated successfully',
      entry
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating daily inventory entry', 
      error: error.message 
    });
  }
};

// Update multiple daily inventory entries
const updateMultipleDailyInventory = async (req, res) => {
  try {
    const { entries } = req.body;
    const userId = req.user.id; // Get user from auth middleware

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: 'No entries provided for update' });
    }

    const updatedEntries = [];

    // Use transaction for atomic updates
    await sequelize.transaction(async (t) => {
      for (const entryData of entries) {
        const { id, inQuantity, outQuantity, spoilage, notes } = entryData;

        const entry = await DailyInventory.findByPk(id, {
          include: [
            {
              model: InventoryItem,
              attributes: ['id', 'name', 'unit', 'category']
            },
            {
              model: User,
              as: 'updatedByUser',
              attributes: ['id', 'username'],
              required: false
            }
          ],
          transaction: t
        });

        if (entry) {
          await entry.update({
            inQuantity: parseInt(inQuantity) || 0,
            outQuantity: parseInt(outQuantity) || 0,
            spoilage: parseInt(spoilage) || 0,
            notes,
            updatedBy: userId
          }, { transaction: t });

          // Reload with updated user info
          await entry.reload({
            include: [
              {
                model: InventoryItem,
                attributes: ['id', 'name', 'unit', 'category']
              },
              {
                model: User,
                as: 'updatedByUser',
                attributes: ['id', 'username'],
                required: false
              }
            ],
            transaction: t
          });

          updatedEntries.push(entry);
        }
      }
    });

    res.status(200).json({
      message: `Successfully updated ${updatedEntries.length} entries`,
      updatedCount: updatedEntries.length,
      entries: updatedEntries
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating multiple daily inventory entries', 
      error: error.message 
    });
  }
};

// Get daily inventory summary/statistics
const getDailyInventorySummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get daily summaries for the date range
    const dailySummaries = await DailyInventory.findAll({
      where: {
        date: {
          [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]]
        }
      },
      attributes: [
        'date',
        [sequelize.fn('SUM', sequelize.col('beginning')), 'totalBeginning'],
        [sequelize.fn('SUM', sequelize.col('inQuantity')), 'totalIn'],
        [sequelize.fn('SUM', sequelize.col('outQuantity')), 'totalOut'],
        [sequelize.fn('SUM', sequelize.col('spoilage')), 'totalSpoilage'],
        [sequelize.fn('SUM', sequelize.col('remaining')), 'totalRemaining']
      ],
      group: ['date'],
      order: [['date', 'ASC']],
      raw: true
    });

    // Get low stock items based on settings
    const lowStockThreshold = await Settings.findOne({
      where: { key: 'lowStockThreshold' }
    });

    const threshold = lowStockThreshold ? parseInt(lowStockThreshold.value) : 10;
    const today = new Date().toISOString().split('T')[0];

    const lowStockItems = await DailyInventory.findAll({
      where: {
        date: today,
        remaining: { [Op.lt]: threshold }
      },
      include: [
        {
          model: InventoryItem,
          attributes: ['id', 'name', 'unit', 'category']
        }
      ],
      order: [['remaining', 'ASC']]
    });

    res.status(200).json({
      dailySummaries,
      lowStockItems,
      lowStockThreshold: threshold
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching daily inventory summary', 
      error: error.message 
    });
  }
};

module.exports = {
  generateTodayInventory,
  getDailyInventory,
  updateDailyInventory,
  updateMultipleDailyInventory,
  getDailyInventorySummary
}; 