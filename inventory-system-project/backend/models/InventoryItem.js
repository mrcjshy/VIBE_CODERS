const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const InventoryItem = sequelize.define('InventoryItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  unitId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Units',
      key: 'id'
    }
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Suppliers',
      key: 'id'
    }
  },
  beginningQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  currentQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  totalInventory: {
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
  spoilageQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Categories',
      key: 'id'
    }
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastRestocked: {
    type: DataTypes.DATE,
    allowNull: true
  },
  minStockLevel: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 5
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = InventoryItem; 