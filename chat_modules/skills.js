const generateStructuredOutput = require('../utils/generateStructuredOutput');
const saveResponseToFile = require('../utils/saveResponseToFile');
const { SkillsSchema } = require('../entities');
/**
 * Obter habilidades necessárias para a prática
 */
async function getSkills() {
    const virtualLaboratory = require('../data/roteiro.json');
    const outline = require('../response/description.json');
    const concepts = require('../response/concepts.json');
    const systemPrompt =
        "Determine quais as habilidade manuais e cognitivas necessárias para realização dessa prática e para entendimento do roteiro de laboratório virtual fornecido. O roteiro é a propriedade `script`, dentro do conteúdo indicado por VirtualLaboratory. A resposta deve estar no formato json e conter apenas a lista de habilidades. Cada habilidade possui as propriedades id, nome, descrição, e tipo ('habilidade manual', 'habilidade cognitiva'). A descrição deve ser um texto detalhado.";
    const content = `
<VirtualLaboratory>${JSON.stringify(virtualLaboratory)}</VirtualLaboratory>
<Outline>${outline}</Outline>
<Concepts>${concepts}</Concepts>
    `;
    try {
        const response = await generateStructuredOutput(systemPrompt, SkillsSchema, content);
        saveResponseToFile('./response/skills.json', response);
    } catch (error) {
        console.error('Erro ao gerar habilidades:', error);
    }
}
module.exports = getSkills;
