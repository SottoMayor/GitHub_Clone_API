// Fornecendo as informações necessárias para o sequelize se conectar
// ao banco de dados local (no meu caso estou usando MYSQL)

const Sequelize = require('sequelize');

// Configurando conexão -> (banco de dados, usuário do banco de dados, senha do usuário do banco de dados)
const sequelize = new Sequelize('luby-app', 'root', 'davidMySQL', {
    dialect: 'mysql',
    host: 'localhost',
});

module.exports = sequelize;