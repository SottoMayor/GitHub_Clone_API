// Criando uma tabela que associa usuários e repositório marcados com estrela

const Sequelize = require('sequelize');
const sequelize = require('../database/database');

const RepositoryStars = sequelize.define('repositoryStars', {
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
        autoIncrement: true
    }
}, {timestamps: true});

module.exports = RepositoryStars;