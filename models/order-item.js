const Sequlize = require('sequelize');

const sequelize = require('../util/database');

const OrderItem = sequelize.define('orderItem', {
    id: {
        type: Sequlize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    quantity: Sequlize.INTEGER
});

module.exports = OrderItem;