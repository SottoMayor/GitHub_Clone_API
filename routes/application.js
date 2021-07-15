// Essa rota vai ser usada para gerenciar repositórios e usuários para uso de um usuário comum


const express = require('express');
const router = express.Router();

// Importando pacote para fazer a validação das entradas do usuário
const { body } = require('express-validator');

// Importando funções que fazem a lógica de negócio, em controllers
const userController = require('../controllers/user');
const repositoryController = require('../controllers/repository');

// Importando middleware para proteção de rotas
const isAuth = require('../middleware/is-auth');

// Rotas para interação com usuário
    // -> Seguir usuário
router.post('/usuarios/:seguir', isAuth, userController.postFollow); // Acessar via -> seguir?target={username}

    // -> Deixar de seguir usuário
router.delete('/usuarios/:deixar-de-seguir', isAuth, userController.deleteFollow); // Acessar via -> deixar-de-seguir?target={username}

    // -> Buscar seguidores do usuário
router.get('/seguidores/:username', userController.getFollowers); // **Trocar para /:username?tab=followers**

    // -> Seguir quem o usuário segue
router.get('/seguindo/:username', userController.getFollowing);  // **Trocar para /:username?tab=following**

    // -> Buscar informações gerais do usuário, repositórios e seguidores
router.get('/:username', userController.getIndex);

// Rotas para interação com repositório
    // -> Criar repositório para um usuário    // **Tirar username**
router.put(
    '/novo-repositorio/:username', isAuth,
    [
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
    ],
    repositoryController.putRepository
);

    // -> Buscar repositórios de um usuário
router.get('/repositorios/:username', repositoryController.getRepositories); // **Trocar para /:username?tab=repositories**

    // -> Dar estrela a um repositório
router.post('/:username/:repositoryId/dar-estrela', isAuth, repositoryController.postStar);

    // -> Retirar estrela de um repositório
router.delete('/:username/:repositoryId/retirar-estrela', isAuth, repositoryController.deleteStar);

    // -> Mostrar repositório que o usuário deu estrela
router.get('/repositorios-com-estrela/:username', repositoryController.getRepositoriesStars); // **Trocar para /:username??tab=stars**

module.exports = router;
