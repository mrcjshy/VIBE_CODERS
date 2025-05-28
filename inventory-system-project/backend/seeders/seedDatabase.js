// DARRYL YAM C. CANDILADA - BSIT -2-I

const { 
  User, 
  InventoryItem, 
  Settings,
  Transaction 
} = require('../models');
const bcrypt = require('bcrypt');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Create admin user
    const adminUser = await User.findOrCreate({
      where: { username: 'teamlead' },
      defaults: {
        username: 'teamlead',
        email: 'teamlead@inventory.com',
        password: 'teamlead123',
        role: 'teamlead'
      }
    });

    // Create staff user
    const staffUser = await User.findOrCreate({
      where: { username: 'barista' },
      defaults: {
        username: 'barista',
        email: 'barista@inventory.com',
        password: 'barista123',
        role: 'barista'
      }
    });

    // Create sample inventory items (no foreign key relationships needed)
    const sampleItems = [
      {
        name: 'Rice',
        unit: 'kg',
        category: 'FOOD',
        beginning: 100,
        in: 50,
        out: 30,
        spoilage: 5,
        isActive: true
      },
      {
        name: 'Cooking Oil',
        unit: 'L',
        category: 'FOOD',
        beginning: 50,
        in: 20,
        out: 15,
        spoilage: 2,
        isActive: true
      },
      {
        name: 'Paper Towels',
        unit: 'pc',
        category: 'SUPPLIES',
        beginning: 200,
        in: 100,
        out: 50,
        spoilage: 0,
        isActive: true
      },
      {
        name: 'Coffee',
        unit: 'kg',
        category: 'BEVERAGES',
        beginning: 25,
        in: 10,
        out: 8,
        spoilage: 1,
        isActive: true
      },
      {
        name: 'Napkins',
        unit: 'pkg',
        category: 'SUPPLIES',
        beginning: 150,
        in: 75,
        out: 40,
        spoilage: 0,
        isActive: true
      },
      {
        name: 'Flour',
        unit: 'kg',
        category: 'FOOD',
        beginning: 80,
        in: 30,
        out: 25,
        spoilage: 3,
        isActive: true
      }
    ];

    for (const itemData of sampleItems) {
      // Calculate totalInventory and remaining
      const totalInventory = itemData.beginning + itemData.in;
      const remaining = totalInventory - itemData.out - itemData.spoilage;

      await InventoryItem.findOrCreate({
        where: { name: itemData.name },
        defaults: {
          ...itemData,
          totalInventory,
          remaining
        }
      });
    }

    // Create sample settings
    const settings = [
      {
        key: 'lowStockThreshold',
        value: '10',
        type: 'number',
        description: 'Low stock threshold for inventory items'
      },
      {
        key: 'companyName',
        value: 'Inventory Management System',
        type: 'string',
        description: 'Company name displayed in the application'
      },
      {
        key: 'enableNotifications',
        value: 'true',
        type: 'boolean',
        description: 'Enable system notifications'
      }
    ];

    for (const settingData of settings) {
      await Settings.findOrCreate({
        where: { key: settingData.key },
        defaults: settingData
      });
    }

    console.log('Database seeding completed successfully!');
    console.log('Admin User: username: teamlead, password: teamlead123');
    console.log('Staff User: username: barista, password: barista123');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

module.exports = seedDatabase; 