const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get routes
router.get('/', inventoryController.getAllItems);
router.get('/low-stock', inventoryController.getLowStockItems);
router.get('/:id', inventoryController.getItemById);

// Post routes - admin only
router.post('/', isAdmin, inventoryController.createItem);

// Put routes - admin only
router.put('/:id', isAdmin, inventoryController.updateItem);

// Delete routes - admin only
router.delete('/:id', isAdmin, inventoryController.deleteItem);

module.exports = router; 