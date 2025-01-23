const generateStructuredOutput = require('../utils/generateStructuredOutput');
const saveResponseToFile = require('../utils/saveResponseToFile');
const { ProcedureSchema } = require('../entities');
function updateProcedure(procedureId, newProcedure, script) {
    const procedures = script.script.procedures;
    for (let i = 0; i < procedures.length; i++) {
        if (procedures[i].id === procedureId) {
            procedures[i].intermediate_text = newProcedure.intermediate_text;
            procedures[i].cognitive_hint = newProcedure.cognitive_hint.join(',');
            procedures[i].procedure = newProcedure.procedure;
            break;
        }
    }
}
async function improveProcedures(intermediaryScript) {
    for (const procedure of intermediaryScript.script.procedures) {
        const analysisId = procedure.id;
        const systemPrompt = `<Instructions>
  Reescreva o procedimento de id ${analysisId}, adicionando dicas cognitivas (cognitive_hint) e melhorando o texto (intermediate_text).
  <Script>${JSON.stringify(intermediaryScript)}</Script></Instructions>`;
        const content = `# Entrada:\n<Procedure>${JSON.stringify(procedure)}</Procedure>`;
        // Chama a função de geração de texto (ajuste conforme necessário)
        const output = await generateStructuredOutput(systemPrompt, ProcedureSchema, content);
        const updatedProcedure = output;
        updateProcedure(analysisId, updatedProcedure, intermediaryScript);
    }
    return intermediaryScript;
}
async function reviewScript() {
    const originalScript = require('../data/roteiro.json');
    const outline = require('../response/description.json');
    const concepts = require('../response/concepts.json');
    const skills = require('../response/skills.json');
    const learningObjectives = require('../response/learningObjectives.json');
    const knowledgeObjects = require('../response/knowledgeEvaluation.json');
    const applicable_skills = require('../response/competencyAndSkills.json');
    const extendedScript = originalScript;
    extendedScript.descrição_do_experimento = outline.descrição_do_experimento;
    extendedScript.objetivo_geral = outline.objetivo_geral;
    extendedScript.habilidades_cognitivas = skills.habilidades;
    extendedScript.conceitos = concepts;
    extendedScript.habilidades = applicable_skills;
    extendedScript.objetivos_de_aprendizagem = learningObjectives;
    extendedScript.applicable_knowledge_objects = knowledgeObjects;
    const modifiedScript = await improveProcedures(extendedScript);
    saveResponseToFile('./response/improvedScript.json', modifiedScript);
}
module.exports = reviewScript;
