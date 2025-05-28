const { Transaction, InventoryItem, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

// Get all transactions with pagination and filtering
const getAllTransactions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      startDate, 
      endDate, 
      type, 
      itemId,
      category 
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build where clause with proper date handling
    const whereClause = {};
    
    if (startDate && endDate) {
      // Convert date strings to proper date ranges accounting for timezone
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Set start to beginning of day and end to end of day
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      whereClause.date = {
        [Op.between]: [start, end]
      };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      whereClause.date = {
        [Op.gte]: start
      };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.date = {
        [Op.lte]: end
      };
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    if (itemId) {
      whereClause.inventoryItemId = itemId;
    }

    // Include filters for inventory item category
    const includeClause = [
      {
        model: InventoryItem,
        attributes: ['id', 'name', 'category', 'unit'],
        ...(category && {
          where: {
            category: category
          }
        })
      },
      {
        model: User,
        attributes: ['id', 'username']
      }
    ];

    const transactions = await Transaction.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC']]
    });

    res.status(200).json({
      transactions: transactions.rows,
      totalCount: transactions.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(transactions.count / limit)
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching transactions', 
      error: error.message 
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Get today's transactions by type
    const todayStats = await Transaction.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      attributes: [
        'type',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total']
      ],
      group: ['type']
    });

    // Format today's stats
    const statsMap = {
      in: 0,
      out: 0,
      spoilage: 0
    };

    todayStats.forEach(stat => {
      if (statsMap.hasOwnProperty(stat.type)) {
        statsMap[stat.type] = parseInt(stat.dataValues.total) || 0;
      }
    });

    // Get total items in stock
    const totalItems = await InventoryItem.sum('remaining', {
      where: { isActive: true }
    }) || 0;

    // Get low stock items (items with remaining < 20% of total inventory)
    const lowStockItems = await InventoryItem.findAll({
      where: {
        isActive: true,
        [Op.and]: [
          sequelize.literal('CAST("totalInventory" AS INTEGER) > 0'),
          sequelize.literal('CAST("remaining" AS FLOAT) / CAST("totalInventory" AS FLOAT) <= 0.2')
        ]
      }
    });

    res.status(200).json({
      totalItemsInStock: totalItems,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems,
      todayStats: statsMap
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching dashboard stats', 
      error: error.message 
    });
  }
};

// Get statistics for charts and analytics
const getStatistics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day', page = 1, limit = 50, productName, category, type } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days ago
    const end = endDate ? new Date(endDate) : new Date();

    // Stock changes over time
    const stockChanges = await Transaction.findAll({
      where: {
        date: {
          [Op.between]: [start, end]
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('date')), 'date'],
        'type',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total']
      ],
      group: [sequelize.fn('DATE', sequelize.col('date')), 'type'],
      order: [[sequelize.fn('DATE', sequelize.col('date')), 'ASC']]
    });

    // Transform stock changes for daily movements chart
    const dailyMovements = {};
    stockChanges.forEach(change => {
      const date = change.dataValues.date;
      if (!dailyMovements[date]) {
        dailyMovements[date] = { date, in: 0, out: 0, spoilage: 0 };
      }
      dailyMovements[date][change.type] = parseInt(change.dataValues.total);
    });
    const dailyMovementsArray = Object.values(dailyMovements);

    // Category distribution
    const categoryDistribution = await InventoryItem.findAll({
      where: { isActive: true },
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('remaining')), 'totalStock']
      ],
      group: ['category']
    });

    // Transform category distribution for pie chart
    const categoryDistributionChart = categoryDistribution.map(cat => ({
      name: cat.category,
      value: parseInt(cat.dataValues.totalStock) || 0
    }));

    // Stock levels for bar chart
    const stockLevels = await InventoryItem.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'remaining', 'category'],
      limit: 20,
      order: [['remaining', 'ASC']]
    });

    const stockLevelsChart = stockLevels.map(item => ({
      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
      stock: parseInt(item.remaining) || 0,
      minStock: 10 // Default min stock level
    }));

    // Get transactions with filtering
    const offset = (page - 1) * limit;
    
    // Build where clause for transactions
    const transactionWhereClause = {
      date: {
        [Op.between]: [start, end]
      }
    };
    
    if (type) {
      transactionWhereClause.type = type;
    }

    // Build include clause with proper filtering
    const inventoryItemWhere = {};
    if (category) {
      inventoryItemWhere.category = category;
    }
    if (productName) {
      inventoryItemWhere.name = { [Op.iLike]: `%${productName}%` };
    }

    const includeClause = [
      {
        model: InventoryItem,
        attributes: ['id', 'name', 'category', 'unit'],
        where: Object.keys(inventoryItemWhere).length > 0 ? inventoryItemWhere : undefined
      },
      {
        model: User,
        attributes: ['id', 'username']
      }
    ];

    const transactions = await Transaction.findAndCountAll({
      where: transactionWhereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC']]
    });

    // Calculate metrics
    const totalInTransactions = await Transaction.sum('quantity', {
      where: {
        type: 'in',
        date: {
          [Op.between]: [start, end]
        }
      }
    }) || 0;

    const totalOutTransactions = await Transaction.sum('quantity', {
      where: {
        type: 'out',
        date: {
          [Op.between]: [start, end]
        }
      }
    }) || 0;

    const totalSpoilageTransactions = await Transaction.sum('quantity', {
      where: {
        type: 'spoilage',
        date: {
          [Op.between]: [start, end]
        }
      }
    }) || 0;

    // Average daily outflow (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyOutflow = await Transaction.findAll({
      where: {
        type: 'out',
        date: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('date')), 'date'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalOut']
      ],
      group: [sequelize.fn('DATE', sequelize.col('date'))]
    });

    const avgDailyOutflow = dailyOutflow.length > 0 
      ? dailyOutflow.reduce((sum, day) => sum + parseInt(day.dataValues.totalOut), 0) / dailyOutflow.length
      : 0;

    res.status(200).json({
      chartData: {
        dailyMovements: dailyMovementsArray,
        categoryDistribution: categoryDistributionChart,
        stockLevels: stockLevelsChart
      },
      transactions: transactions.rows,
      metrics: {
        totalIn: totalInTransactions,
        totalOut: totalOutTransactions,
        totalSpoilage: totalSpoilageTransactions,
        avgDailyOutflow: Math.round(avgDailyOutflow * 100) / 100
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(transactions.count / limit),
        totalCount: transactions.count
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching statistics', 
      error: error.message 
    });
  }
};

