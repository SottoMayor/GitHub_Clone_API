// Essa rota vai ser usada para gerenciar a autenticação do usuário
    // OBS -> A autenticação não foi implementada

const express = require('express');
const router = express.Router();

// Importando pacote para fazer a validação das entradas do usuário
const { body } = require('express-validator');

// Importando funções que fazem a lógica de negócio, em controllers
const userController = require('../controllers/user');

// Importando middleware para proteção de rotas
const isAuth = require('../middleware/is-auth');

// -> Cadastrar novo usuário
router.put(
    '/cadastrar',
    [
        body('name', 'Nome inválido! Tente novamente.').isAlpha('pt-BR', {ignore: ' '}).trim(),
        body('email', 'Email inválido! Tente novamente.')
            .isEmail()
            .isLength({ min: 5 })
            .withMessage(
                'Seu email deve ter ao menos 5 caracteres! Tente novamente.'
            )
            .normalizeEmail(),
        body('location', 'Insira um texto entre 5 e 50 caracteres').isLength({
            min: 5,
            max: 50,
        }),
        body('username', 'Username inválido! Escolha outro.')
            .isAlphanumeric()
            .withMessage('Insira apenas palavras e números, sem espaços e sem acentos! Tente novamente.')
            .trim(),
        body('avatar', 'Seu avatar deve ser uma URL de até 255 caracteres! Tente novamente.')
        .isLength({max: 255}).trim(),
        body('bio', 'Sua bio deve ter no máximo 255 caracteres! Tente novamente.')
        .isLength({max: 255}).trim()
    ],
    userController.putSignup
);

// -> Fazer login de usuário já cadastrado
router.post('/entrar', [
    body('username')
            .isAlphanumeric()
            .withMessage('Insira apenas palavras e números! Tente novamente.')
            .trim()
], userController.postSignin);

// -> Fazer desconectar (logout)
router.delete('/sair', isAuth, userController.deleteSignout);


module.exports = router;
