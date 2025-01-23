const generateStructuredOutput = require('../utils/generateStructuredOutput');
const { ResultAnalysisListSchema, ResultAnalysisSchema } = require('../entities');
const saveResponseToFile = require('../utils/saveResponseToFile');
function updateAnalysis(analysisId, newAnalysis, script) {
    for (let i = 0; i < script.script.result_analysis.length; i++) {
        if (script.script.result_analysis[i].id === analysisId) {
            script.script.result_analysis[i].question = newAnalysis.question;
            break;
        }
    }
}
async function improveQuestions(intermediaryScriptProcedures) {
    for (const question of intermediaryScriptProcedures.script.result_analysis) {
        const questionId = question.id;
        const systemPrompt = `<Instructions>
    Reescreva a questão da análise de resultados com id igual a ${questionId} dentro de <Analysis>. Em <Analysis> você receberá uma questão e você irá reescrever a questão. A sua resposta será a questão reescrita. Considere aprimorar a clareza, coesão e coerência do texto. Cada análise de resultado é uma pergunta aberta que deve ser respondida pelo aluno. Mantenha o conteúdo técnico e educacionalmente relevante. Use as informações em <Script> nas propriedades habilidades_cognitivas, conceitos, habilidades, objetivos_de_aprendizagem e applicable_knowledge_objects. Não escreva uma análise de resultados genérica e curta. Importante: A resposta para a pergunta da questão que você irá reescrever pode ser inferida a partir do conteúdo apresentado no experimento (dentro da propriedade procedures), caso contrário escreva um texto adicional no enunciado da pergunta.</Instructions>
<Script>${JSON.stringify(intermediaryScriptProcedures)}</Script>`;
        const content = `# Entrada:\n<Analysis>${JSON.stringify(question)}</Analysis>`;
        const output = await generateStructuredOutput(systemPrompt, ResultAnalysisSchema, content);
        updateAnalysis(questionId, output, intermediaryScriptProcedures);
    }
    const systemPrompt2 = `<Instructions>
Adicione novas perguntas para a análise de resultados dentro de <Analysis>. Em <Analysis> você receberá a lista atual de questões. A sua resposta será novas questões que serão adicionadas as esses que já existem. Considere a clareza, coesão e coerência do texto. Mantenha o conteúdo técnico e educacionalmente relevante. Use as informações em <Script> nas propriedades habilidades_cognitivas, conceitos, habilidades, objetivos_de_aprendizagem e applicable_knowledge_objects. Não escreva uma análise de resultados genérica e curta. Importante: As respostas para as perguntas das questões que você irá criar precisam ser inferidas a partir do conteúdo apresentado no experimento (que está dentro da propriedade procedures), caso contrário escreva um texto adicional no enunciado da pergunta. A sua resposta deve ser as novas perguntas que serão adicionadas. Não repita as que já existem.</Instructions>
<Script>${JSON.stringify(intermediaryScriptProcedures)}</Script>`;
    const content2 = `# Entrada:\n<Analysis>${JSON.stringify(
        intermediaryScriptProcedures.script.result_analysis
    )}</Analysis>`;
    const output2 = await generateStructuredOutput(
        systemPrompt2,
        ResultAnalysisListSchema,
        content2
    );
    intermediaryScriptProcedures.script.result_analysis.push(...output2.result_analysis);
    return intermediaryScriptProcedures;
}
async function reviewQuestions() {
    const originalScript = require('../response/improvedScript.json');
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
    const modifiedScript = await improveQuestions(extendedScript);
    saveResponseToFile('./response/improvedQuestions.json', modifiedScript);
}
module.exports = reviewQuestions;
