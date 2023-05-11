const Sequlize = require('sequelize');

const sequelize = require('../util/database');

const CartItem = sequelize.define('cartItem', {
    id: {
        type: Sequlize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    quantity: Sequlize.INTEGER
});

module.exports = CartItem;