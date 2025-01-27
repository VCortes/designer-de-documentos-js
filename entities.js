// Importar o Zod
const { z } = require('zod');
// Definir o esquema usando Zod
const ConceptSchema = z.object({
    id: z.number(),
    nome: z.string(),
    descrição: z.string(),
    tipo: z.enum(['conceito teórico', 'conceito prático']),
    já_abordado: z.boolean(),
});
const ConceptsSchema = z.object({
    conceitos: z.array(ConceptSchema),
});
const ExperimentoSchema = z.object({
    descrição_do_experimento: z.string(),
    objetivo_geral: z.string(),
});
const SkillSchema = z.object({
    id: z.number(),
    nome: z.string(),
    descrição: z.string(),
    tipo: z.enum(['habilidade manual', 'habilidade cognitiva']),
});
const SkillsSchema = z.object({
    habilidades: z.array(SkillSchema),
});
const CompetencySkillSchema = z.object({
    exemplos_de_aplicacao: z.array(z.string()),
    area_do_conhecimento: z.string(),
    codigo_da_competencia: z.string(),
    descricao_da_competencia: z.string(),
    codigo_da_habilidade: z.string(),
    descricao_da_habilidade: z.string(),
    relevancy_score: z.number(),
});
const CompetencySkillsSchema = z.object({
    brainstorm: z.string(),
    habilidades: z.array(CompetencySkillSchema),
});
const LearningObjectiveSchema = z.object({
    id: z.number(),
    tipo: z.string(),
    descrição: z.string(),
    relação_com_a_prática: z.string(),
    procedimentos_relacionados: z.array(z.number()),
    avaliação_do_objetivo: z.string(),
});
const LearningObjectivesSchema = z.object({
    objetivos_de_aprendizagem: z.array(LearningObjectiveSchema),
});
const KnowledgeObjectSchema = z.object({
    object_name: z.string(),
    relevance_score: z.number(),
});
const KnowledgeCategorySchema = z.object({
    category_name: z.string(),
    objects: z.array(KnowledgeObjectSchema),
});
const KnowledgeFieldSchema = z.object({
    knowledge_field_name: z.string(),
    curriculum_component: z.string(),
    categories: z.array(KnowledgeCategorySchema),
});
const ResultAnalysisSchema = z.object({
    id: z.number(),
    question: z.string(),
});
const ResultAnalysisListSchema = z.object({
    result_analysis: z.array(ResultAnalysisSchema),
});
const ProcedureSchema = z.object({
    id: z.number(),
    procedure: z.string(),
    cognitive_hint: z.array(z.string()),
    intermediate_text: z.string(),
});
const KnowledgeObjectItem = z.object({
    objeto: z.string(),
    id: z.string(),
});
const KnowledgeObjectFile = z.object({
    nome: z.string(),
    disciplina: z.string(),
    categorias: z.array(
        z.object({
            nome: z.string(),
            objetos: z.array(KnowledgeObjectItem),
        })
    ),
});
const KnowledgeObjectListFile = z.object({
    áreas_de_competência: z.array(KnowledgeObjectFile),
});
const QuestionAlternative = z.object({
    letter: z.string(),
    text: z.string().nullable(),
    file: z.string().nullable(),
    isCorrect: z.boolean(),
});
const Question = z.object({
    title: z.string(),
    index: z.number(),
    year: z.number(),
    language: z.string().nullable(),
    discipline: z.string(),
    context: z.string(),
    files: z.array(z.string()),
    correctAlternative: z.string(),
    alternativesIntroduction: z.string().nullable(),
    alternatives: z.array(QuestionAlternative),
    numSeqYearIndex: z.number(),
    exameCode: z.number(),
    invalidQuestion: z.boolean(),
    skill: z.string().nullable(),
    difficulty: z.string().nullable(),
});
const Questions = z.array(Question);
const QuestionKnowledgeObject = z.array(
    z.object({
        categoria: z.string(),
        objeto: z.string(),
    })
);
// Exportar os dois separados
module.exports = {
    ConceptSchema,
    ConceptsSchema,
    ExperimentoSchema,
    SkillSchema,
    SkillsSchema,
    LearningObjectiveSchema,
    LearningObjectivesSchema,
    KnowledgeObjectSchema,
    KnowledgeCategorySchema,
    KnowledgeFieldSchema,
    CompetencySkillSchema,
    CompetencySkillsSchema,
    ResultAnalysisSchema,
    ResultAnalysisListSchema,
    ProcedureSchema,
    KnowledgeObjectListFile,
    KnowledgeObjectFile,
    Questions,
    QuestionKnowledgeObject,
};
