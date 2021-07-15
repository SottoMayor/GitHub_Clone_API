// Verificação se o usuário está autenticado

// Tabela de Tokens
const Tokens = require('../models/tokens');
// Vamos usar bcryptjs para validar o token vindo do frontend
const bcrypt = require('bcryptjs');


module.exports = (req, res, next) => {
    // Capturando header Authorization da solicitação de entrada
    const authHeader = req.get('Authorization');
    // Verificando se o header Auth está setado
    if(!authHeader){
        const error = new Error('Usuário não autenticado!');
        error.statusCode = 401;
        throw error;
    }

    // Extraindo token
    const token = authHeader.split(' ')[1];

    //Extraindo id do usuário
    const userUsername = token.split('*')[0];
    
    // Buscando token do banco de dados
    Tokens.findOne({ where: { userUsername: userUsername } })
    .then(tokenData => {
        if(!tokenData){
            const error = new Error('Usuário não autenticado!');
            error.statusCode = 401;
            throw error;
        }
        const frontEndToken = token.split('*')[1];
        const backEndToken = tokenData.token;

        let validToken;

        // Verificando se o token extraido do FE bate com o token do BE
        try{
            validToken = bcrypt.compareSync(backEndToken, frontEndToken);
        }
        catch (err){
            err.statusCode = 500;
            throw err
        }
        if(!validToken){
            const error = new Error("Chave de acesso inválida, usuário não autenticado!");
            error.statusCode = 401;
            throw error;
        }

        // Salvando UserId na request
        req.userUsername = userUsername;

        // Se não der erro, deu tudo certo e o usuário foi autenticado!
        next();

    })
    .catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
    
}