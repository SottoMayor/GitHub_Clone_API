// Criando uma tabela que guarda informações de usuários

const Sequelize = require('sequelize');
const sequelize = require('../database/database');

const User = sequelize.define('user', {
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
        autoIncrement: true
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
    username:{
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    avatar: Sequelize.STRING,
    bio:{
        type: Sequelize.STRING,
        defaultValue: 'Olá, eu sou um novo usuário!'
    }

}, {timestamps: true})

module.exports = User;

