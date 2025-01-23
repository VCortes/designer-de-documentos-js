const { z } = require('zod');
const generateStructuredOutput = require('../utils/generateStructuredOutput');
const saveResponseToFile = require('../utils/saveResponseToFile');
const { ExperimentoSchema } = require('../entities');
/**
 * Obter descrição do roteiro e objetivo geral
 */
async function getDescription() {
    // Obter dados
    const roteiro = require('../data/roteiro.json');
    // Definir o prompt do sistema
    const systemPrompt =
        'Escreva uma descrição e o objetivo geral do experimento proposto no roteiro. O roteiro é a propriedade `script`. A resposta deve estar no formato json. Possui as propriedades descrição_do_experimento e objetivo_geral. Devem ser textos detalhados e multilinhas e/ou multiparágrafos.';
    // Obter resposta
    try {
        const content = await generateStructuredOutput(
            systemPrompt,
            ExperimentoSchema,
            JSON.stringify(roteiro)
        );
        saveResponseToFile('./response/description.json', content);
    } catch (error) {
        console.error('Erro ao chamar a API do OpenAI:', error);
        return;
    }
}
module.exports = getDescription;
