// Essa rota vai ser usada para gerenciar repositórios e usuários para uso de um Administrador


const express = require('express');
const router = express.Router();

// Importando pacote para fazer a validação das entradas do usuário
const { body } = require('express-validator');

// Importando funções que fazem a lógica de negócio, em controllers
const userController = require('../controllers/user');
const repositoryController = require('../controllers/repository');

// Rotas para interação com usuário
    //-> Atualizar dados de um usuário
router.patch('/atualizar-usuario/:username', [
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
            .withMessage('Insira apenas palavras e números! Tente novamente.')
            .trim(),
        body('avatar', 'Seu avatar deve ser uma URL de até 255 caracteres! Tente novamente.')
        .isLength({max: 255}).trim(),
        body('bio', 'Sua bio deve ter no máximo 255 caracteres! Tente novamente.')
        .isLength({max: 255}).trim()
],userController.patchUserAtt);

//-> Deletar um usuário
router.delete('/deletar-usuario/:username', userController.deleteUser);


// Rotas para interação com repositório
    // -> Atualizar repositório de um usuário
    router.patch('/atualizar-repositorio/:username/:repositoryId', [
        body(
            'name',
            'O nome do repositório deve ter no máximo 125 caracteres! Tente novamente.'
        )
            .isLength({ max: 125 })
            .trim(),
        body(
            'description',
            'O nome do repositório deve ter no máximo 225 caracteres! Tente novamente.'
        ).isLength({ max: 225 }).trim(),
        body('public', 'Essa entrada deve ser verdadeiro ou falso').isBoolean()
    ], repositoryController.patchRepository);

        // -> Deletar repositório de um usuário
    router.delete('/deletar-repositorio/:username/:repositoryId', repositoryController.deleteRepository);



module.exports = router;