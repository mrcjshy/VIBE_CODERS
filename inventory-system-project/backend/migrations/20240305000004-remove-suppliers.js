'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Drop Suppliers table if it exists
      await queryInterface.dropTable('Suppliers');
      console.log('Suppliers table dropped successfully');
    } catch (error) {
      console.log('Suppliers table does not exist or already dropped');
    }

    try {
      // Remove supplierId column from InventoryItems if it exists
      await queryInterface.removeColumn('InventoryItems', 'supplierId');
      console.log('supplierId column removed from InventoryItems');
    } catch (error) {
      console.log('supplierId column does not exist in InventoryItems');
    }

    try {
      // Drop Units table if it exists (since we're using string units now)
      await queryInterface.dropTable('Units');
      console.log('Units table dropped successfully');
    } catch (error) {
      console.log('Units table does not exist or already dropped');
    }

    try {
      // Remove unitId column from InventoryItems if it exists
      await queryInterface.removeColumn('InventoryItems', 'unitId');
      console.log('unitId column removed from InventoryItems');
    } catch (error) {
      console.log('unitId column does not exist in InventoryItems');
    }

    try {
      // Remove categoryId column from InventoryItems if it exists
      await queryInterface.removeColumn('InventoryItems', 'categoryId');
      console.log('categoryId column removed from InventoryItems');
    } catch (error) {
      console.log('categoryId column does not exist in InventoryItems');
    }

    try {
      // Drop Categories table if it exists (since we're using string categories now)
      await queryInterface.dropTable('Categories');
      console.log('Categories table dropped successfully');
    } catch (error) {
      console.log('Categories table does not exist or already dropped');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Note: This migration is designed to clean up unused tables/columns
    // The down migration would be complex and is not recommended
    // since we're moving to a simpler string-based system
    console.log('This migration cannot be reverted automatically');
    console.log('Please restore from backup if needed');
  }
}; 