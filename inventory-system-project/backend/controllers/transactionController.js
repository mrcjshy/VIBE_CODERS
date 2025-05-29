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
    // Allow date parameter to sync with Product section, default to today
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    console.log(`Dashboard stats using date: ${targetDateStr}`);

    // Get all transactions for today by type with eager loading of InventoryItem
    const dayTransactions = await Transaction.findAll({
      where: {
        type: { [Op.in]: ['in', 'out', 'spoilage'] },
        date: {
          [Op.between]: [
            new Date(targetDateStr + 'T00:00:00.000Z'),
            new Date(targetDateStr + 'T23:59:59.999Z')
          ]
        }
      },
      include: [{
        model: InventoryItem,
        attributes: ['id', 'name', 'category', 'unit']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Calculate totals by type
    const statsMap = {
      in: 0,
      out: 0,
      spoilage: 0
    };

    // Track items received today
    const itemsReceivedToday = [];

    dayTransactions.forEach(transaction => {
      if (statsMap.hasOwnProperty(transaction.type)) {
        statsMap[transaction.type] += parseInt(transaction.quantity) || 0;
        
        // Add to items received if it's an IN transaction
        if (transaction.type === 'in') {
          const existingItem = itemsReceivedToday.find(item => item.id === transaction.InventoryItem.id);
          if (existingItem) {
            existingItem.quantity += transaction.quantity;
          } else {
            itemsReceivedToday.push({
              id: transaction.InventoryItem.id,
              name: transaction.InventoryItem.name,
              category: transaction.InventoryItem.category,
              unit: transaction.InventoryItem.unit,
              quantity: transaction.quantity,
              time: transaction.createdAt
            });
          }
        }
      }
    });

    // Debug log the transactions found
    console.log(`Found ${dayTransactions.length} transactions for ${targetDateStr}:`, 
      dayTransactions.map(t => `${t.type}: ${t.quantity}`));
    console.log('Calculated stats:', statsMap);
    console.log('Items received today:', itemsReceivedToday.map(item => `${item.name}: ${item.quantity}`));

    // Get total items in stock by calculating from target date inventory
    const inventoryItems = await InventoryItem.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    let totalItemsInStock = 0;
    const lowStockItems = [];
    const lowStockThreshold = 0.2;

    // Helper function to calculate remaining for a specific date (same as Product section)
    const calculateRemainingForDate = async (inventoryItemId, date) => {
      const dateStr = date.toISOString().split('T')[0];
      
      const transactions = await Transaction.findAll({
        where: {
          inventoryItemId,
          date: {
            [Op.lte]: new Date(dateStr + 'T23:59:59.999Z')
          }
        },
        order: [['date', 'ASC'], ['createdAt', 'ASC']]
      });

      if (transactions.length === 0) {
        return null;
      }

      const item = await InventoryItem.findByPk(inventoryItemId);
      let balance = item.beginning || 0;

      transactions.forEach(transaction => {
        switch (transaction.type) {
          case 'beginning':
            balance = transaction.quantity;
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

    // Calculate current stock for each item using target date (EXACT same logic as Product section)
    for (const item of inventoryItems) {
      let dayBeginning = 0;
      
      // Check if there's a manual beginning transaction for target date
      const dayBeginningTransaction = await Transaction.findOne({
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

      // Auto-calculate from previous day's remaining
      const previousDate = new Date(targetDate);
      previousDate.setDate(previousDate.getDate() - 1);
      
      const autoCalculatedBeginning = await calculateRemainingForDate(item.id, previousDate);
      const fallbackBeginning = autoCalculatedBeginning !== null ? autoCalculatedBeginning : (item.beginning || 0);

      if (dayBeginningTransaction) {
        if (dayBeginningTransaction.quantity === fallbackBeginning) {
          dayBeginning = fallbackBeginning;
        } else {
          dayBeginning = dayBeginningTransaction.quantity;
        }
      } else {
        dayBeginning = fallbackBeginning;
      }

      // Get target date's other transactions (excluding beginning)
      const dayTransactions = await Transaction.findAll({
        where: {
          inventoryItemId: item.id,
          type: { [Op.in]: ['in', 'out', 'spoilage'] },
          date: {
            [Op.between]: [
              new Date(targetDateStr + 'T00:00:00.000Z'),
              new Date(targetDateStr + 'T23:59:59.999Z')
            ]
          }
        }
      });

      let dayIn = 0;
      let dayOut = 0;
      let daySpoilage = 0;

      dayTransactions.forEach(transaction => {
        switch (transaction.type) {
          case 'in':
            dayIn += transaction.quantity;
            break;
          case 'out':
            dayOut += transaction.quantity;
            break;
          case 'spoilage':
            daySpoilage += transaction.quantity;
            break;
        }
      });

      // Calculate current values for target date (SAME as Product section)
      const totalInventory = dayBeginning + dayIn;
      const remaining = Math.max(0, totalInventory - dayOut - daySpoilage);
      
      // Add to total stock
      totalItemsInStock += remaining;
      
      // ENHANCED Low stock detection - detect items showing as low in Product section
      const isOutOfStock = remaining === 0;
      const isLowPercentage = totalInventory > 0 && (remaining / totalInventory) <= lowStockThreshold;
      const isLowAbsolute = totalInventory > 0 && remaining <= 10;
      const hasNoDataForDate = totalInventory === 0 && dayTransactions.length === 0 && !dayBeginningTransaction;
      
      const isLowStock = isOutOfStock || isLowPercentage || isLowAbsolute || hasNoDataForDate;
      
      if (isLowStock) {
        lowStockItems.push({
          id: item.id,
          name: item.name,
          unit: item.unit,
          category: item.category,
          remaining,
          totalInventory,
          isActive: item.isActive,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        });
      }
    }

    res.status(200).json({
      totalItemsInStock,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems,
      todayStats: statsMap,
      itemsReceivedToday: itemsReceivedToday.sort((a, b) => b.time - a.time), // Most recent first
      dataDate: targetDateStr,
      lowStockDate: targetDateStr
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
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

// Update inventory for a specific date (replaces existing transactions)
const updateInventoryForDate = async (req, res) => {
  try {
    const { inventoryItemId, date, beginning, inQuantity, outQuantity, spoilage, notes } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!inventoryItemId || !date) {
      return res.status(400).json({
        message: 'inventoryItemId and date are required'
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

    // Get the inventory item
    const inventoryItem = await InventoryItem.findByPk(inventoryItemId);
    if (!inventoryItem) {
      return res.status(404).json({
        message: 'Inventory item not found'
      });
    }

    const targetDateStr = transactionDate.toISOString().split('T')[0];
    
    // Delete existing transactions for this item and date
    await Transaction.destroy({
      where: {
        inventoryItemId,
        date: {
          [Op.between]: [
            new Date(targetDateStr + 'T00:00:00.000Z'),
            new Date(targetDateStr + 'T23:59:59.999Z')
          ]
        }
      }
    });

    // Create new transactions for the provided values (allow 0 values)
    const newTransactions = [];

    // Create beginning transaction if provided (manual override)
    if (beginning !== undefined && beginning !== null) {
      const beginningQty = parseInt(beginning) || 0;
      const beginningTransaction = await Transaction.create({
        inventoryItemId,
        userId,
        type: 'beginning',
        quantity: beginningQty,
        notes: notes || `Beginning balance for ${targetDateStr}`,
        reason: 'Beginning balance',
        date: transactionDate
      });
      newTransactions.push(beginningTransaction);
    }

    // Create in transaction if provided (allow 0 values)
    if (inQuantity !== undefined && inQuantity !== null) {
      const inQty = parseInt(inQuantity) || 0;
      if (inQty > 0) { // Only create transaction for positive values
        const inTransaction = await Transaction.create({
          inventoryItemId,
          userId,
          type: 'in',
          quantity: inQty,
          notes: notes || `Stock in for ${targetDateStr}`,
          reason: 'Stock in',
          date: transactionDate
        });
        newTransactions.push(inTransaction);
      }
    }

    // Create out transaction if provided (allow 0 values)
    if (outQuantity !== undefined && outQuantity !== null) {
      const outQty = parseInt(outQuantity) || 0;
      if (outQty > 0) { // Only create transaction for positive values
        const outTransaction = await Transaction.create({
          inventoryItemId,
          userId,
          type: 'out',
          quantity: outQty,
          notes: notes || `Stock out for ${targetDateStr}`,
          reason: 'Stock out',
          date: transactionDate
        });
        newTransactions.push(outTransaction);
      }
    }

    // Create spoilage transaction if provided (allow 0 values)
    if (spoilage !== undefined && spoilage !== null) {
      const spoilageQty = parseInt(spoilage) || 0;
      if (spoilageQty > 0) { // Only create transaction for positive values
        const spoilageTransaction = await Transaction.create({
          inventoryItemId,
          userId,
          type: 'spoilage',
          quantity: spoilageQty,
          notes: notes || `Spoilage for ${targetDateStr}`,
          reason: 'Spoilage',
          date: transactionDate
        });
        newTransactions.push(spoilageTransaction);
      }
    }

    // Fetch the created transactions with related data
    const createdTransactions = await Transaction.findAll({
      where: {
        id: newTransactions.map(t => t.id)
      },
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

    res.status(200).json({
      message: 'Inventory updated successfully',
      transactions: createdTransactions,
      date: targetDateStr
    });

  } catch (error) {
    console.error('Error updating inventory for date:', error);
    res.status(500).json({ 
      message: 'Error updating inventory', 
      error: error.message 
    });
  }
};

// Reset inventory quantity
const resetInventoryQuantity = async (req, res) => {
  try {
    const { inventoryItemId } = req.body;
    const userId = req.user.id;

    // Get the inventory item
    const inventoryItem = await InventoryItem.findByPk(inventoryItemId);
    if (!inventoryItem) {
      return res.status(404).json({
        message: 'Inventory item not found'
      });
    }

    // Use transaction to ensure data consistency
    await sequelize.transaction(async (t) => {
      // Create a beginning transaction with 0 quantity
      await Transaction.create({
        inventoryItemId,
        userId,
        type: 'beginning',
        quantity: 0,
        notes: 'Inventory reset to 0',
        reason: 'Reset inventory',
        date: new Date()
      }, { transaction: t });

      // Update the inventory item
      await inventoryItem.update({
        remaining: 0,
        totalInventory: 0,
        updatedBy: userId
      }, { transaction: t });
    });

    // Return the updated inventory item
    const updatedItem = await InventoryItem.findByPk(inventoryItemId, {
      attributes: ['id', 'name', 'category', 'unit', 'remaining', 'totalInventory']
    });

    res.status(200).json({
      message: 'Inventory quantity reset successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Error resetting inventory quantity:', error);
    res.status(500).json({ 
      message: 'Error resetting inventory quantity', 
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
  getSystemDate,
  updateInventoryForDate,
  resetInventoryQuantity
}; 