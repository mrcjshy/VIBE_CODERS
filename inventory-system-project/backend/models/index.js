const User = require('./User');
const InventoryItem = require('./InventoryItem');
const Transaction = require('./Transaction');
const Settings = require('./Settings');
const DailyInventory = require('./DailyInventory');
const sequelize = require('../config/db');

// Define relationships between models

// Transaction relationships
InventoryItem.hasMany(Transaction, {
  foreignKey: 'inventoryItemId',
  onDelete: 'CASCADE'
});

Transaction.belongsTo(InventoryItem, {
  foreignKey: 'inventoryItemId'
});

User.hasMany(Transaction, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});

Transaction.belongsTo(User, {
  foreignKey: 'userId'
});

// DailyInventory relationships
InventoryItem.hasMany(DailyInventory, {
  foreignKey: 'inventoryItemId',
  onDelete: 'CASCADE'
});

DailyInventory.belongsTo(InventoryItem, {
  foreignKey: 'inventoryItemId'
});

// DailyInventory - User relationship for audit logging
User.hasMany(DailyInventory, {
  foreignKey: 'updatedBy',
  onDelete: 'SET NULL'
});

DailyInventory.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'updatedByUser'
});

// Sync all models with database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
};

module.exports = {
  User,
  InventoryItem,
  Transaction,
  Settings,
  DailyInventory,
  syncDatabase
}; 