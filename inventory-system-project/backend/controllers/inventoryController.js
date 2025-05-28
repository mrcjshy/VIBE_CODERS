const { InventoryItem, Transaction } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

// Get all inventory items
const getAllItems = async (req, res) => {
  try {
    const items = await InventoryItem.findAll({
      where: {
        isActive: true
      },
      order: [
        ['category', 'ASC'],
        ['name', 'ASC']
      ]
    });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory items', error: error.message });
  }
};

// Get a single inventory item by ID
const getItemById = async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory item', error: error.message });
  }
};

// Create a new inventory item
const createItem = async (req, res) => {
  try {
    const { 
      name, unit, category, beginning = 0, in: inValue = 0,
      out = 0, spoilage = 0
    } = req.body;

    // Validate required fields
    if (!name || !unit || !category) {
      return res.status(400).json({ 
        message: 'Name, unit, and category are required fields' 
      });
    }

    // Calculate derived values
    const totalInventory = parseInt(beginning) + parseInt(inValue);
    const remaining = Math.max(0, totalInventory - parseInt(out) - parseInt(spoilage));

    // Create new item
    const newItem = await InventoryItem.create({
      name,
      unit,
      category,
      beginning: parseInt(beginning),
      in: parseInt(inValue),
      totalInventory,
      out: parseInt(out),
      spoilage: parseInt(spoilage),
      remaining,
      isActive: true
    });

    res.status(201).json({
      message: 'Inventory item created successfully',
      item: newItem
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating inventory item', error: error.message });
  }
};

// Update an inventory item
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, unit, category, beginning, in: inValue,
      out, spoilage, isActive
    } = req.body;

    // Check if item exists
    const item = await InventoryItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Prepare update data with validated numbers
    const updateData = {
      ...(name && { name }),
      ...(unit && { unit }),
      ...(category && { category }),
      ...(beginning !== undefined && { beginning: parseInt(beginning) || 0 }),
      ...(inValue !== undefined && { in: parseInt(inValue) || 0 }),
      ...(out !== undefined && { out: parseInt(out) || 0 }),
      ...(spoilage !== undefined && { spoilage: parseInt(spoilage) || 0 }),
      ...(isActive !== undefined && { isActive })
    };

    // Calculate derived values if relevant fields are being updated
    if (beginning !== undefined || inValue !== undefined) {
      updateData.totalInventory = (parseInt(beginning) || item.beginning) + (parseInt(inValue) || item.in);
    }

    if (beginning !== undefined || inValue !== undefined || out !== undefined || spoilage !== undefined) {
      const totalInv = updateData.totalInventory || item.totalInventory;
      const outVal = parseInt(out) || item.out;
      const spoilageVal = parseInt(spoilage) || item.spoilage;
      updateData.remaining = Math.max(0, totalInv - outVal - spoilageVal);
    }

    // Update item
    await item.update(updateData);

    // Fetch updated item to return
    const updatedItem = await InventoryItem.findByPk(id);

    res.status(200).json({
      message: 'Inventory item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating inventory item', error: error.message });
  }
};

// Soft delete an inventory item
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item exists
    const item = await InventoryItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Soft delete by setting isActive to false
    await item.update({ isActive: false });

    res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting inventory item', error: error.message });
  }
};

