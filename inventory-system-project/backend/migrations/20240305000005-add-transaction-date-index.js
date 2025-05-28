'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add index on date column for better performance on date-based queries
    await queryInterface.addIndex('Transactions', ['date'], {
      name: 'transactions_date_idx'
    });

    // Add composite index for common query patterns
    await queryInterface.addIndex('Transactions', ['date', 'type'], {
      name: 'transactions_date_type_idx'
    });

    // Add index for inventory item queries
    await queryInterface.addIndex('Transactions', ['inventoryItemId', 'date'], {
      name: 'transactions_item_date_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Transactions', 'transactions_date_idx');
    await queryInterface.removeIndex('Transactions', 'transactions_date_type_idx');
    await queryInterface.removeIndex('Transactions', 'transactions_item_date_idx');
  }
}; 