const express = require('express');
const router = express.Router();
const { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser, 
  getUserStats,
  changeUserPassword
} = require('../controllers/userController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// All routes require authentication and Team Lead role
router.use(authenticateToken);
router.use(isAdmin);

// GET /api/users/stats - Get user statistics
router.get('/stats', getUserStats);

// GET /api/users - Get all users with pagination and search
router.get('/', getAllUsers);

// GET /api/users/:id - Get a specific user
router.get('/:id', getUserById);

// POST /api/users - Create a new user
router.post('/', createUser);

// PUT /api/users/:id - Update a user
router.put('/:id', updateUser);

// PUT /api/users/:id/password - Change user password (admin only)
router.put('/:id/password', changeUserPassword);

// DELETE /api/users/:id - Delete a user
router.delete('/:id', deleteUser);

module.exports = router; 