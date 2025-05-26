// DARRYL YAM C. CANDILADA - BSIT 2-I

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('inventory_db', 'postgres', '1010', {
  host: '127.0.0.1',
  dialect: 'postgres'
});

sequelize.authenticate()
  .then(() => {
    console.log('✅ PostgreSQL connected!');
  })
  .catch((err) => {
    console.error('❌ Unable to connect:', err);
  });
