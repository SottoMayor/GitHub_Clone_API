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
    
    // Extraindo token do header Auth
    const frontEndToken = authHeader.split(' ')[1];
    const backEndToken = await Tokens.findOne({ where: { userId: req.userData.id } })

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
        const error = new Error("Usuário não autenticado!");
        error.statusCode = 401;
        throw error;
    }

    // Se não der erro, deu tudo certo e o usuário foi autenticado!
    next();

}