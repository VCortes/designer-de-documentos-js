const generateStructuredOutput = require('../utils/generateStructuredOutput');
const saveResponseToFile = require('../utils/saveResponseToFile');
const { LearningObjectivesSchema } = require('../entities');
async function getLearningObjectives() {
    const virtualLaboratory = require('../data/roteiro.json');
    const outline = require('../response/description.json');
    const concepts = require('../response/concepts.json');
    const skills = require('../response/skills.json');

    const systemPrompt =
        'Elabore e liste objetivos de aprendizagem seguindo os princípios da taxonomia de Bloom. Utilize o conteúdo do roteiro de laboratório virtual fornecido (o roteiro é a propriedade `script`), bem como os conceitos e habilidades já listados. Cada item dessa lista deve ter os subtitems: descrição, relação com a prática, procedimentos relacionados e avaliação do objetivo. Por sua vez, procedimentos relacionados lista quais dos procedimentos do roteiro são relacionados ao objetivo. A avaliação do objetivo descreve como ele pode ser avaliado ao longos dos procedimentos do roteiro ou na seção avaliação dos resultados. A resposta deve estar no formato json. Cada objetivo possui as propriedades id, tipo, descrição, relação_com_a_prática, procedimentos_relacionados (lista), avaliação_do_objetivo. A propriedade tipo diz respeito a qual das camadas do domínio cognitivo o objetivo pertence. A camada pode aparecer em mais de um objetivo, se necessário. Os textos devem ser detalhados e claros. Os textos podem ter uma ou mais linhas, um ou mais parágrafos, conforme necessário.';

    const content = `
<VirtualLaboratory>${JSON.stringify(virtualLaboratory)}</VirtualLaboratory> 
<Outline>${JSON.stringify(outline)}</Outline>
<Concepts>${JSON.stringify(concepts)}</Concepts>
<Skills>${JSON.stringify(skills)}</Skills>
`;

    try {
        const output = await generateStructuredOutput(
            systemPrompt,
            LearningObjectivesSchema,
            content
        );
        saveResponseToFile('./response/learningObjectives.json', output);
    } catch (error) {
        console.error(error);
    }
}

module.exports = getLearningObjectives;
