// Esse controller contém as lógicas de negócio para usuários


// Importando pacote para fazer validação das entradas do usuário
const { validationResult } = require('express-validator');

// Importando tabelas do banco de dados
const User = require('../models/users');
const Repository = require('../models/repositories');
const RepositoryStars = require('../models/repositories-stars');

// Importando Op, ferramenta de sequelize
const { Op } = require('sequelize');

// Criando Repositório
exports.putRepository = (req, res, next) => {
    const username = req.userUsername;

    // Espero receber dados do FrontEnd
    const nameRepo = req.body.name;
    const descRepo = req.body.description;
    const publicRepo = req.body.public;
    const slug = username + '_' + nameRepo.replace(" ", "");

    // Validação de dados <-> Rotas Application
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Algo deu errado na validação!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    // Buscando usuário por meio do username
    User.findOne({ where: { username: username } })
        .then((user) => {
            // Criando repositório
            return user
                .createRepository({
                    name: nameRepo,
                    description: descRepo,
                    public: publicRepo,
                    slug: slug,
                })
                .then((result) => {
                    // Mandando resposta para o FrontEnd
                    res.status(201).json({
                        message: 'Repositório criado com sucesso!',
                        data: result,
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

// Exibindo repositórios
exports.getRepositories = (req, res, next) => {
    // Espero receber do FrontEnd (URL) o username
    const username = req.params.username;
    // Verificando se usuário extraido está cadastrado no DB
    User.findOne({ where: { username: username } })
    .then((user) => {
        if (!user) {
            const error = new Error(
                'O usuário não encontrado! Tente novamente.'
            );
            error.statusCode = 404;
            throw error;
        }
    })
    .catch((err) => {
        // Capturando possíveis erros
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });

    // Extraindo query params
    const tab = req.query.tab;

    if(tab === 'repositorios'){
        Repository.findAll({ where: { userUsername: username } })
        .then((repositories) => {
            // Mandando resposta para o FrontEnd
            res.status(200).json({
                message: `${username} possui ${repositories.length} reposiório(s).`,
                repositoriesData: repositories,
            });
        })
        .catch((err) => {
            // Capturando possíveis erros
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
    }else if(tab === 'estrelas'){
        RepositoryStars.findAll({where: {userUsername: username}})
        .then(repositoriesStars => {
            if(repositoriesStars <= 0){
                const error = new Error(
                    `Você não possui repositórios marcados com estrela.`
                );
                error.statusCode = 200;
                throw error;
            }

            // Guardando os slugs dos repositórios com estrela de um usuário
            const repositoriesArrayslugs = repositoriesStars.map((obj) => {
                return obj.repositorySlug;
            });

            // Buscando repositórios por meio do array de IDs
            return Repository.findAll({ where: {slug: repositoriesArrayslugs} })
            .then( reposStars => {
        
                // Mandando resposta para o FrontEnd
                res.status(200).json({
                    message: `Você deu estrela a ${reposStars.length} repositórios.`,
                    reposStarsNumber: reposStars.length,
                    repositoriesData: reposStars,
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

    }

};

// Atualizando repositório
exports.patchRepository = (req, res, next) => {
    // Extraindo o username e id do repositório da URL
    const username = req.params.username;
    const repositoryId = req.params.repositoryId;

    // Espero receber dados do FrontEnd
    // OBS: É importante que o FrontEnd me retorne TODOS os dados, até mesmo aqueles que o usuário
    // não mexeu.
    const updatedNameRepo = req.body.name;
    const updatedDescRepo = req.body.description;
    const updatedPublicRepo = req.body.public;

    // Validação de dados <-> Rotas Application
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Algo deu errado na validação!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    // Buscando usuário por meio do username
    User.findOne({ where: { username: username } })
        .then((user) => {
            if (!user) {
                const error = new Error(
                    'Usuário não encontrado! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }

            // Guardando informações sobre o ID do usuário
            const userId = user.dataValues.id;

            // Buscando um repositório, pelo ID do repositório e pelo ID do usuário
            return Repository.findOne({
                where: { [Op.and]: [{ id: repositoryId }, { userId: userId }] },
            });
        })
        .then((repository) => {
            if (!repository) {
                const error = new Error(
                    'Repositório não encontrado! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }

            // Atualizando informações do repositório
            repository.name = updatedNameRepo;
            repository.description = updatedDescRepo;
            repository.public = updatedPublicRepo;
            return repository.save();
        })
        .then((updatedRepository) => {
            // Mandando resposta para o FrontEnd
            res.status(200).json({
                message: 'Repositório atualizado com sucesso!',
                updatedRepositoryValues: updatedRepository,
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

// Deletando repositório
exports.deleteRepository = (req, res, next) => {
    // Extraindo o username e id do repositório da URL
    const username = req.params.username;
    const repositoryId = req.params.repositoryId;

    // Buscando usuário por meio do username
    User.findOne({ where: { username: username } })
        .then((user) => {
            if (!user) {
                const error = new Error(
                    'Usuário não encontrado! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }
            // Guardando informações sobre o ID do usuário
            const userId = user.dataValues.id;

            // Buscando um repositório, pelo ID do repositório e pelo ID do usuário
            return Repository.findOne({
                where: { [Op.and]: [{ id: repositoryId }, { userId: userId }] },
            });
        })
        .then((repository) => {
            if (!repository) {
                const error = new Error(
                    'Repositório não encontrado! Tente novamente.'
                );
                error.statusCode = 404;
                throw error;
            }
            // Deletando o repositório selecionadp
            return repository.destroy();
        })
        .then((deletedRepository) => {
            // Mandando resposta para o FrontEnd
            res.status(200).json({
                message: 'Repositório deletado com sucesso!',
                deleteData: deletedRepository.dataValues,
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

// Dando estrela para um repositório
exports.postStar = (req, res, next) => {
    // Extraindo slug do repositório da URL
    const repoSlug = req.params.repoSlug;
    
    const username = req.userUsername;


    Repository.findByPk(repoSlug)
    .then( repository => {
        if (!repository) {
            const error = new Error(
                'Repositório não encontrado! Tente novamente.'
            );
            error.statusCode = 404;
            throw error;
        }

        if(!repository.public){
            const error = new Error(
                'Esse repositório é privado! Portanto, não é permitido dar estrelas a ele.'
            );
            error.statusCode = 422;
            throw error;
        }

        // Adicionando estrela no repositório
        repository.stars += 1;
        return repository.save()
        .then( result => {
            // Dando estrela ao repositório selecionado
            return RepositoryStars.create({
                userUsername: username,
                repositorySlug: repoSlug,
            }).then((createdRepoStar) => {
                // Mandando resposta para o FrontEnd
                res.status(201).json({
                    message: 'Você adicionou uma estrela à esse repositório!',
                    repositoryStar: createdRepoStar,
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

// Retirando estrela de um repositório
exports.deleteStar = (req, res, next) => {
    // Extraindo slug do repositório da URL
    const repoSlug = req.params.repoSlug;
    
    const username = req.userUsername;

            Repository.findByPk(repoSlug)
            .then( repository => {
                if (!repository) {
                    const error = new Error(
                        'Repositório não encontrado! Tente novamente.'
                    );
                    error.statusCode = 404;
                    throw error;
                }

                // Tirando estrela no repositório
                if(repository.stars > 0){
                    repository.stars -= 1;
                }
                return repository.save()
            })
            .then( result => {
            // Buscando um repositório, pelo ID do repositório e pelo ID do usuário
            return RepositoryStars.findOne({
                where: {
                    [Op.and]: [ { userUsername: username }, { repositorySlug: repoSlug } ]
                    }
                })
            })
            .then((repoStar) => {
                if (!repoStar) {
                    const error = new Error(
                        'Repositório não encontrado! Tente novamente.'
                    );
                    error.statusCode = 404;
                    throw error;
                }

                // Excluindo estrela do repositório selecionado
                return repoStar.destroy()
            })
            .then(deletedRepoStar => {
                // Mandando resposta para o FrontEnd
                res.status(200).json({
                    message: 'Você retirou sua estrela desse repositório!',
                    repositoryStar: deletedRepoStar,
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
