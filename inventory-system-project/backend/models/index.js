const User = require('./User');
const Category = require('./Category');
const InventoryItem = require('./InventoryItem');
const Unit = require('./Unit');
const Supplier = require('./Supplier');
const Transaction = require('./Transaction');
const sequelize = require('../config/db');

// Define relationships between models

// Category relationships
Category.hasMany(InventoryItem, { 
  foreignKey: 'categoryId',
  onDelete: 'CASCADE' 
});

InventoryItem.belongsTo(Category, { 
  foreignKey: 'categoryId' 
});

// Unit relationships
Unit.hasMany(InventoryItem, {
  foreignKey: 'unitId',
  onDelete: 'RESTRICT'
});

InventoryItem.belongsTo(Unit, {
  foreignKey: 'unitId'
});

// Supplier relationships
Supplier.hasMany(InventoryItem, {
  foreignKey: 'supplierId',
  onDelete: 'SET NULL'
});

InventoryItem.belongsTo(Supplier, {
  foreignKey: 'supplierId'
});

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
  Category,
  InventoryItem,
  Unit,
  Supplier,
  Transaction,
  syncDatabase
}; 