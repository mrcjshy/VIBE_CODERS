const express = require('express');
const router = express.Router();
const { 
  generateTodayInventory,
  getDailyInventory,
  updateDailyInventory,
  updateMultipleDailyInventory,
  getDailyInventorySummary
} = require('../controllers/dailyInventoryController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/daily-inventory/generate - Generate today's inventory entries
router.get('/generate', generateTodayInventory);

// GET /api/daily-inventory/summary - Get daily inventory summary/statistics
router.get('/summary', getDailyInventorySummary);

// GET /api/daily-inventory/:date - Get daily inventory entries for a specific date
router.get('/:date', getDailyInventory);

// PUT /api/daily-inventory/:id - Update a single daily inventory entry
router.put('/:id', updateDailyInventory);

// PUT /api/daily-inventory/bulk - Update multiple daily inventory entries
router.put('/', updateMultipleDailyInventory);

module.exports = router; 