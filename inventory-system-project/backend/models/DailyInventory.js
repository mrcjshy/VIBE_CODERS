const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DailyInventory = sequelize.define('DailyInventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  inventoryItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'InventoryItems',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  beginning: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  inQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  outQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  spoilage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  remaining: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['inventoryItemId', 'date']
    }
  ],
  hooks: {
    beforeSave: (dailyInventory) => {
      // Auto-calculate remaining
      dailyInventory.remaining = Math.max(0, 
        (dailyInventory.beginning || 0) + 
        (dailyInventory.inQuantity || 0) - 
        (dailyInventory.outQuantity || 0) - 
        (dailyInventory.spoilage || 0)
      );
    }
  }
});

module.exports = DailyInventory; 