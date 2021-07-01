// Criando uma tabela que associa usuários que seguem e que são seguidos

const Sequelize = require('sequelize');
const sequelize = require('../database/database');

const FollowerFollowing = sequelize.define('followersFollowings', {
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        unique: true,
        autoIncrement: true
    }
}, {timestamps: true});

module.exports = FollowerFollowing;