// Create a new transaction
const createTransaction = async (req, res) => {
  try {
    const { inventoryItemId, type, quantity, notes, reason, date } = req.body;
    const userId = req.user.id;

    // Validate date if provided
    let transactionDate = new Date();
    if (date) {
      transactionDate = new Date(date);
      
      // Validate date is not in the future
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (transactionDate > today) {
        return res.status(400).json({
          message: 'Transaction date cannot be in the future'
        });
      }

      // Optional: Validate date is not too far in the past (configurable)
      const maxDaysBack = 7; // Allow up to 7 days back
      const earliestDate = new Date();
      earliestDate.setDate(earliestDate.getDate() - maxDaysBack);
      earliestDate.setHours(0, 0, 0, 0);

      if (transactionDate < earliestDate) {
        return res.status(400).json({
          message: `Transaction date cannot be more than ${maxDaysBack} days in the past`
        });
      }
    }

    // Get the inventory item to update stock levels
    const inventoryItem = await InventoryItem.findByPk(inventoryItemId);
    if (!inventoryItem) {
      return res.status(404).json({
        message: 'Inventory item not found'
      });
    }

    // Validate if there's enough stock for outgoing transactions
    if ((type === 'out' || type === 'spoilage') && inventoryItem.remaining < quantity) {
      return res.status(400).json({
        message: `Insufficient stock. Available: ${inventoryItem.remaining}, Requested: ${quantity}`
      });
    }

    // Use transaction to ensure data consistency
    const transaction = await sequelize.transaction(async (t) => {
      // Create the transaction record
      const newTransaction = await Transaction.create({
        inventoryItemId,
        userId,
        type,
        quantity,
        notes,
        reason,
        date: transactionDate
      }, { transaction: t });

      // Update inventory stock levels based on transaction type
      let newRemaining = inventoryItem.remaining;
      let newTotalInventory = inventoryItem.totalInventory;

      switch (type) {
        case 'in':
          newRemaining += quantity;
          newTotalInventory += quantity;
          break;
        case 'out':
        case 'spoilage':
          newRemaining -= quantity;
          break;
        case 'adjustment':
          // For adjustments, set the remaining to the specified quantity
          newRemaining = quantity;
          break;
        default:
          throw new Error(`Unknown transaction type: ${type}`);
      }

      // Update the inventory item
      await inventoryItem.update({
        remaining: newRemaining,
        totalInventory: newTotalInventory,
        updatedBy: userId
      }, { transaction: t });

      return newTransaction;
    });

    // Return the created transaction with updated inventory info
    const createdTransaction = await Transaction.findByPk(transaction.id, {
      include: [
        {
          model: InventoryItem,
          attributes: ['id', 'name', 'category', 'unit', 'remaining', 'totalInventory']
        },
        {
          model: User,
          attributes: ['id', 'username']
        }
      ]
    });

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: createdTransaction
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error creating transaction', 
      error: error.message 
    });
  }
};

