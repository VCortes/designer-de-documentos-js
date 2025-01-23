const generateStructuredOutput = require('../utils/generateStructuredOutput');
const saveResponseToFile = require('../utils/saveResponseToFile');
const { KnowledgeFieldSchema } = require('../entities');
function findCompetencyArea(knowledgeObjects, areaName, discipline) {
    const relatedAreas = [];
    for (const area of knowledgeObjects['áreas_de_competência']) {
        if (area['nome'] === areaName) {
            if (discipline) {
                if ('disciplina' in area && area['disciplina'] === discipline) {
                    return area;
                }
            } else {
                relatedAreas.push(area);
            }
        }
    }
    const combinedArea = JSON.parse(JSON.stringify(relatedAreas[0]));
    for (let i = 1; i < relatedAreas.length; i++) {
        combinedArea['categorias'].push(...relatedAreas[i]['categorias']);
        combinedArea['disciplina'] += `, ${relatedAreas[i]['disciplina']}`;
    }
    return combinedArea;
}

function transformData(data) {
    const transformedDict = {
        higly_correlated: [],
        medium_correlated: [],
        low_correlated: [],
    };

    function getGroupByScore(score) {
        if (score === 5) return 'higly_correlated';
        if (score === 4) return 'medium_correlated';
        if (score === 3) return 'low_correlated';
        return null;
    }

    const groups = {
        higly_correlated: {},
        medium_correlated: {},
        low_correlated: {},
    };

    for (const block of data) {
        const competencyArea = block['knowledge_field_name'];
        const curriculumComponent = block['curriculum_component'];
        for (const category of block['categories']) {
            const categoryName = category['category_name'];
            for (const obj of category['objects']) {
                const group = getGroupByScore(obj['relevance_score']);
                if (!group) continue;
                const key = `${competencyArea}##${curriculumComponent}`;
                if (!groups[group][key]) groups[group][key] = { categories: {} };
                if (!groups[group][key]['categories'][categoryName]) {
                    groups[group][key]['categories'][categoryName] = [];
                }
                groups[group][key]['categories'][categoryName].push(obj);
            }
        }
    }

    for (const groupName of ['higly_correlated', 'medium_correlated', 'low_correlated']) {
        for (const key of Object.keys(groups[groupName])) {
            const [competencyAreaName, curriculumComponent] = key.split('##');
            const catData = groups[groupName][key];
            const finalCategories = [];
            for (const catName of Object.keys(catData['categories'])) {
                finalCategories.push({
                    category_name: catName,
                    objects: catData['categories'][catName],
                });
            }
            transformedDict[groupName].push({
                competency_area_name: competencyAreaName,
                curriculum_component: curriculumComponent,
                categories: finalCategories,
            });
        }
    }
    return transformedDict;
}

async function evaluateKnowledgeObjects() {
    const virtualLaboratory = require('../data/roteiro.json');
    const outline = require('../response/description.json');
    const concepts = require('../response/concepts.json');
    const skills = require('../response/skills.json');
    const learningObjectives = require('../response/learningObjectives.json');
    const knowledgeObjects = require('../data/knowledgeObjects.json');

    const systemPrompt = `
<Instructions>
Dada a categoria de objetos de conhecimento e seus respectivos objetos dentro da tag <KnowledgeObjects> e considerando a área de conhecimento ${
        virtualLaboratory.area_of_knowledge
    } e o componente curricular ${
        virtualLaboratory.curricular_component
    } (curriculum_component), indique para cada objeto de conhecimento em <KnowledgeObjects> numa escala de 1 a 5 o quanto que o objeto de conhecimento é ou pode ser abordado no laboratório virtual descrito em <VirtualLaboratory>. Utilize o conteúdo em <Outline>, <Concepts> e <Skills> para embasar a resposta.
Significado da escala: 1 - Não tem relação com o laboratório virtual; 2 - Tem pouca relação com o laboratório virtual; 3 - Tem relação mediana com o laboratório virtual; 4 - Tem relação significativa com o laboratório virtual; 5 - Tem relação total com o laboratório virtual. 
# Exemplo de saída:
Nome da categoria de objetos de conhecimento: Conhecimentos básicos e fundamentais:
 Objetos de conhecimento: 
 - Noções de ordem de grandeza: 4
 - Notação Científica: 5
 - Sistema Internacional de Unidades: 1
 - Metodologia de investigação: a procura de regularidades e de sinais na interpretação física do mundo: 3
</Instructions>
<VirtualLaboratory>${JSON.stringify(virtualLaboratory)}</VirtualLaboratory> 
<Outline>${JSON.stringify(outline)}</Outline>
<Concepts>${JSON.stringify(concepts)}</Concepts>
<Skills>${JSON.stringify(skills)}</Skills>
<LearningObjectives>${JSON.stringify(learningObjectives)}</LearningObjectives>
`;

    const competencyArea = findCompetencyArea(
        knowledgeObjects,
        virtualLaboratory.area_of_knowledge,
        virtualLaboratory.curricular_component
    );

    const knowledgeEvaluationScore = [];
    const numCategories = competencyArea['categorias'].length;
    for (let i = 0; i < numCategories; i++) {
        console.log(`Processando categoria ${i + 1} de ${numCategories}...`);
        const category = competencyArea['categorias'][i];
        let categoryText = `Nome da categoria de objetos de conhecimento: ${category['nome']}:\n Objetos de conhecimento:\n`;
        for (const obj of category['objetos']) {
            categoryText += ` - ${obj}\n`;
        }
        const content = `# Entrada:\n<KnowledgeObjects>${categoryText}</KnowledgeObjects>`;
        // Supondo que generateStructuredOutput seja similar a generate_chat_output
        const output = await generateStructuredOutput(systemPrompt, KnowledgeFieldSchema, content);
        knowledgeEvaluationScore.push(output);
    }

    const applicableKnowledgeObjects = transformData(knowledgeEvaluationScore);

    saveResponseToFile('./response/knowledgeEvaluation.json', applicableKnowledgeObjects);
}

module.exports = evaluateKnowledgeObjects;
