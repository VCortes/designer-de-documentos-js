const OpenAI = require('openai');
const { zodResponseFormat } = require('openai/helpers/zod');
// Dotenv
// Função para gerar a saída estruturada
async function generateStructuredOutput(systemPrompt, schema, userContent, includeUsage = false) {
    try {
        // Configuração da API do OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY, // Certifique-se de que sua chave de API está definida nas variáveis de ambiente
        });
        const response = await openai.beta.chat.completions.parse({
            model: process.env.HIGH_LEVEL_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent },
            ],
            // Especificar o formato de resposta estruturada usando o esquema Zod
            response_format: zodResponseFormat(schema, 'response'),
        });
        // Extrair a resposta estruturada
        const message = response.choices[0].message.content;
        if (response.choices[0].message.parsed.refusal) {
            console.error('Recusa da API:', message.refusal);
            return null;
        }
        if (includeUsage) {
            const promptTokens = response.usage.prompt_tokens;
            const completionTokens = response.usage.completion_tokens;
            return {
                message: JSON.parse(message),
                promptTokens: promptTokens,
                completionTokens: completionTokens,
            };
        } else {
            return JSON.parse(message);
        }
    } catch (error) {
        console.error('Erro ao chamar a API do OpenAI:', error);
        return error;
    }
}

module.exports = generateStructuredOutput;
