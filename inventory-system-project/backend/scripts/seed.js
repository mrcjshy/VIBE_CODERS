const dotenv = require('dotenv');
dotenv.config();

const { syncDatabase } = require('../models');
const seedDatabase = require('../seeders/seedDatabase');

const runSeeder = async () => {
  try {
    console.log('Starting database sync and seeding...');
    
    // Sync database first
    await syncDatabase();
    
    // Then seed with data
    await seedDatabase();
    
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

runSeeder(); 