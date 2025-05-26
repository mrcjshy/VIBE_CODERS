const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('inventory_db', 'postgres', '09057644429', {
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
