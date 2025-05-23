const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get routes - available to all authenticated users
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Post, Put, Delete routes - admin only
router.post('/', isAdmin, categoryController.createCategory);
router.put('/:id', isAdmin, categoryController.updateCategory);
router.delete('/:id', isAdmin, categoryController.deleteCategory);

module.exports = router; 