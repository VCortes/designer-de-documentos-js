const fs = require('fs');
const path = require('path');
const saveResponseToFile = require('../utils/saveResponseToFile');
const generateStructuredOutput = require('../utils/generateStructuredOutput');
const { CompetencySkillsSchema } = require('../entities');
function filterJSONRecords(curriculum, inputFile, propertiesToKeep, areaOfKnowledge) {
    const dataRaw = fs.readFileSync(path.resolve(inputFile), 'utf-8');
    const data = JSON.parse(dataRaw);
    const filteredData = [];
    for (const record of data) {
        if (
            record['Currículo'] === curriculum &&
            record['Área de Conhecimento'] === areaOfKnowledge
        ) {
            const filteredRecord = {};
            for (const prop of propertiesToKeep) {
                if (record.hasOwnProperty(prop)) {
                    filteredRecord[prop] = record[prop];
                }
            }
            filteredData.push(filteredRecord);
        }
    }
    return filteredData;
}
/**
 * Transforma uma lista de objetos de habilidades em uma estrutura categorizada
 * de acordo com o relevancy_score (3, 4 ou 5).
 */
function transformarDados(dadosEntrada) {
    // Mapeamento das pontuações de relevância para categorias de correlação
    const mapRelevancia = {
        5: 'higly_correlated',
        4: 'medium_correlated',
        3: 'low_correlated',
    };
    // Estrutura de saída inicial
    const saida = {
        higly_correlated: [],
        medium_correlated: [],
        low_correlated: [],
    };
    /**
     * Adiciona uma habilidade em 'saida', agrupando por área de conhecimento e competência.
     */
    function adicionarHabilidade(saida, categoria, area, competencia, habilidade) {
        // Verifica se a área já existe na categoria
        let areaEncontrada = saida[categoria].find((item) => item.area_do_conhecimento === area);
        if (!areaEncontrada) {
            areaEncontrada = {
                area_do_conhecimento: area,
                competencias: [],
            };
            saida[categoria].push(areaEncontrada);
        }
        // Verifica se a competência já existe na área
        let competenciaEncontrada = areaEncontrada.competencias.find(
            (comp) => comp.codigo_da_competencia === competencia.codigo_da_competencia
        );
        if (!competenciaEncontrada) {
            competenciaEncontrada = {
                codigo_da_competencia: competencia.codigo_da_competencia,
                descricao_da_competencia: competencia.descricao_da_competencia,
                // Exemplo fixo de 'category_name'; adaptar conforme necessidade
                category_name: 'Conhecimentos básicos e fundamentais',
                habilidades: [],
            };
            areaEncontrada.competencias.push(competenciaEncontrada);
        }
        // Adiciona a habilidade na lista de habilidades da competência
        competenciaEncontrada.habilidades.push({
            codigo_da_habilidade: habilidade.codigo_da_habilidade,
            descricao_da_habilidade: habilidade.descricao_da_habilidade,
            relevance_score: habilidade.relevancy_score,
            exemplos_de_aplicacao: habilidade.exemplos_de_aplicacao,
        });
    }
    // Processa cada item de entrada
    for (const item of dadosEntrada) {
        const score = item.relevancy_score;
        const categoria = mapRelevancia[score];
        if (categoria) {
            adicionarHabilidade(
                saida,
                categoria,
                item.area_do_conhecimento,
                {
                    codigo_da_competencia: item.codigo_da_competencia,
                    descricao_da_competencia: item.descricao_da_competencia,
                },
                {
                    codigo_da_habilidade: item.codigo_da_habilidade,
                    descricao_da_habilidade: item.descricao_da_habilidade,
                    relevancy_score: item.relevancy_score,
                    exemplos_de_aplicacao: item.exemplos_de_aplicacao,
                }
            );
        }
    }
    return saida;
}
async function evaluateSkills() {
    // Carrega dados de apoio, conforme padrão do projeto
    const virtualLaboratory = require('../data/roteiro.json');
    const outline = require('../response/description.json');
    const concepts = require('../response/concepts.json');
    const skills = require('../response/skills.json');
    const learningObjectives = require('../response/learningObjectives.json');
    const applicableKnowledgeObjects = require('../response/knowledgeEvaluation.json');
    // Propriedades a manter ao filtrar o JSON
    const propertiesToKeep = [
        'Currículo',
        'Área de Competência',
        'Código da Competência',
        'Descrição da Competência',
        'Descrição da Habilidade',
        'Código da Habilidade',
    ];
    // Filtra o arquivo 'curriculos.json' (ajuste o caminho se necessário)
    const selectedCurriculumData = filterJSONRecords(
        'ENEM',
        './data/curriculos.json',
        propertiesToKeep,
        virtualLaboratory.area_of_knowledge
    );
    // Monta prompt para análise (adaptar conforme necessidade)
    const systemPrompt = `
<Instructions>
Dado as competências e habilidades da matriz curricular do ENEM dentro da tag <CompetenciesAndSkills> e considerando a área de conhecimento ${
        virtualLaboratory.area_of_knowledge
    } (knowledge_field_name) e o componente curricular ${
        virtualLaboratory.curricular_component
    } (curriculum_component), realize os seguintes passos para cada habilidade em <CompetenciesAndSkills>:
1. **Brainstorm criativo e exemplos práticos**  
   - Crie um pequeno texto de brainstorming com ideias imaginativas de como cada habilidade pode ser explorada dentro do laboratório virtual descrito em <VirtualLaboratory>.
   - Apresente exemplos de aplicação concretos, sugerindo como essas ideias podem se materializar em atividades ou situações experimentais. Cada habilidade precisa de em média 2 a 3 exemplos. Estes exemplos precisam ser detalhados e contextualizados, mostrando como a habilidade pode ser desenvolvida e avaliada no laboratório virtual. Não podem ser linhas gerais ou vagas, mas sim exemplos específicos e práticos.
2. **Referências aos conteúdos de apoio**  
   - Utilize o conteúdo em <Outline>, <Concepts>, <Skills> e <ApplicableKnowledgeObjects> para embasar e inspirar suas sugestões.  
   - Leve em conta que <ApplicableKnowledgeObjects> informa os objetos de conhecimento que são ou podem ser abordados no laboratório virtual.
3. **Avaliação de relevância (relevancy_score)**  
   - Ao final de cada brainstorming, julgue numa escala de 1 a 5 o quão relevante e viável é explorar a habilidade no contexto do laboratório virtual. A nota (relevancy_score) deve ser justificada de forma clara, considerando a seguinte escala:
     **1. Nenhuma exploração ou possibilidade muito reduzida**  
     **2. Exploração incipiente ou potencial limitado**  
     **3. Exploração moderada ou potencial intermediário**  
     **4. Exploração consistente ou potencial significativo**  
     **5. Exploração máxima ou potencial pleno**  
**Observação:** Todos os itens em <CompetenciesAndSkills> devem ser incluídos na resposta, garantindo que cada um receba um brainstorming de ideias, exemplos de aplicação e a atribuição de uma nota final (relevancy_score).
**Valores possíveis de área do conhecimento:** Precisam ser exatamente o que consta originalmente na entrada. Ou seja, um desses valores:
Ciências da Natureza e suas Tecnologias
Ciências Humanas e suas Tecnologias
Linguagens, Códigos e suas Tecnologias
Matemática e suas Tecnologias
</Instructions>
<VirtualLaboratory>${JSON.stringify(virtualLaboratory)}</VirtualLaboratory>
<Outline>${JSON.stringify(outline)}</Outline>
<Concepts>${JSON.stringify(concepts)}</Concepts>
<Skills>${JSON.stringify(skills)}</Skills>
<LearningObjectives>${JSON.stringify(learningObjectives)}</LearningObjectives>
<ApplicableKnowledgeObjects>${JSON.stringify(
        applicableKnowledgeObjects
    )}</ApplicableKnowledgeObjects>
`;
    const skillsScore = [];
    // Processa as habilidades em blocos de 5
    for (let startIdx = 0; startIdx < selectedCurriculumData.length; startIdx += 5) {
        const chunk = selectedCurriculumData.slice(startIdx, startIdx + 5);
        const categoryText =
            'Habilidades:\n' + chunk.map((item) => JSON.stringify(item)).join('\n');
        const content = `
Estão sendo enviadas ${chunk.length} habilidades. 
A saída DEVE conter o mesmo número de habilidades.
# Entrada:
<CompetenciesAndSkills>${categoryText}</CompetenciesAndSkills>
    `;
        console.log(
            `Processando bloco de habilidades ${startIdx + 1} a ${startIdx + chunk.length}...`
        );
        // Gera a resposta usando a função generateStructuredOutput (ou equivalente)
        // Ajuste o schema de validação/parse (Skills) conforme sua implementação.
        const output = await generateStructuredOutput(
            systemPrompt,
            CompetencySkillsSchema,
            content
        );
        // Supondo que output seja algo no formato { habilidades: [...] }
        // ou que seja um objeto com a propriedade "content" onde está o texto JSON
        // Adapte conforme o retorno real de sua função generateStructuredOutput
        let parsed;
        try {
            // Caso a função retorne algo tipo { content: { text: '...json...' } }
            if (output.content && output.content.text) {
                parsed = JSON.parse(output.content.text);
            } else {
                parsed = output; // se já vem pronto
            }
        } catch (err) {
            console.error('Erro ao fazer parse do JSON retornado:', err);
            continue;
        }
        // Extraia as habilidades do JSON e acumule
        const _skills = parsed.habilidades || [];
        skillsScore.push(..._skills);
    }
    // Transforma os dados em estrutura categorizada
    const applicableSkills = transformarDados(skillsScore);
    // Salva a saída final em arquivo JSON
    saveResponseToFile('./response/competencyAndSkills.json', applicableSkills);
}
module.exports = evaluateSkills;