// Create a new inventory transaction (optimized for date-based inventory)
const createInventoryTransaction = async (req, res) => {
  try {
    const { inventoryItemId, type, quantity, notes, date } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!inventoryItemId || !type || !quantity || !date) {
      return res.status(400).json({
        message: 'inventoryItemId, type, quantity, and date are required'
      });
    }

    // Validate transaction type
    const validTypes = ['in', 'out', 'spoilage', 'beginning'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: 'Invalid transaction type. Must be: in, out, spoilage, or beginning'
      });
    }

    // Parse and validate date
    const transactionDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (transactionDate > today) {
      return res.status(400).json({
        message: 'Transaction date cannot be in the future'
      });
    }

    // Validate quantity
    const qty = parseInt(quantity);
    if (isNaN(qty) || (qty < 0) || (qty === 0 && type !== 'beginning')) {
      return res.status(400).json({
        message: type === 'beginning' ? 'Quantity must be a non-negative number for beginning balance' : 'Quantity must be a positive number'
      });
    }

    // Get the inventory item
    const inventoryItem = await InventoryItem.findByPk(inventoryItemId);
    if (!inventoryItem) {
      return res.status(404).json({
        message: 'Inventory item not found'
      });
    }

    // For out/spoilage transactions, we need to check available stock for the selected date
    if (type === 'out' || type === 'spoilage') {
      // Calculate current stock for the selected date
      const targetDateStr = transactionDate.toISOString().split('T')[0];
      
      // Get all transactions for this item up to and including the selected date
      const existingTransactions = await Transaction.findAll({
        where: {
          inventoryItemId,
          date: {
            [Op.lte]: new Date(targetDateStr + 'T23:59:59.999Z')
          }
        },
        order: [['date', 'ASC']]
      });

      // Calculate available stock
      let availableStock = inventoryItem.beginning || 0;
      existingTransactions.forEach(transaction => {
        switch (transaction.type) {
          case 'beginning':
          case 'in':
            availableStock += transaction.quantity;
            break;
          case 'out':
          case 'spoilage':
            availableStock -= transaction.quantity;
            break;
        }
      });

      if (availableStock < qty) {
        return res.status(400).json({
          message: `Insufficient stock for ${targetDateStr}. Available: ${availableStock}, Requested: ${qty}`
        });
      }
    }

    // Create the transaction
    const newTransaction = await Transaction.create({
      inventoryItemId,
      userId,
      type,
      quantity: qty,
      notes: notes || '',
      reason: type === 'in' ? 'Stock in' : type === 'out' ? 'Stock out' : type === 'spoilage' ? 'Spoilage' : 'Beginning balance',
      date: transactionDate
    });

    // Return the created transaction with item info
    const createdTransaction = await Transaction.findByPk(newTransaction.id, {
      include: [
        {
          model: InventoryItem,
          attributes: ['id', 'name', 'category', 'unit']
        },
        {
          model: User,
          attributes: ['id', 'username']
        }
      ]
    });

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: createdTransaction
    });

  } catch (error) {
    console.error('Error creating inventory transaction:', error);
    res.status(500).json({ 
      message: 'Error creating transaction', 
      error: error.message 
    });
  }
};

// Get top outgoing products based on transaction data
const getTopOutgoingProducts = async (req, res) => {
  try {
    const { limit = 5, days = 30 } = req.query;
    
    // Calculate date range (default last 30 days)
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (parseInt(days) * 24 * 60 * 60 * 1000));

    // Query transactions with type 'out', group by inventoryItemId, sum quantities
    const topOutgoingProducts = await Transaction.findAll({
      where: {
        type: 'out',
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: InventoryItem,
          attributes: ['id', 'name', 'category', 'unit'],
          where: {
            isActive: true
          }
        }
      ],
      attributes: [
        'inventoryItemId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalOut'],
        [sequelize.fn('COUNT', sequelize.col('Transaction.id')), 'transactionCount']
      ],
      group: ['inventoryItemId', 'InventoryItem.id'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: parseInt(limit)
    });

    // Transform the data for frontend consumption
    const formattedData = topOutgoingProducts.map((item, index) => ({
      id: item.InventoryItem.id,
      name: item.InventoryItem.name,
      category: item.InventoryItem.category,
      unit: item.InventoryItem.unit,
      totalOut: parseInt(item.dataValues.totalOut) || 0,
      transactionCount: parseInt(item.dataValues.transactionCount) || 0,
      rank: index + 1
    }));

    res.status(200).json({
      products: formattedData,
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: parseInt(days)
      },
      totalProducts: formattedData.length
    });
  } catch (error) {
    console.error('Error fetching top outgoing products:', error);
    res.status(500).json({ 
      message: 'Error fetching top outgoing products', 
      error: error.message 
    });
  }
};

// Get current server date
const getSystemDate = async (req, res) => {
  try {
    const currentDate = new Date();
    res.status(200).json({
      date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
      time: currentDate.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error getting system date', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllTransactions,
  getDashboardStats,
  getStatistics,
  createTransaction,
  createInventoryTransaction,
  getTopOutgoingProducts,
  getSystemDate
}; 