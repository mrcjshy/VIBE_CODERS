const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Unit = sequelize.define('Unit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  abbreviation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Unit; 