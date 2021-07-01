// Criando uma tabela que guarda informações de tokens

const Sequelize = require('sequelize');
const sequelize = require('../database/database');

const Tokens = sequelize.define('token',{
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
        autoIncrement: true
    },
    userId:{
        type: Sequelize.INTEGER,
        allowNull: false
    },
    dateRequest:{
        type: Sequelize.DATE
    },
    token:{
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    }
})

module.exports = Tokens;