// Get low stock items (items with remaining quantity below 20% of total inventory)
const getLowStockItems = async (req, res) => {
  try {
    const items = await InventoryItem.findAll({
      where: {
        isActive: true,
        [Op.and]: [
          sequelize.literal('CAST("totalInventory" AS INTEGER) > 0'),
          sequelize.literal('CAST("remaining" AS FLOAT) / CAST("totalInventory" AS FLOAT) <= 0.2')
        ]
      },
      order: [
        ['category', 'ASC'],
        ['name', 'ASC']
      ]
    });

    if (!items || items.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(items);
  } catch (error) {
    console.error('Error in getLowStockItems:', error);
    res.status(500).json({ 
      message: 'Error fetching low stock items', 
      error: error.message 
    });
  }
};

// Get inventory items computed for a specific date
const getInventoryByDate = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const targetDate = new Date(date);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    // Get all active inventory items
    const inventoryItems = await InventoryItem.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    const computedInventory = [];

    for (const item of inventoryItems) {
      // Calculate beginning value from previous day's remaining
      const previousDate = new Date(targetDate);
      previousDate.setDate(previousDate.getDate() - 1);
      const previousDateStr = previousDate.toISOString().split('T')[0];

      // Get previous day's transactions to compute previous day's remaining
      const previousDayTransactions = await Transaction.findAll({
        where: {
          inventoryItemId: item.id,
          date: {
            [Op.between]: [
              new Date(previousDateStr + 'T00:00:00.000Z'),
              new Date(previousDateStr + 'T23:59:59.999Z')
            ]
          }
        }
      });

      // Calculate previous day's ending stock (which becomes today's beginning)
      let previousDayBeginning = 0;
      let previousDayIn = 0;
      let previousDayOut = 0;
      let previousDaySpoilage = 0;

      // First, get the beginning value for the previous day
      // If there's a 'beginning' transaction, use it
      const beginningTransaction = previousDayTransactions.find(t => t.type === 'beginning');
      if (beginningTransaction) {
        previousDayBeginning = beginningTransaction.quantity;
      } else {
        // Recursively calculate from even earlier if needed, or use item's master beginning
        previousDayBeginning = item.beginning || 0;
      }

      // Sum up previous day's transactions
      previousDayTransactions.forEach(transaction => {
        switch (transaction.type) {
          case 'in':
            previousDayIn += transaction.quantity;
            break;
          case 'out':
            previousDayOut += transaction.quantity;
            break;
          case 'spoilage':
            previousDaySpoilage += transaction.quantity;
            break;
        }
      });

      const previousDayRemaining = Math.max(0, 
        previousDayBeginning + previousDayIn - previousDayOut - previousDaySpoilage
      );

      // Now calculate today's values
      const todayBeginning = previousDayRemaining;

      // Get today's transactions
      const todayTransactions = await Transaction.findAll({
        where: {
          inventoryItemId: item.id,
          date: {
            [Op.between]: [
              new Date(targetDateStr + 'T00:00:00.000Z'),
              new Date(targetDateStr + 'T23:59:59.999Z')
            ]
          }
        }
      });

      let todayIn = 0;
      let todayOut = 0;
      let todaySpoilage = 0;

      todayTransactions.forEach(transaction => {
        switch (transaction.type) {
          case 'in':
            todayIn += transaction.quantity;
            break;
          case 'out':
            todayOut += transaction.quantity;
            break;
          case 'spoilage':
            todaySpoilage += transaction.quantity;
            break;
        }
      });

      // Calculate computed values
      const totalInventory = todayBeginning + todayIn;
      const remaining = Math.max(0, totalInventory - todayOut - todaySpoilage);

      computedInventory.push({
        id: item.id,
        name: item.name,
        unit: item.unit,
        category: item.category,
        beginning: todayBeginning,
        in: todayIn,
        out: todayOut,
        spoilage: todaySpoilage,
        totalInventory,
        remaining,
        isActive: item.isActive,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      });
    }

    // Group by category
    const groupedInventory = computedInventory.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    res.status(200).json({
      date: targetDateStr,
      inventory: computedInventory,
      groupedInventory,
      summary: {
        totalItems: computedInventory.length,
        totalInventoryValue: computedInventory.reduce((sum, item) => sum + item.totalInventory, 0),
        totalRemaining: computedInventory.reduce((sum, item) => sum + item.remaining, 0)
      }
    });

  } catch (error) {
    console.error('Error in getInventoryByDate:', error);
    res.status(500).json({ 
      message: 'Error fetching inventory by date', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getLowStockItems,
  getInventoryByDate
}; 