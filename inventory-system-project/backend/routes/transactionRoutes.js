const express = require('express');
const router = express.Router();
const { 
  getAllTransactions, 
  getDashboardStats, 
  getStatistics, 
  createTransaction,
  createInventoryTransaction,
  getTopOutgoingProducts,
  getSystemDate,
  updateInventoryForDate,
  resetInventoryQuantity
} = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/transactions - Get all transactions with filtering
router.get('/', getAllTransactions);

// GET /api/transactions/dashboard - Get dashboard statistics
router.get('/dashboard', getDashboardStats);

// GET /api/transactions/statistics - Get statistics for charts
router.get('/statistics', getStatistics);

// GET /api/transactions/top-outgoing - Get top outgoing products
router.get('/top-outgoing', getTopOutgoingProducts);

// GET /api/transactions/system-date - Get current server date
router.get('/system-date', getSystemDate);

// POST /api/transactions - Create a new transaction
router.post('/', createTransaction);

// POST /api/transactions/inventory - Create a new inventory transaction (date-based)
router.post('/inventory', createInventoryTransaction);

// POST /api/transactions/update-inventory - Update inventory for a specific date
router.post('/update-inventory', updateInventoryForDate);

// POST /api/transactions/reset-quantity - Reset inventory quantity
router.post('/reset-quantity', resetInventoryQuantity);

module.exports = router; 