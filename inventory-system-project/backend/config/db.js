// DARRYL YAM C. CANDILADA - BSIT 2-I

const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Database connection configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'neondb',
  process.env.DB_USER || 'neondb_owner',
  process.env.DB_PASSWORD || 'npg_KMy0gUTjiVZ6',
  {
    host: process.env.DB_HOST || 'ep-autumn-rain-a1sfkj8i-pooler.ap-southeast-1.aws.neon.tech',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

testConnection();

module.exports = sequelize;
