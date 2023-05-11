const Sequilize = require('sequelize');

const sequelize = new Sequilize('nodejs-learn', 'root', 'password', { 
    dialect: 'mysql', 
    host: 'localhost' 
});

module.exports = sequelize;