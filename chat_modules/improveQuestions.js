const generateStructuredOutput = require('../utils/generateStructuredOutput');
const { ResultAnalysisSchema, ResultAnalysisListSchema } = require('../entities');

function updateAnalysis(analysisId, newAnalysis, script) {
    for (let i = 0; i < script.script.result_analysis.length; i++) {
        if (script.script.result_analysis[i].id === analysisId) {
            script.script.result_analysis[i].question = newAnalysis.question;
            break;
        }
    }
}

async function improveQuestions() {
    const intermediaryScriptAnalysis = JSON.parse(JSON.stringify(intermediaryScriptProcedures));
    for (const question of intermediaryScriptAnalysis.script.result_analysis) {
        const questionId = question.id;
        const systemPrompt = `<Instructions>
    Reescreva a questão da análise de resultados com id igual a ${questionId} dentro de <Analysis>. Em <Analysis> você receberá uma questão e você irá reescrever a questão. A sua resposta será a questão reescrita. Considere aprimorar a clareza, coesão e coerência do texto. Cada análise de resultado é uma pergunta aberta que deve ser respondida pelo aluno. Mantenha o conteúdo técnico e educacionalmente relevante. Use as informações em <Script> nas propriedades habilidades_cognitivas, conceitos, habilidades, objetivos_de_aprendizagem e applicable_knowledge_objects. Não escreva uma análise de resultados genérica e curta. Importante: A resposta para a pergunta da questão que você irá reescrever pode ser inferida a partir do conteúdo apresentado no experimento (dentro da propriedade procedures), caso contrário escreva um texto adicional no enunciado da pergunta.</Instructions>
<Script>${JSON.stringify(intermediaryScriptAnalysis)}</Script>`;

        const content = `# Entrada:\n<Analysis>${JSON.stringify(question)}</Analysis>`;
        const output = await generateStructuredOutput(systemPrompt, ResultAnalysisSchema, content);
        updateAnalysis(questionId, output, intermediaryScriptAnalysis);
    }

    const finalScript = JSON.parse(JSON.stringify(intermediaryScriptAnalysis));
    const systemPrompt2 = `<Instructions>
Adicione novas perguntas para a análise de resultados dentro de <Analysis>. Em <Analysis> você receberá a lista atual de questões. A sua resposta será novas questões que serão adicionadas as esses que já existem. Considere a clareza, coesão e coerência do texto. Mantenha o conteúdo técnico e educacionalmente relevante. Use as informações em <Script> nas propriedades habilidades_cognitivas, conceitos, habilidades, objetivos_de_aprendizagem e applicable_knowledge_objects. Não escreva uma análise de resultados genérica e curta. Importante: As respostas para as perguntas das questões que você irá criar precisam ser inferidas a partir do conteúdo apresentado no experimento (que está dentro da propriedade procedures), caso contrário escreva um texto adicional no enunciado da pergunta. A sua resposta deve ser as novas perguntas que serão adicionadas. Não repita as que já existem.</Instructions>
<Script>${JSON.stringify(finalScript)}</Script>`;
    const content2 = `# Entrada:\n<Analysis>${JSON.stringify(
        finalScript.script.result_analysis
    )}</Analysis>`;
    const output2 = await generateStructuredOutput(
        systemPrompt2,
        ResultAnalysisListSchema,
        content2
    );
    finalScript.script.result_analysis.push(...output2.result_analysis);

    return finalScript;
}

module.exports = improveQuestions;
