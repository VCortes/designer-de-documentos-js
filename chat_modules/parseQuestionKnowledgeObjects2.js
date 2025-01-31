const saveResponseToFile = require('../utils/saveResponseToFile');
const generateStructuredOutput = require('../utils/generateStructuredOutput');
const generateOutput = require('../utils/generateOutput');
const { KnowledgeObjectListFile, Questions, QuestionKnowledgeObject } = require('../entities');
function validateKnowledgeObjects(knowledgeObjects, schema) {
    try {
        schema.parse(knowledgeObjects);
        console.log('Objetos válidos');
    } catch (error) {
        console.error('Objetos inválidos:', error);
    }
}
// Mapeamento de disciplina da questão para o nome da área de competência
const disciplineMap = {
    matematica: 'Matemática e suas Tecnologias',
    'ciencias-natureza': 'Ciências da Natureza e suas Tecnologias',
    'ciencias-humanas': 'Ciências Humanas e suas Tecnologias',
    linguagens: 'Linguagem, Códigos e suas Tecnologias',
};
const tokenRecords = {
    quantitity: 0,
    completionTokens: 0,
    promptTokens: 0,
};
function parseRelatedObjects(input) {
    const startTag = '<objetos_relacionados>';
    const endTag = '</objetos_relacionados>';
    const startIdx = input.indexOf(startTag);
    const endIdx = input.indexOf(endTag);
    let selectedObjects = [];
    if (startIdx !== -1 && endIdx !== -1) {
        const content = input.slice(startIdx + startTag.length, endIdx).trim();
        const lines = content
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line);
        for (const line of lines) {
            const parts = line.split(' // ').map((part) => part.trim());
            if (parts.length === 3) {
                selectedObjects.push({
                    id: parts[0],
                    category: parts[1],
                    object: parts[2],
                });
            }
        }
    }
    return selectedObjects;
}
async function parseQuestionKnowledgeObjects2() {
    // Carregar questões
    const questions = require('../data/enem-questions.json');
    // Filtrar por questões entre 2014 e 2024
    const preFilteredQuestions = questions.filter(
        (question) => question.year >= 2014 && question.year <= 2024
    );
    // Filtrar questões que ainda não possuem objetos de conhecimento
    const preFilteredQuestions2 = preFilteredQuestions.filter(
        (question) => !question.knowledge_objects
    );
    // Filtrar questões que possuem language != null
    const filteredQuestions = preFilteredQuestions2.filter(
        (question) => question.language === null
    );
    //! Debug
    // Orderar aleatoriamente as questões
    filteredQuestions.sort(() => Math.random() - 0.5);
    // Validar questões
    validateKnowledgeObjects(filteredQuestions, Questions);
    // Obter objetos de conhecimento do ENEM
    const knowledgeObjects = require('../data/knowledgeObjects.json');
    // Validação dos objetos de conhecimento
    validateKnowledgeObjects(knowledgeObjects, KnowledgeObjectListFile);
    // Questões para processar
    const selectedQuestions = filteredQuestions.slice(0, 200);
    let iteration = 0;
    //! Para cada questão (Debug)
    for (const question of selectedQuestions) {
        iteration++;
        console.log(`Progresso: Questão ${iteration} de ${selectedQuestions.length}`);
        console.log(
            `Questão ${question.numSeqYearIndex} - ${question.discipline} - ${question.year}`
        );
        // Filtrar objetos de conhecimento da disciplina
        const targetArea = disciplineMap[question.discipline];
        const matchedAreas = knowledgeObjects.áreas_de_competência.filter(
            (area) => area.nome === targetArea
        );
        // Vetor de categorias e seus objetos para cada questão
        const questionKnowledgeObjects = [];
        matchedAreas.forEach((area) => {
            area.categorias.forEach((cat) => {
                questionKnowledgeObjects.push({
                    nome_da_categoria: cat.nome,
                    objetos: cat.objetos,
                });
            });
        });
        const z = require('zod');
        const SelectedKnowledgeObjects = z.array(
            z.object({
                id: z.string(),
                category: z.string(),
                object: z.string(),
            })
        );
        const KnowledgeObjectsSelection = z.object({
            selectedObjects: SelectedKnowledgeObjects,
        });
        // Para cada grupo de no máximo 3 elementos em questionKnowledgeObjects
        const groupedQuestionKnowledgeObjects = questionKnowledgeObjects.reduce((acc, curr, i) => {
            if (i % 3 === 0) acc.push([]);
            acc[acc.length - 1].push(curr);
            return acc;
        }, []);
        const matchedKnowledgeObjects = [];
        for (const knowledgeObjectGroup of groupedQuestionKnowledgeObjects) {
            // Exibe o progresso
            console.log(
                `Progresso: grupo ${
                    groupedQuestionKnowledgeObjects.indexOf(knowledgeObjectGroup) + 1
                } de ${groupedQuestionKnowledgeObjects.length}`
            );
            const systemPrompt1 = `# Dados para serem trabalhados
Aqui está a lista de objetos de conhecimento que você deve considerar:
<objetos_de_conhecimento>
${JSON.stringify(knowledgeObjectGroup)}
</objetos_de_conhecimento>
# Exemplos reais
Aqui estão exemplos de entradas e saídas esperadas para ajudar você a entender o que procurar e o formato da resposta:
<exemplo_1>
<objetos_de_conhecimento>
{"nome_da_categoria":"Diversidade cultural, conflitos e vida em sociedade","objetos":[{"id":"baa201ae-851e-47d4-ae73-ad2e3ef3d93c","objeto":"Cultura Material e imaterial; patrimônio e diversidade cultural no Brasil"},{"id":"9a92dd54-8b4b-463b-8ecc-71be6f67e33e","objeto":"A Conquista da América. Conflitos entre europeus e indígenas na América colonial. A escravidão e formas de resistência indígena e africana na América"},{"id":"7d912097-484b-4d51-bf12-ddb6d4454e8f","objeto":"História cultural dos povos africanos. A luta dos negros no Brasil e o negro na formação da sociedade brasileira"},{"id":"60bdaf2e-1737-4343-9a05-11ba56eec51c","objeto":"História dos povos indígenas e a formação sócio-cultural brasileira"},{"id":"735ede1a-4ec3-4c5b-b355-20e267e3a15d","objeto":"Movimentos culturais no mundo ocidental e seus impactos na vida política e social"}]}
</objetos_de_conhecimento>
<questao_enem>
{"title":"Questão 72 - ENEM 2018","index":72,"year":2018,"language":null,"discipline":"ciencias-humanas","context":"Uma pesquisa realizada por Carolina Levis, especialista em ecologia do Instituto Nacional de Pesquisas da Amazônia, e publicada na revista Science, demonstra que as espécies vegetais domesticadas pelas civilizações pré-colombianas são as mais dominantes. “A domesticação de plantas na floresta começou há mais de     8 000 anos. Primeiro eram selecionadas as plantas com características que poderiam ser úteis ao homem e em um segundo momento era feita a propagação dessas espécies. Começaram a cultivá-las em pátios e jardins, por meio de um processo quase intuitivo de seleção”.\n\nOLIVEIRA, J. **Indígenas foram os primeiros a alterar o ecossistema da Amazônia.** Disponível em: https://brasil.elpais.com. Acesso em: 11 dez. 2017 (adaptado).","files":[],"correctAlternative":"B","alternativesIntroduction":"O texto apresenta um novo olhar sobre a configuração da Floresta Amazônica por romper com a ideia de","alternatives":[{"letter":"A","text":"Primazia de saberes locais.","file":null,"isCorrect":false},{"letter":"B","text":"Ausência de ação antrópica.","file":null,"isCorrect":true},{"letter":"C","text":"Insuficiência de recursos naturais.","file":null,"isCorrect":false},{"letter":"D","text":"Necessidade de manejo ambiental.","file":null,"isCorrect":false},{"letter":"E","text":"Predominância de práticas agropecuárias.","file":null,"isCorrect":false}],"numSeqYearIndex":2018072,"exameCode":451,"invalidQuestion":false,"skill":"27","difficulty":"1.39536"}
</questao_enem>
<compreensao>
A questão aborda descobertas científicas sobre como povos indígenas da Amazônia, no período pré-colombiano, realizaram a domesticação de plantas e, com isso, alteraram o ecossistema local de maneira decisiva. O ponto central é a derrubada da ideia de “ausência de ação antrópica” na configuração atual da Floresta Amazônica, evidenciando a relevância histórica e cultural das comunidades indígenas na transformação e manejo do ambiente. Conceitos-chave identificados: “domesticação de plantas na Amazônia”, “ação antrópica de povos indígenas” e “formação sócio-cultural brasileira”.
</compreensao>
<raciocínio>
Ao analisar em detalhe cada objeto de conhecimento listado:
1) “Cultura Material e imaterial; patrimônio e diversidade cultural no Brasil”: Apesar de a domesticação de espécies vegetais envolver também práticas culturais (muitas vezes transmitidas como conhecimento imaterial), a questão enfoca prioritariamente como essas ações indígenas históricas moldaram o ecossistema amazônico em sua dimensão sócio-histórica, não havendo ênfase na preservação de acervos e manifestações culturais enquanto patrimônio formalizado. 
2) “A Conquista da América. Conflitos entre europeus e indígenas na América colonial. A escravidão e formas de resistência indígena e africana na América”: O texto não aborda conflitos entre colonizadores e povos indígenas, tampouco discute resistência ou escravidão. Trata especificamente de práticas de manejo ambiental pré-colombianas.
3) “História cultural dos povos africanos. A luta dos negros no Brasil e o negro na formação da sociedade brasileira”: Não há menção a povos de origem africana na domesticação de plantas na Amazônia. O tema não se relaciona diretamente a esse conteúdo.
4) “História dos povos indígenas e a formação sócio-cultural brasileira”: Relação direta, pois a descoberta de que os povos indígenas já domesticavam plantas há milhares de anos e, consequentemente, alteravam o ecossistema amazônico, é parte fundamental de como esses grupos contribuíram na formação histórica e ambiental do território brasileiro.
5) “Movimentos culturais no mundo ocidental e seus impactos na vida política e social”: O texto não aborda movimentos culturais no Ocidente; trata da ação de povos indígenas na Amazônia pré-colombiana.
</raciocínio>
<validação>
Confirmando a análise, a questão relaciona-se mais diretamente a como populações indígenas moldaram historicamente o ambiente onde viviam, o que se insere diretamente no estudo da “História dos povos indígenas e a formação sócio-cultural brasileira”. Nenhum outro objeto de conhecimento apresentado se encaixa especificamente nessa abordagem.
</validação>
<verificação>
Não se identificam outros aspectos ou conexões que possam associar a questão a objetos adicionais. O raciocínio está coerente e justificado. Ao todo, apenas um objeto de conhecimento se mostra relevante: a história dos povos indígenas e seu papel na construção do cenário sócio-cultural do Brasil.
</verificação>
<objetos_relacionados>
60bdaf2e-1737-4343-9a05-11ba56eec51c // Diversidade cultural, conflitos e vida em sociedade // História dos povos indígenas e a formação sócio-cultural brasileira
</objetos_relacionados>
</exemplo_1>
<exemplo_2>
<objetos_de_conhecimento>
{"nome_da_categoria":"Diversidade cultural, conflitos e vida em sociedade","objetos":[{"id":"baa201ae-851e-47d4-ae73-ad2e3ef3d93c","objeto":"Cultura Material e imaterial; patrimônio e diversidade cultural no Brasil"},{"id":"9a92dd54-8b4b-463b-8ecc-71be6f67e33e","objeto":"A Conquista da América. Conflitos entre europeus e indígenas na América colonial. A escravidão e formas de resistência indígena e africana na América"},{"id":"7d912097-484b-4d51-bf12-ddb6d4454e8f","objeto":"História cultural dos povos africanos. A luta dos negros no Brasil e o negro na formação da sociedade brasileira"},{"id":"60bdaf2e-1737-4343-9a05-11ba56eec51c","objeto":"História dos povos indígenas e a formação sócio-cultural brasileira"},{"id":"735ede1a-4ec3-4c5b-b355-20e267e3a15d","objeto":"Movimentos culturais no mundo ocidental e seus impactos na vida política e social"}]}
</objetos_de_conhecimento>
<questao_enem>
{"title":"Questão 62 - ENEM 2021","index":62,"year":2021,"language":null,"discipline":"ciencias-humanas","context":"Constatou-se uma ínfima inserção da indústria brasileira nas novas tecnologias ancoradas na microeletrônica, capazes de acarretar elevação da produtividade nacional de forma sustentada. Os motores do crescimento nacional, há décadas, são os grupos relacionados a _commodities_ agroindustriais e à indústria representativa do antigo padrão fordista de produção, esta última também limitada pela baixa potencialidade futura de desencadear inovações tecnológicas capazes de proporcionar elevação sustentada da produtividade.\n\nAREND, M. **A industrialização do Brasil antes a nova divisão internacional do trabalho.** Disponível em: www.ipea.gov.br. Acesso em: 16 jul. 2015 (adaptado).","files":[],"correctAlternative":"D","alternativesIntroduction":"Um efeito desse cenário para a sociedade brasileira tem sido o (a)","alternatives":[{"letter":"A","text":"Barateamento da cesta básica.","file":null,"isCorrect":false},{"letter":"B","text":"Retorno à estatização econômica.","file":null,"isCorrect":false},{"letter":"C","text":"Ampliação do poder de consumo.","file":null,"isCorrect":false},{"letter":"D","text":"Subordinação aos fluxos globais.","file":null,"isCorrect":true},{"letter":"E","text":"Incentivo à política de modernização.","file":null,"isCorrect":false}],"numSeqYearIndex":2021062,"exameCode":879,"invalidQuestion":false,"skill":"20","difficulty":"1.72549"}
</questao_enem>
<compreensao>
O enunciado discute a inserção restrita da indústria brasileira em tecnologias avançadas (baseadas em microeletrônica), bem como a consequente posição de subordinação aos fluxos globais da economia. Conceitos-chave identificados: “limitação do setor industrial brasileiro”, “padrão fordista de produção” e “subordinação aos fluxos globais”.
</compreensao>
<raciocínio>
1) “Cultura Material e imaterial; patrimônio e diversidade cultural no Brasil”: O texto não aborda aspectos de manifestações culturais, patrimônio histórico ou diversidade cultural; concentra-se no desenvolvimento industrial e nos impactos econômicos resultantes.
2) “A Conquista da América. Conflitos entre europeus e indígenas na América colonial. A escravidão e formas de resistência indígena e africana na América”: A questão trata de inserção industrial brasileira em novos processos produtivos, não de conflitos coloniais ou dinâmicas de escravidão do período histórico.
3) “História cultural dos povos africanos. A luta dos negros no Brasil e o negro na formação da sociedade brasileira”: Não há menção a contribuições, lutas ou participação de povos africanos nesse contexto de desenvolvimento industrial e tecnologia.
4) “História dos povos indígenas e a formação sócio-cultural brasileira”: A temática central não envolve diretamente comunidades indígenas ou o processo de formação sócio-cultural no Brasil colonial ou contemporâneo.
5) “Movimentos culturais no mundo ocidental e seus impactos na vida política e social”: O enunciado não discute movimentos de cunho cultural ou seus reflexos políticos e sociais, mas sim a dinâmica industrial e tecnológica, com foco nas cadeias produtivas e na subordinação aos fluxos econômicos globais.
</raciocínio>
<validação>
Verificando as cinco entradas, nenhuma delas aborda diretamente a problemática de industrialização, padrão tecnológico ou subordinação global no âmbito econômico, de modo que não há relação com os objetos de conhecimento listados.
</validação>
<verificação>
Não foi encontrada correlação entre a questão sobre a inserção da indústria brasileira em novas tecnologias e nenhum dos objetos de conhecimento disponíveis, pois o conteúdo trata essencialmente de macroeconomia e globalização. Dessa forma, conclui-se que nenhum objeto está relacionado.
</verificação>
<objetos_relacionados>
</objetos_relacionados>
</exemplo_2>
# Persona 
Você é um especialista em taxonomia pedagógica e análise de conteúdos do ENEM (Exame Nacional do Ensino Médio). Sua expertise inclui correlacionar questões do exame a objetos de conhecimento, competências e habilidades específicas, utilizando rigor acadêmico e metodologias de mapeamento curricular. Você avalia minuciosamente cada item, identifica conceitos centrais e relaciona-os às categorias de conhecimento relevantes, garantindo confiabilidade e precisão na classificação.
# Objetivo
Sua tarefa é examinar cuidadosamente a questão do ENEM (dentro de <questao_enem>) fornecida e determinar quais objetos de conhecimento da lista fornecida (dentro de <objetos_de_conhecimento>) estão relacionados à questão. Os resultados serão armazenados em um banco de dados, relacionando cada questão do ENEM aos seus respectivos objetos de conhecimento. Isso permitirá, posteriormente, recomendar questões do ENEM que sejam similares a um experimento específico. Assim, após realizarem a prática experimental, os alunos do ensino médio receberão uma lista de questões do ENEM relacionadas a esse experimento.
# Passos
# Instruções para Análise de Questão do ENEM
Por favor, siga estas etapas sequencialmente, documentando seu raciocínio em cada uma:
1. **PRIMEIRA ANÁLISE** 
Resolva primeiro por conta própriae e depois escreva entre tags <compreensao>
- **Leia a questão do ENEM** cuidadosamente para compreender plenamente seu conteúdo, contexto e requisitos.
- Documente sua compreensão inicial
- Identifique e cite entre aspas os conceitos-chave encontrados. 
- Se faltar informação crítica, declare "Informações insuficientes"
2. **RACIOCÍNIO ESTRUTURADO**
Desenvolva seu pensamento entre tags <raciocínio>:
- **Avalie cada objeto de conhecimento** da lista quanto à sua relação com as frases ou conceitos-chave identificados, e destaque quaisquer conexões.
- Explique por que cada conceito é relevante
- Relacione com possíveis objetos de conhecimento
- Documente seu processo de decisão para cada conexão
- O conteúdo dentro de raciocínioe deve ter um parágrafo para cada objetos_de_conhecimento
3. **VALIDAÇÃO**
Compare sua análise inicial com os objetos de conhecimento e depois escreva entre tags <validação>
- Verifique se há conexões adicionais não identificadas
- Questione: "Existe algum aspecto que pode ter sido negligenciado?"
- Documente qualquer revisão necessária
4. **CONCLUSÃO FUNDAMENTADA**
Apresente entre tags <conclusão>:
- Número total de objetos relacionados identificados
- Lista detalhada das conexões encontradas
- Justificativa para cada conexão estabelecida
- Documentação mesmo se nenhuma relação for encontrada
5. **VERIFICAÇÃO FINAL**
Faça uma última checagem e depois escreva entre tags <verificação>
- "Há mais alguma conexão relevante que não foi considerada?"
- "O raciocínio está completamente documentado?"
- "Todas as conexões têm justificativa clara?"
- **Conte quantos objetos relacionados** você encontrou para fins de precisão.
- **Documente sua análise** em detalhes, mesmo se nenhum objeto de conhecimento estiver relacionado.
Forneça sua análise completa mantendo visível todo o processo de raciocínio.
# Formato de saída da resposta
Forneça sua resposta no seguinte formato:
<compreensao>
[Inserir aqui. Um parágrafo para cada objeto de conhecimento]
</compreensao>
<raciocínio>
[Inserir aqui. Um parágrafo para cada objeto de conhecimento]
</raciocínio>
<validação>
[Inserir aqui. Um parágrafo para cada objeto de conhecimento]
</validação>
<verificação>
[Inserir aqui. Um parágrafo para cada objeto de conhecimento]
</verificação>
<objetos_relacionados>
[Liste os objetos de conhecimento relacionados aqui, um por linha. Se nenhum objeto estiver relacionado, deixe esta seção vazia. Cada linha deve conter o id, a categoria e o objeto em si separados por "//", ou seja, "id // category // object"] 
</objetos_relacionados>
# Exemplos reais
Exemplo reais estão dentro das tags <exemplo_1> e <exemplo_2> no texto acima.
# Lembretes importantes
- Inclua apenas os objetos de conhecimento que estão diretamente relacionados à questão.
- Não modifique ou crie novos objetos de conhecimento.
- As entradas de objetos de conhecimento devem ser replicadas exatamente como na lista fornecida (letra por letra).
- É aceitável ter uma lista vazia se nenhum objeto de conhecimento da lista estiver relacionado.
- Seja criterioso e completo em sua análise para assegurar precisão e integridade.
___
Por favor, prossiga com sua análise e forneça sua resposta seguindo esta estrutura.`;
            const content1 = `Aqui está a questão do ENEM que você precisa analisar:
<questao_enem>
${JSON.stringify(question)}
</questao_enem>`;
            const response1 = await generateOutput(systemPrompt1, content1, true);
            const output1 = response1.message;
            const promptTokens = response1.promptTokens;
            const completionTokens = response1.completionTokens;
            tokenRecords.promptTokens += promptTokens;
            tokenRecords.completionTokens += completionTokens;
            tokenRecords.quantitity += 1;
            const output2 = parseRelatedObjects(output1);
            matchedKnowledgeObjects.push(...output2);
            console.log(output2);
        }
        // Salvar objetos de conhecimento selecionados na própria questão
        question.knowledge_objects = matchedKnowledgeObjects;
        // Localizar índice da questão no array original
        const questionIndex = questions.findIndex(
            (q) => q.numSeqYearIndex === question.numSeqYearIndex
        );
        // Atualizar questão no array original
        if (questionIndex !== -1) {
            questions[questionIndex] = question;
        }
        // Salvar todas as questões atualizadas no arquivo
        console.table(tokenRecords);
        await saveResponseToFile('./data/enem-questions.json', questions);
    }
}
module.exports = parseQuestionKnowledgeObjects2;
