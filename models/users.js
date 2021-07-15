// Criando uma tabela que guarda informações de usuários

const Sequelize = require('sequelize');
const sequelize = require('../database/database');

const User = sequelize.define('user', {
    username:{
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true,
        allowNull: false,
    },
    name:{
        type: Sequelize.STRING,
        allowNull: false
    },
    email:{
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    location:{
        type: Sequelize.STRING,
        allowNull: false
    },
    avatar: Sequelize.STRING,
    bio:{
        type: Sequelize.STRING,
        defaultValue: 'Olá, eu sou um novo usuário!'
    }

}, {timestamps: true})

module.exports = User;

