const express = require('express');
const router = express.Router();
const { 
  getAllSettings, 
  getSetting, 
  updateSetting, 
  updateSettings, 
  deleteSetting 
} = require('../controllers/settingsController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/settings - Get all settings
router.get('/', getAllSettings);

// GET /api/settings/:key - Get a specific setting
router.get('/:key', getSetting);

// PUT /api/settings/:key - Update a specific setting (admin only)
router.put('/:key', isAdmin, updateSetting);

// PUT /api/settings - Update multiple settings (admin only)
router.put('/', isAdmin, updateSettings);

// DELETE /api/settings/:key - Delete a setting (admin only)
router.delete('/:key', isAdmin, deleteSetting);

module.exports = router; 