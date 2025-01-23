const generateStructuredOutput = require('../utils/generateStructuredOutput');
const saveResponseToFile = require('../utils/saveResponseToFile');
const { ConceptsSchema } = require('../entities');
/**
 * Extrair conceitos implícitos e explícitos do roteiro.
 */
async function getConcepts() {
    // Obter dados
    const roteiro = require('../data/roteiro.json');

    // Definir o prompt do sistema
    const systemPrompt =
        "Liste os conceitos teóricos e práticos relacionados com a prática experimental descrita no roteiro de laboratório virtual fornecido. O roteiro é a propriedade `script`. Esses conceitos podem ou não já estar presentes no texto do roteiro. A resposta deve estar no formato json e conter apenas a lista de conceitos. Cada conceito possui id, nome, descrição, tipo ('conceito teórico', 'conceito prático'), e se está presente ou não ('já_abordado':boolean). A descrição deve ser um texto detalhado.";
    // Obter resposta
    try {
        const content = await generateStructuredOutput(
            systemPrompt,
            ConceptsSchema,
            JSON.stringify(roteiro)
        );
        // Salvar resposta
        saveResponseToFile('./response/concepts.json', content);
    } catch (error) {}
}
module.exports = getConcepts;
