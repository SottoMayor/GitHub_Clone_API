const express = require('express');
const app = express();

// Configurando body-parser
app.use(express.json());

// Setando Headers para evitar CORS Errors
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Access-Methods', 'GET, POST, PATCH, PUT, DELETE');
    res.setHeader('Access-Control-Access-Headers', 'Content-Type, Authorization');
    next();
})

// Verificando validade do token de acesso
const Tokens = require('./models/tokens');
app.use( (req, res, next) => {
    const authHeader = req.get('Authorization');
    if(!authHeader){
        // Nenhum usuário autenticado
        return next();
    }
    // Extraindo token
    const token = authHeader.split(' ')[1];
    // Extraindo userId do token
    const userUsername = token.split('*')[0];

    Tokens.findOne({ where: {userUsername: userUsername} })
    .then( tokenData => {
        if(!tokenData){
            const error = new Error('Chave de acesso inválida, usuário não autenticado!');
            error.statusCode = 401;
            throw error;
        }
        const tokenExpiration = tokenData.dateRequest;
        if(Date.now() > tokenExpiration){
            // token já expirou!
            tokenData.destroy();
            const error = new Error('A chave de acesso expirou, faça o login novamente!');
            error.statusCode = 403;
            throw error;
        }
        next();
    })
    .catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })

})

// Setando Rotas
const authRoutes = require('./routes/auth');
app.use(authRoutes)
const adminRoutes = require('./routes/admin')
    // -> OBS: O caminho para acessar rotas de administrador devem começar com /admin
app.use('/admin', adminRoutes)
const applicationRoutes = require('./routes/application');
app.use(applicationRoutes)

// Middleware para tratamento de erros
app.use((error, req, res, next) => {
    //console.log(error)

    errorStatus = error.statusCode || 500;
    errorMessage = error.message;

    res.status(errorStatus).json({
        message: errorMessage,
        errorsData: error.data
    })
})

// Associação entre DBs
const User = require('./models/users');
const Repository = require('./models/repositories');
const RepositoryStars = require('./models/repositories-stars');
const FollowerFollowing = require('./models/followers-followings');
// Associação 1 para N
User.hasMany(Repository, {onDelete: 'CASCADE'});
Repository.belongsTo(User);
// Associação N para N -> onDelete e onUpdate são CASCADE por padrão.
User.belongsToMany(Repository, {through: RepositoryStars});
Repository.belongsToMany(User, {through: RepositoryStars});
// Associação N para N -> onDelete e onUpdate são CASCADE por padrão.
User.belongsToMany(User, {through: FollowerFollowing, as: 'following', foreignKey: 'followingUsername'});
User.belongsToMany(User, {through: FollowerFollowing, as: 'follower', foreignKey: 'followerUsername'});


// Aplicação roda em localhost:3000
const sequelize = require('./database/database');
sequelize.sync()
.then( result => {
    app.listen(3000);
})
.catch(err => {
    err.statusCode = 500;
    err.message = 'A conexão com o banco de dados falhou! Tente novamente mais tarde.';
    next(err);
})
