'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('NewInventoryItems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      unit: {
        type: Sequelize.STRING,
        allowNull: false
      },
      beginning: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      in: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      totalInventory: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      out: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      spoilage: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      remaining: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Copy data from old table if it exists
    try {
      await queryInterface.sequelize.query(`
        INSERT INTO "NewInventoryItems" (name, unit, beginning, "in", "totalInventory", out, spoilage, remaining, category, "isActive", "createdAt", "updatedAt")
        SELECT name, 'pc' as unit, 0 as beginning, 0 as "in", 0 as "totalInventory", 0 as out, 0 as spoilage, 0 as remaining, 'OTHERS' as category, "isActive", "createdAt", "updatedAt"
        FROM "InventoryItems";
      `);
    } catch (error) {
      console.log('No existing data to migrate');
    }

    // Drop the old table
    try {
      await queryInterface.dropTable('InventoryItems');
    } catch (error) {
      console.log('No old table to drop');
    }

    // Rename the new table to the original name
    await queryInterface.renameTable('NewInventoryItems', 'InventoryItems');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('InventoryItems');
  }
}; 