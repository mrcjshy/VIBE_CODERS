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
    
    // Get previous date
    const previousDate = new Date(targetDate);
    previousDate.setDate(previousDate.getDate() - 1);
    const previousDateStr = previousDate.toISOString().split('T')[0];

    // Get all active inventory items
    const inventoryItems = await InventoryItem.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    const computedInventory = [];

    for (const item of inventoryItems) {
      // Get yesterday's remaining quantity
      const yesterdayRemaining = await calculateRemainingForDate(item.id, previousDate);
      
      // Get today's beginning transaction if it exists
      const todayBeginningTransaction = await Transaction.findOne({
        where: {
          inventoryItemId: item.id,
          type: 'beginning',
          date: {
            [Op.between]: [
              new Date(targetDateStr + 'T00:00:00.000Z'),
              new Date(targetDateStr + 'T23:59:59.999Z')
            ]
          }
        },
        order: [['createdAt', 'DESC']]
      });

      // If no beginning transaction exists for today and we have yesterday's remaining,
      // create a beginning transaction with yesterday's remaining value
      if (!todayBeginningTransaction && yesterdayRemaining !== null) {
        await Transaction.create({
          inventoryItemId: item.id,
          type: 'beginning',
          quantity: yesterdayRemaining,
          notes: `Auto-synced from previous day's remaining`,
          date: new Date(targetDateStr + 'T00:00:00.000Z'),
          userId: req.user?.id || 1 // Use requesting user's ID or default to 1
        });
      }

      // Get all of today's transactions
      const todayTransactions = await Transaction.findAll({
        where: {
          inventoryItemId: item.id,
          date: {
            [Op.between]: [
              new Date(targetDateStr + 'T00:00:00.000Z'),
              new Date(targetDateStr + 'T23:59:59.999Z')
            ]
          }
        },
        order: [['type', 'ASC'], ['createdAt', 'ASC']]
      });

      // Calculate today's values
      let todayBeginning = 0;
      let todayIn = 0;
      let todayOut = 0;
      let todaySpoilage = 0;

      todayTransactions.forEach(transaction => {
        switch (transaction.type) {
          case 'beginning':
            todayBeginning = transaction.quantity;
            break;
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

// Helper function to calculate remaining for a specific date
const calculateRemainingForDate = async (inventoryItemId, date) => {
  const dateStr = date.toISOString().split('T')[0];
  
  // Get all transactions for this item up to and including the specified date
  const transactions = await Transaction.findAll({
    where: {
      inventoryItemId,
      date: {
        [Op.between]: [
          new Date(dateStr + 'T00:00:00.000Z'),
          new Date(dateStr + 'T23:59:59.999Z')
        ]
      }
    },
    order: [['date', 'ASC'], ['createdAt', 'ASC']]
  });

  if (transactions.length === 0) {
    // If no transactions found for the date, try to get the last known remaining value
    const lastTransaction = await Transaction.findOne({
      where: {
        inventoryItemId,
        date: {
          [Op.lt]: new Date(dateStr + 'T00:00:00.000Z')
        }
      },
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });

    if (lastTransaction) {
      // Calculate the remaining from the last known transaction
      const item = await InventoryItem.findByPk(inventoryItemId);
      let balance = lastTransaction.type === 'beginning' ? lastTransaction.quantity : 0;
      
      const dateTransactions = await Transaction.findAll({
        where: {
          inventoryItemId,
          date: {
            [Op.between]: [
              new Date(lastTransaction.date).toISOString().split('T')[0] + 'T00:00:00.000Z',
              new Date(lastTransaction.date).toISOString().split('T')[0] + 'T23:59:59.999Z'
            ]
          }
        },
        order: [['date', 'ASC'], ['createdAt', 'ASC']]
      });

      dateTransactions.forEach(t => {
        switch (t.type) {
          case 'beginning':
            balance = t.quantity;
            break;
          case 'in':
            balance += t.quantity;
            break;
          case 'out':
          case 'spoilage':
            balance -= t.quantity;
            break;
        }
      });

      return Math.max(0, balance);
    }

    // If no previous transactions at all, return null
    return null;
  }

  // Calculate the remaining value for the specified date
  let balance = 0;
  let hasBeginning = false;

  transactions.forEach(transaction => {
    switch (transaction.type) {
      case 'beginning':
        balance = transaction.quantity;
        hasBeginning = true;
        break;
      case 'in':
        balance += transaction.quantity;
        break;
      case 'out':
      case 'spoilage':
        balance -= transaction.quantity;
        break;
    }
  });

  return Math.max(0, balance);
};

// Update inventory with transactions
const updateInventoryWithTransactions = async (req, res) => {
  try {
    const { inventoryItemId, date, beginning, inQuantity, outQuantity, spoilage, notes } = req.body;
    const userId = req.user.id;

    // Start a transaction to ensure data consistency
    await sequelize.transaction(async (t) => {
      // Get the inventory item
      const item = await InventoryItem.findByPk(inventoryItemId);
      if (!item) {
        throw new Error('Inventory item not found');
      }

      // Calculate the remaining quantity for this date after updates
      const totalInventory = (beginning || 0) + (inQuantity || 0);
      const remaining = Math.max(0, totalInventory - (outQuantity || 0) - (spoilage || 0));

      // Get next day's date
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];

      // Update or create beginning transaction for the next day to match today's remaining
      await Transaction.destroy({
        where: {
          inventoryItemId,
          type: 'beginning',
          date: {
            [Op.between]: [
              new Date(nextDateStr + 'T00:00:00.000Z'),
              new Date(nextDateStr + 'T23:59:59.999Z')
            ]
          }
        },
        transaction: t
      });

      // Create new beginning transaction for next day with today's remaining value
      await Transaction.create({
        inventoryItemId,
        userId,
        type: 'beginning',
        quantity: remaining,
        notes: `Auto-synced from previous day's remaining`,
        date: new Date(nextDateStr)
      }, { transaction: t });

      // Create or update beginning transaction for current day
      if (beginning !== undefined) {
        await Transaction.destroy({
          where: {
            inventoryItemId,
            type: 'beginning',
            date: {
              [Op.between]: [
                new Date(date + 'T00:00:00.000Z'),
                new Date(date + 'T23:59:59.999Z')
              ]
            }
          },
          transaction: t
        });

        await Transaction.create({
          inventoryItemId,
          userId,
          type: 'beginning',
          quantity: beginning,
          notes: notes || `Beginning balance for ${date}`,
          date: new Date(date)
        }, { transaction: t });
      }

      // Create or update in transaction
      if (inQuantity !== undefined) {
        await Transaction.destroy({
          where: {
            inventoryItemId,
            type: 'in',
            date: {
              [Op.between]: [
                new Date(date + 'T00:00:00.000Z'),
                new Date(date + 'T23:59:59.999Z')
              ]
            }
          },
          transaction: t
        });

        if (inQuantity > 0) {
          await Transaction.create({
            inventoryItemId,
            userId,
            type: 'in',
            quantity: inQuantity,
            notes: notes || `Stock in for ${date}`,
            date: new Date(date)
          }, { transaction: t });
        }
      }

      // Create or update out transaction
      if (outQuantity !== undefined) {
        await Transaction.destroy({
          where: {
            inventoryItemId,
            type: 'out',
            date: {
              [Op.between]: [
                new Date(date + 'T00:00:00.000Z'),
                new Date(date + 'T23:59:59.999Z')
              ]
            }
          },
          transaction: t
        });

        if (outQuantity > 0) {
          await Transaction.create({
            inventoryItemId,
            userId,
            type: 'out',
            quantity: outQuantity,
            notes: notes || `Stock out for ${date}`,
            date: new Date(date)
          }, { transaction: t });
        }
      }

      // Create or update spoilage transaction
      if (spoilage !== undefined) {
        await Transaction.destroy({
          where: {
            inventoryItemId,
            type: 'spoilage',
            date: {
              [Op.between]: [
                new Date(date + 'T00:00:00.000Z'),
                new Date(date + 'T23:59:59.999Z')
              ]
            }
          },
          transaction: t
        });

        if (spoilage > 0) {
          await Transaction.create({
            inventoryItemId,
            userId,
            type: 'spoilage',
            quantity: spoilage,
            notes: notes || `Spoilage for ${date}`,
            date: new Date(date)
          }, { transaction: t });
        }
      }

      // Update inventory item
      await item.update({
        beginning: beginning !== undefined ? beginning : item.beginning,
        in: inQuantity !== undefined ? inQuantity : item.in,
        out: outQuantity !== undefined ? outQuantity : item.out,
        spoilage: spoilage !== undefined ? spoilage : item.spoilage,
        totalInventory,
        remaining
      }, { transaction: t });
    });

    // Get the updated item
    const updatedItem = await InventoryItem.findByPk(inventoryItemId, {
      attributes: ['id', 'name', 'category', 'unit', 'beginning', 'in', 'out', 'spoilage', 'totalInventory', 'remaining']
    });

    res.status(200).json({
      message: 'Inventory updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ 
      message: 'Error updating inventory', 
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
  getInventoryByDate,
  updateInventoryWithTransactions
}; 