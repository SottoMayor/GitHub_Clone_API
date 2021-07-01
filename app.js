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

// Verificando se o usuário ainda tá logado
const Tokens = require('./models/tokens');
app.use( (req, res, next) => {
    const authHeader = req.get('Authorization');
    if(!authHeader){
        // Nenhum usuário autenticado
        console.log('Nenhum usuário autenticado');
        return next();
    }
    // Extraindo token
    const token = authHeader.split(' ')[1];
    // Extraindo userId do token
    const userId = token.split('*')[0];

    Tokens.findOne({ where: {userId: userId} })
    .then( tokenData => {
        if(!tokenData){
            const error = new Error('chave de acesso inválida, usuário não autenticado!');
            error.statusCode = 401;
            next(error);
        }
        const tokenExpiration = tokenData.dateRequest;
        if(Date.now() > tokenExpiration){
            // token já expirou!
            console.log('Nenhum usuário autenticado[token destruido]');
            tokenData.destroy();
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
User.belongsToMany(User, {through: FollowerFollowing, as: 'following', foreignKey: 'followingId'});
User.belongsToMany(User, {through: FollowerFollowing, as: 'follower', foreignKey: 'followerId'});


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
