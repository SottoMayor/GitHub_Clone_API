// Esse controller contém as lógicas de negócio para usuários


// Importando pacote para fazer validação das entradas do usuário
const { validationResult } = require('express-validator');

const { Op } = require('sequelize');

const bcrypt = require('bcryptjs');

// Parte de Autenticação

// Importando tabelas do banco de dados
const User = require('../models/users');
const Tokens = require('../models/tokens');
const FollowerFollowing = require('../models/followers-followings');
const Repository = require('../models/repositories');


// Cadastrando usuário
exports.putSignup = (req, res, next) => {
    // Dados que espero receber do usuário
    const name = req.body.name;
    const email = req.body.email;
    const location = req.body.location;
    const username = req.body.username;
    const avatar = req.body.avatar;
    const bio = req.body.bio;

    // Validação de dados <-> Rotas Auth
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Algo deu errado na validação!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    // Buscando usuário por email ou username
    User.findOne({
        where: { [Op.or]: [{ email: email }, { username: username }] },
    })
        .then((user) => {
            if (user) {
                const error = new Error(
                    'Esse email ou username já existe(m)! Escolha outro(s).'
                );
                error.statusCode = 422;
                throw error;
            }

            // Criando usuário

            User.create({
                name: name,
                email: email,
                location: location,
                username: username,
                avatar: avatar,
                bio: bio,
            }).then((user) => {
                // Mandando resposta para o FrontEnd
                res.status(201).json({
                    message: 'Usuário criado com sucesso!',
                    userData: user.dataValues,
                });
            });
        })
        .catch((err) => {
            // Capturando possíveis erros
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

// Autenticação de usuários
exports.postSignin = (req, res, next) => {
    // Extraindo username da URL
    const username = req.body.username;

    let userData;

    // Validação de dados <-> Rotas Auth
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Algo deu errado na validação!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    // Buscando usuário pelo username
    User.findOne({ where: { username: username } })
        .then((user) => {
            if (!user) {
                const error = new Error(
                    'Usuário não encontrado! Tente novamente'
                );
                error.statusCode = 404;
                throw error;
            }

            userData = user;

            return Tokens.findOne({ where: { userId: userData.dataValues.id } })
        })
        .then(tokenExists => {

            // Não é um erro de fato, apenas uma indicação!
            if(tokenExists){
                const error = new Error('Usuário já autenticado!');
                error.statusCode = 200;
                throw error;
            }

            // Guardando dados para criar o token
            const date = new Date(Date.now()).toISOString();
            const userId = userData.dataValues.id;
            const token = userId.toString() + '_' + date;

            // Criando token
            return Tokens.create({
                userId: userId,
                dateRequest: date,
                token: token,
                dateRequest: Date.now() + (1000*60*60*2) // token de autenticação tem validade de 2h
            }).then((token) => {
                // Criptografar token!
                return bcrypt.hash(token.dataValues.token, 12);
            })
            .then(criptToken => {
                // Mandando resposta para o FrontEnd
                res.status(200).json({
                    message: 'Usuário encontrado com sucesso!',
                    userData: userData.dataValues,
                    token: userData.dataValues.id + '*' +criptToken
                });
            })
        })
        .catch((err) => {
            // Capturando possíveis erros
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

// Logout do usuário
exports.deleteSignout = (req, res, next) => {
    // Extraindo o ID do usuário da solicitação de entrada
    const userId = req.userId

    // Buscando token de acesso pelo ID do usuário
    Tokens.findOne({ where: {userId: userId} })
    .then(token => {
        return token.destroy()
    })
    .then( deletedToken => {
        // Mandando resposta pro frontEnd
        res.status(200).json({
            message: `O usuário fez logout!`,
            deletedToken: deletedToken
        })
    })
    .catch((err) => {
        // Capturando possíveis erros
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
}

// Parte de Interação com Usuário

exports.getIndex = (req, res, next) => {
    // Espero receber do FrontEnd (URL) o username
    const username = req.params.username;

    let userData;
    let userId;
    let followersCount;
    let followingCount;
    let repositoriesCount;

    // Buscando usuário pelo username
    User.findOne({ where: { username: username } })
        .then((user) => {
            if (!user) {
                const error = new Error(
                    'Usuário não encontrado! Tente novamente'
                );
                error.statusCode = 404;
                throw error;
            }

            // Guardando dados do usuário encontrado
            userData = user;
            // Guardando ID do usuário encontrado
            userId = user.dataValues.id;

            // Buscando seguidores do usuário
            return FollowerFollowing.findAll({
                where: { followingId: userId },
            });
        })
        .then((followData) => {
            if (!followData) {
                const error = new Error(
                    'O usuário não encontrado! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }

            // Guardando número de seguidores
            followersCount = followData.length;

            // Buscando usuários que o usuário segue
            return FollowerFollowing.findAll({ where: { followerId: userId } });
        })
        .then((followData) => {
            if (!followData) {
                const error = new Error(
                    'O usuário não encontrado! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }

            // Guardando número de seguidos
            followingCount = followData.length;

            // Buscando repositórios do usuário
            return Repository.findAll({ where: { userId: userId } })
        })
        .then(repositories => {
            if (!repositories) {
                const error = new Error(
                    'Repositórios não encontrados! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }

            // Guardando número de repositórios
            repositoriesCount = repositories.length;

            // Mandando resposta para o FrontEnd
            res.status(200).json({
                message: `Dados do usuário recuperados com sucesso! ${userData.username} tem ${followersCount} seguidores e segue ${followingCount} usuários`,
                userData: userData,
                followingCount: followingCount,
                followersCount: followersCount,
                repositoriesCount: repositoriesCount
            });
        })
        .catch((err) => {
            // Capturando possíveis erros
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

// Utualizando user -> OBS: ADMINs
exports.patchUserAtt = (req, res, next) => {
    // Espero receber do FrontEnd (URL) o username do usuário que será atualizado
    const userIdentifier = req.params.username;

    // OBS: É importante que o FrontEnd me retorne TODOS os dados, até mesmo aqueles que o usuário
    // não mexeu.
    const updatedName = req.body.name;
    const updatedEmail = req.body.email;
    const updatedLocation = req.body.location;
    const updatedUsername = req.body.username;
    const updatedAvatar = req.body.avatar;
    const updatedBio = req.body.bio;

    // Validação de dados <-> Rotas Admin
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Algo deu errado na validação!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    // Buscando usuário pelo username
    User.findOne({ where: { username: userIdentifier } })
        .then((user) => {
            if (!user) {
                const error = new Error(
                    'Usuário não encontrado! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }

            // Atualizando usuário
            user.name = updatedName;
            user.email = updatedEmail;
            user.location = updatedLocation;
            user.username = updatedUsername;
            user.avatar = updatedAvatar;
            user.bio = updatedBio;

            // Salvando atualizações
            return user.save().then((updatedUser) => {
                // Mandando resposta para o FrontEnd
                res.status(200).json({
                    message: 'Usuário atualizado com sucesso!',
                    updatedValues: updatedUser.dataValues,
                });
            });
        })
        .catch((err) => {
            // Capturando possíveis erros
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

// Excluindo usuário
exports.deleteUser = (req, res, next) => {
    // Espero receber do FrontEnd (URL) o username do usuário que será atualizado
    const userIdentifier = req.params.username;

    // Buscando usuário pelo username
    User.findOne({ where: { username: userIdentifier } })
        .then((user) => {
            if (!user) {
                const error = new Error(
                    'Usuário não encontrado! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }
            return user.destroy();
        })
        .then((result) => {
            // Mandando resposta para o FrontEnd
            res.status(200).json({
                message: 'Usuário apagado com sucesso!',
                deletedValues: result.dataValues,
            });
        })
        .catch((err) => {
            // Capturando possíveis erros
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

// Seguir outro usuário
exports.postFollow = (req, res, next) => {
    // Extraindo username e usernameFollowing da URL
    const username = req.params.username;
    const usernameFollowing = req.params.usernameFollowing;

    // Um usuário não pode ser seguidor dele mesmo
    if (username === usernameFollowing) {
        const error = new Error('Você não pode se seguir!');
        error.statusCode = 422;
        throw error;
    }

    let followingId;
    let followerId;

    // Buscando usuário pelo username
    User.findOne({ where: { username: username } })
        .then((user) => {
            if (!user) {
                const error = new Error(
                    'Usuário não encontrado! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }
            // Guardando o ID do usuário que será seguido
            followerId = user.dataValues.id;

            // Buscando usuário a ser seguido pelo username
            return User.findOne({
                where: { username: usernameFollowing },
            }).then((user) => {
                if (!user) {
                    const error = new Error(
                        'O usuário que você quer seguir não foi encontrado! Tente novamente.'
                    );
                    error.statusCode = 404;
                    throw error;
                }
                followingId = user.dataValues.id;

                // Seguindo usuários
                return FollowerFollowing.create({
                    followerId: followerId,
                    followingId: followingId,
                }).then((followData) => {
                // Mandando resposta para o FrontEnd
                    res.status(200).json({
                        message: `${username} passou a seguir ${usernameFollowing}`,
                        followData: followData,
                    });
                });
            });
        })
        .catch((err) => {
            // Capturando possíveis erros
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

// Deixar de seguir outro usuário
exports.deleteFollow = (req, res, next) => {
    // Extraindo username e usernameFollowing da URL
    const userId = req.userId;
    const usernameFollowing = req.params.usernameFollowing;

     User.findOne({
            where: { username: usernameFollowing }
        }).then((user) => {
            if (!user) {
                const error = new Error(
                    'O usuário que você quer seguir não foi encontrado! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }
            // Guardando ID do usuário que será seguido
            followingId = user.dataValues.id;

            // Buscando a relação entre seguidor e seguido
            return FollowerFollowing.findOne({
                where: {
                    [Op.and]: [
                        { followerId: userId },
                        { followingId: followingId },
                    ],
                },
            })
            .then((followData) => {
                if (!followData) {
                    const error = new Error(
                        `Você não segue ${usernameFollowing}`
                    );
                    error.statusCode = 422;
                    throw error;
                }
                // Deletando relação entre seguidor e seguido
                return followData.destroy();
                })
            .then((deletedFollowData) => {
                // Mandando resposta para o FrontEnd
                res.status(200).json({
                    message: `${username} parou de seguir ${usernameFollowing}`,
                    deletedFollowData: deletedFollowData,
                });
            });
        })
        .catch((err) => {
            // Capturando possíveis erros
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

// Mostrar seguidores
exports.getFollowers = (req, res, next) => {
    // Extraindo username e usernameFollowing da URL
    const username = req.params.username;

    let userId;

    // Buscando usuário pelo username
    User.findOne({ where: { username: username } })
        .then((user) => {
            if (!user) {
                const error = new Error(
                    'O usuário que você quer seguir não foi encontrado! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }
            // Guardando ID do usuário
            userId = user.dataValues.id;

            // Buscando seguidores do usuário de ID userId
            return FollowerFollowing.findAll({
                where: { followingId: userId },
            });
        })
        .then((followData) => {
            if (!followData) {
                const error = new Error(
                    'O usuário não encontrado! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }

            // Guardando IDs dos seguidores
            const followersIds = followData.map((obj) => {
                return obj.dataValues.followerId;
            });

            // Buscando seguidores pelos IDs
            return User.findAll({ where: { id: followersIds } });
        })
        .then((followersData) => {
            if (!followersData) {
                const error = new Error(
                    'O seguidores não encontrados! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }

            // Mandando resposta para o FrontEnd
            res.status(200).json({
                message: `Você tem ${followersData.length} seguidor(es)`,
                followersData: followersData,
            });
        })
        .catch((err) => {
            // Capturando possíveis erros
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

// Mostrar usuários seguidos
exports.getFollowing = (req, res, next) => {
    // Extraindo username e usernameFollowing da URL
    const username = req.params.username;

    let userId;

    // Buscando usuário pelo username
    User.findOne({ where: { username: username } })
        .then((user) => {
            if (!user) {
                const error = new Error(
                    'O usuário que você quer seguir não foi encontrado! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }
            // Guardando o ID do usuário
            userId = user.dataValues.id;

             // Buscando que o usuário (de ID userId) segue
            return FollowerFollowing.findAll({ where: { followerId: userId } });
        })
        .then((followData) => {
            if (!followData) {
                const error = new Error(
                    'O usuário não encontrado! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }

            // Guardando IDs de usuários seguidos
            const followingIds = followData.map((obj) => {
                return obj.dataValues.followingId;
            });

            // Buscando usuários seguidos pelos IDs
            return User.findAll({ where: { id: followingIds } });
        })
        .then((followingData) => {
            if (!followingData) {
                const error = new Error(
                    'O seguidores não encontrados! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }

            // Mandando resposta para o FrontEnd
            res.status(200).json({
                message: `Você segue ${followingData.length} usuário(s)`,
                followingData: followingData,
            });
        })
        .catch((err) => {
            // Capturando possíveis erros
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};
