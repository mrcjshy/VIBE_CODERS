const User = require('./User');
const Category = require('./Category');
const InventoryItem = require('./InventoryItem');
const sequelize = require('../config/db');

// Define relationships between models
Category.hasMany(InventoryItem, { 
  foreignKey: 'categoryId',
  onDelete: 'CASCADE' 
});

InventoryItem.belongsTo(Category, { 
  foreignKey: 'categoryId' 
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
  syncDatabase
}; 