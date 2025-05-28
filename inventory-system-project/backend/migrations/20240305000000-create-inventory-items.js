'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('InventoryItems', {
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('InventoryItems');
  }
}; 