const fs = require('fs');
const path = require('path');
const saveResponseToFile = require('../utils/saveResponseToFile');
function findQuestions() {
    const applicable_skills = require('../response/competencyAndSkills.json');
    const questions_path = './data/enem-questions.json';
    const years = Array.from({ length: 11 }, (_, i) => 2014 + i);
    // --------------------------------------------------------------------------------
    // Função auxiliar para extrair apenas dígitos de uma string e converter em número.
    // --------------------------------------------------------------------------------
    function extractNumber(s) {
        const digits = s.replace(/\D/g, '');
        if (!digits) {
            throw new Error('A string não contém dígitos.');
        }
        return parseInt(digits, 10);
    }
    // --------------------------------------------------------------------------------
    // Mapeia área para disciplina.
    // --------------------------------------------------------------------------------
    function mapAreaToDiscipline(areaValue) {
        const mapping = {
            'Ciências da Natureza e suas Tecnologias': 'ciencias-natureza',
            'Ciências Humanas e suas Tecnologias': 'ciencias-humanas',
            'Linguagens, Códigos e suas Tecnologias': 'linguagens',
            'Matemática e suas Tecnologias': 'matematica',
        };
        if (!mapping[areaValue]) {
            throw new Error(`Área de Conhecimento desconhecida: '${areaValue}'`);
        }
        return mapping[areaValue];
    }
    // --------------------------------------------------------------------------------
    // Extrai as áreas e habilidades de um objeto (simulando extrair_areas_e_habilidades).
    // --------------------------------------------------------------------------------
    function extractAreasAndSkills(data) {
        const areasDict = {};
        const categoriasCorrelacao = ['higly_correlated', 'medium_correlated', 'low_correlated'];
        for (const correlacao of categoriasCorrelacao) {
            const areas = data[correlacao] || [];
            for (const area of areas) {
                const nomeArea = area.area_do_conhecimento;
                if (!nomeArea) continue;
                if (!areasDict[nomeArea]) {
                    areasDict[nomeArea] = new Set();
                }
                for (const competencia of area.competencias || []) {
                    for (const habilidade of competencia.habilidades || []) {
                        const codigoHabilidade = habilidade.codigo_da_habilidade;
                        if (codigoHabilidade) {
                            areasDict[nomeArea].add(codigoHabilidade);
                        }
                    }
                }
            }
        }
        const resultado = {
            areas_do_conhecimento: [],
        };
        for (const [nome, codigos] of Object.entries(areasDict)) {
            resultado.areas_do_conhecimento.push({
                nome,
                codigos_das_habilidades: Array.from(codigos).sort(),
            });
        }
        return resultado;
    }
    // --------------------------------------------------------------------------------
    // Lê arquivo CSV e retorna lista de objetos (síncrono simplificado).
    // --------------------------------------------------------------------------------
    function parseCsvSync(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l);
        const [header, ...rows] = lines;
        const columns = header.split(',');
        const data = [];
        rows.forEach((line) => {
            const values = line.split(',');
            const obj = {};
            columns.forEach((col, i) => {
                obj[col] = values[i] || '';
            });
            data.push(obj);
        });
        return data;
    }
    // --------------------------------------------------------------------------------
    // Retorna dificuldade relativa de uma questão (para simplificar, leitura de CSV é sincrona).
    // --------------------------------------------------------------------------------
    function getRelativeDifficulty(
        year,
        index,
        discipline,
        correctAlt,
        exameCode,
        itensPath,
        skillSummaryPath
    ) {
        const csvRows = parseCsvSync(itensPath);
        const matchedItem = csvRows.find((row) => {
            return (
                parseInt(row['CO_POSICAO'], 10) === index &&
                parseInt(row['YEAR'], 10) === year &&
                row['SG_AREA'] === discipline &&
                row['TX_GABARITO'] === correctAlt &&
                parseInt(row['CO_PROVA'], 10) === exameCode
            );
        });
        if (!matchedItem) return 50;
        const difficultyVal = matchedItem['NU_PARAM_B']
            ? parseFloat(matchedItem['NU_PARAM_B'])
            : null;
        const summary = JSON.parse(fs.readFileSync(skillSummaryPath, 'utf8'));
        const coHab = parseInt(matchedItem['CO_HABILIDADE'], 10);
        const entry = summary.find(
            (e) => e['SG_AREA'] === discipline && e['CO_HABILIDADE'] === coHab
        );
        if (!entry) return 50;
        const minB = entry['Minimum_NU_PARAM_B'];
        const maxB = entry['Maximum_NU_PARAM_B'];
        if (difficultyVal === null || minB === maxB) return 50;
        let relative = ((difficultyVal - minB) / (maxB - minB)) * 100;
        if (relative < 0) relative = 0;
        if (relative > 100) relative = 100;
        return Math.round(relative);
    }
    // --------------------------------------------------------------------------------
    // Função para gerar relatório (equivalente a gerar_relatorio_questoes).
    // --------------------------------------------------------------------------------
    function gerarRelatorioQuestoes(questionsPath, anos, coHabilidade, discipline) {
        // Caminhos fixos
        const itensPath = path.join('data', 'ITENS_PROVA.csv');
        const skillSummaryPath = path.join('data', 'skill-area-combination-summary.json');
        const allQuestions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
        const filtered = allQuestions.filter((q) => {
            return (
                q.discipline === discipline &&
                anos.includes(q.year) &&
                q.skill === String(coHabilidade)
            );
        });
        // Ordenar pela dificuldade relativa
        filtered.sort((a, b) => {
            const diffA = getRelativeDifficulty(
                a.year,
                a.index,
                a.discipline === 'linguagens'
                    ? 'LC'
                    : a.discipline === 'ciencias-natureza'
                    ? 'CN'
                    : a.discipline === 'ciencias-humanas'
                    ? 'CH'
                    : 'MT',
                a.correctAlternative,
                a.exameCode,
                itensPath,
                skillSummaryPath
            );
            const diffB = getRelativeDifficulty(
                b.year,
                b.index,
                b.discipline === 'linguagens'
                    ? 'LC'
                    : b.discipline === 'ciencias-natureza'
                    ? 'CN'
                    : b.discipline === 'ciencias-humanas'
                    ? 'CH'
                    : 'MT',
                b.correctAlternative,
                b.exameCode,
                itensPath,
                skillSummaryPath
            );
            return diffB - diffA;
        });
        const totalQuestoes = filtered.length;
        const questoesInfo = filtered.map((q) => {
            return {
                year: q.year,
                index: q.index,
                relative_difficulty: getRelativeDifficulty(
                    q.year,
                    q.index,
                    q.discipline === 'linguagens'
                        ? 'LC'
                        : q.discipline === 'ciencias-natureza'
                        ? 'CN'
                        : q.discipline === 'ciencias-humanas'
                        ? 'CH'
                        : 'MT',
                    q.correctAlternative,
                    q.exameCode,
                    itensPath,
                    skillSummaryPath
                ),
                original_difficulty: q.difficulty,
            };
        });
        return {
            total_questoes_encontradas: totalQuestoes,
            questoes_detalhes: questoesInfo,
            questoes_completas: filtered,
        };
    }
    // --------------------------------------------------------------------------------
    // Gera o relatório para cada habilidade.
    // --------------------------------------------------------------------------------
    function generateReportForSkills(skillsData) {
        const results = {};
        const areas = skillsData.areas_do_conhecimento || [];
        areas.forEach((area) => {
            const nomeArea = area.nome;
            (area.codigos_das_habilidades || []).forEach((codigo) => {
                try {
                    const discipline = mapAreaToDiscipline(nomeArea);
                    const habNumber = extractNumber(codigo);
                    const report = gerarRelatorioQuestoes(
                        questions_path,
                        years,
                        habNumber,
                        discipline
                    );
                    results[codigo] = report;
                } catch (err) {
                    results[codigo] = { error: err.message };
                }
            });
        });
        return { root: results };
    }
    // --------------------------------------------------------------------------------
    // Executa a transformação.
    // --------------------------------------------------------------------------------
    const skillsData = extractAreasAndSkills(applicable_skills);
    const questions = generateReportForSkills(skillsData);
    saveResponseToFile('./response/relatedQuestions.json', questions);
}
module.exports = findQuestions;
