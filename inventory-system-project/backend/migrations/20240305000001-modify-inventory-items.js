'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop foreign key constraints
    await queryInterface.removeConstraint('Transactions', 'Transactions_inventoryItemId_fkey');

    // Drop existing columns
    await queryInterface.removeColumn('InventoryItems', 'description');
    await queryInterface.removeColumn('InventoryItems', 'unitId');
    await queryInterface.removeColumn('InventoryItems', 'supplierId');
    await queryInterface.removeColumn('InventoryItems', 'price');
    await queryInterface.removeColumn('InventoryItems', 'categoryId');
    await queryInterface.removeColumn('InventoryItems', 'sku');
    await queryInterface.removeColumn('InventoryItems', 'location');
    await queryInterface.removeColumn('InventoryItems', 'lastRestocked');
    await queryInterface.removeColumn('InventoryItems', 'minStockLevel');
    await queryInterface.removeColumn('InventoryItems', 'expiryDate');

    // Add new columns
    await queryInterface.addColumn('InventoryItems', 'unit', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'pc'
    });

    await queryInterface.addColumn('InventoryItems', 'category', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'OTHERS'
    });

    await queryInterface.addColumn('InventoryItems', 'beginning', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('InventoryItems', 'in', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('InventoryItems', 'totalInventory', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('InventoryItems', 'out', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('InventoryItems', 'spoilage', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('InventoryItems', 'remaining', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove new columns
    await queryInterface.removeColumn('InventoryItems', 'unit');
    await queryInterface.removeColumn('InventoryItems', 'category');
    await queryInterface.removeColumn('InventoryItems', 'beginning');
    await queryInterface.removeColumn('InventoryItems', 'in');
    await queryInterface.removeColumn('InventoryItems', 'totalInventory');
    await queryInterface.removeColumn('InventoryItems', 'out');
    await queryInterface.removeColumn('InventoryItems', 'spoilage');
    await queryInterface.removeColumn('InventoryItems', 'remaining');

    // Add back old columns
    await queryInterface.addColumn('InventoryItems', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('InventoryItems', 'unitId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Units',
        key: 'id'
      }
    });
    await queryInterface.addColumn('InventoryItems', 'supplierId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Suppliers',
        key: 'id'
      }
    });
    await queryInterface.addColumn('InventoryItems', 'price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00
    });
    await queryInterface.addColumn('InventoryItems', 'categoryId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Categories',
        key: 'id'
      }
    });
    await queryInterface.addColumn('InventoryItems', 'sku', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });
    await queryInterface.addColumn('InventoryItems', 'location', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('InventoryItems', 'lastRestocked', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('InventoryItems', 'minStockLevel', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 5
    });
    await queryInterface.addColumn('InventoryItems', 'expiryDate', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Re-add foreign key constraint
    await queryInterface.addConstraint('Transactions', {
      fields: ['inventoryItemId'],
      type: 'foreign key',
      name: 'Transactions_inventoryItemId_fkey',
      references: {
        table: 'InventoryItems',
        field: 'id'
      }
    });
  }
}; 