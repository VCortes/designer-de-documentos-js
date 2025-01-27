const OpenAI = require('openai');
async function generateOutput(systemPrompt, userContent, includeUsage = false) {
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
        });
        // Extrair a resposta estruturada
        const message = response.choices[0].message.content;
        if (includeUsage) {
            const promptTokens = response.usage.prompt_tokens;
            const completionTokens = response.usage.completion_tokens;
            return {
                message: message,
                promptTokens: promptTokens,
                completionTokens: completionTokens,
            };
        } else {
            return message;
        }
    } catch (error) {
        console.error('Erro ao chamar a API do OpenAI:', error);
        return error;
    }
}
module.exports = generateOutput;
