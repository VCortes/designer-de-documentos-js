#!/usr/bin/env node
const inquirer = require('inquirer');
const chalk = require('chalk');
const figlet = require('figlet');
const getDescription = require('./chat_modules/description');
const getConcepts = require('./chat_modules/concepts');
const getSkills = require('./chat_modules/skills');
const getLearningObjectives = require('./chat_modules/learningObjectives');
const evaluateKnowledgeObjects = require('./chat_modules/knowledgeObjects');
const competencyAndSkills = require('./chat_modules/competencyAndSkills');
const findQuestions = require('./utils/findQuestions');
const reviewScript = require('./chat_modules/reviewScript');
const reviewQuestions = require('./chat_modules/reviewQuestions');
const parseQuestionKnowledgeObjects = require('./chat_modules/parseQuestionKnowledgeObjects');
const parseQuestionKnowledgeObjects2 = require('./chat_modules/parseQuestionKnowledgeObjects2');
// Configuração do dotenv
require('dotenv').config();

// Definição das opções do menu e suas funções correspondentes
const menuOptions = [
    { name: 'Descrição', action: getDescription },
    { name: 'Conceitos', action: getConcepts },
    { name: 'Objetivos de Aprendizagem', action: getLearningObjectives },
    { name: 'Habilidades', action: getSkills },
    { name: 'Objetos de Conhecimento', action: evaluateKnowledgeObjects },
    { name: 'Competências e Habilidades', action: competencyAndSkills },
    { name: 'Encontrar Questões do ENEM', action: findQuestions },
    { name: 'Revisar Roteiro', action: reviewScript },
    { name: 'Revisar Questões', action: reviewQuestions },
    {
        name: 'Associar Questões aos Objetos de Conhecimento',
        action: parseQuestionKnowledgeObjects,
    },
    {
        name: 'Associar Questões aos Objetos de Conhecimento 2',
        action: parseQuestionKnowledgeObjects2,
    },
];
// Função para exibir o banner inicial
function exibirBanner() {
    console.log(
        chalk.yellow(
            figlet.textSync('Lista de Funções', {
                horizontalLayout: 'default',
                verticalLayout: 'default',
            })
        )
    );
}
// Função principal para gerenciar o CLI
function iniciarCLI() {
    exibirBanner();
    inquirer
        .prompt([
            {
                type: 'list',
                name: 'acao',
                message: 'O que você gostaria de fazer?',
                choices: menuOptions.map((option) => option.name),
            },
        ])
        .then(async (resposta) => {
            const opçãoSelecionada = menuOptions.find((option) => option.name === resposta.acao);
            if (opçãoSelecionada && typeof opçãoSelecionada.action === 'function') {
                await opçãoSelecionada.action();
            } else {
                console.log(chalk.red('Opção inválida.'));
            }
            voltarMenu();
        })
        .catch((erro) => {
            console.error(chalk.red('Ocorreu um erro:'), erro);
        });
}
// Função para voltar ao menu principal
function voltarMenu() {
    inquirer
        .prompt([
            {
                type: 'confirm',
                name: 'voltar',
                message: 'Deseja voltar ao menu principal?',
                default: true,
            },
        ])
        .then((resposta) => {
            if (resposta.voltar) {
                iniciarCLI();
            } else {
                console.log(chalk.green('Obrigado por usar o CLI. Até logo!'));
                process.exit(0);
            }
        })
        .catch((erro) => {
            console.error(chalk.red('Ocorreu um erro:'), erro);
        });
}
// Iniciar o CLI
iniciarCLI();
