// Criando uma tabela que guarda informações de repositórios

const Sequelize = require('sequelize');
const sequelize = require('../database/database');

const Repository = sequelize.define('repository', {
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
    description:{
        type: Sequelize.STRING,
        defaultValue: 'Novo repositório!'
    }, 
    public: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    slug:{
        type: Sequelize.STRING,
        allowNull: false
    },
    stars:{
        type: Sequelize.INTEGER,
        defaultValue: 0
    }
}, {timestamps: true});

module.exports = Repository;