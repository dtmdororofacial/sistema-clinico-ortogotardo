export type QuestionKind = 'text' | 'textarea' | 'number' | 'yesno' | 'single' | 'multi' | 'scale';

export type Question = {
  id: string;
  label: string;
  kind: QuestionKind;
  options?: string[];
  min?: number;
  max?: number;
  suffix?: string;
  help?: string;
  required?: boolean;
};

export type InstrumentSection = {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
};

const yesNo: Question['options'] = ['Não', 'Sim'];
const frequencyMonth = [
  'Nunca',
  'Uma pequena parte do tempo',
  'Alguma parte do tempo',
  'A maior parte do tempo',
  'O tempo todo',
  'Não sei',
];

export const anamnesisSections: InstrumentSection[] = [
  {
    id: 'clinical-history',
    title: 'Informações clínicas gerais',
    questions: [
      { id: 'previousTreatments', label: 'Tratamentos prévios', kind: 'multi', options: ['Placa oclusal', 'Ajuste oclusal', 'Ortodontia ou prótese', 'Fisioterapia', 'Medicação', 'Nenhum', 'Outros'] },
      { id: 'medicalHistory', label: 'Histórico médico', kind: 'textarea' },
      { id: 'currentMedication', label: 'Medicamentos em uso e doses', kind: 'textarea' },
      { id: 'dentalHistory', label: 'Histórico odontológico', kind: 'textarea', help: 'Registro narrativo livre.' },
      { id: 'sleepQuality', label: 'Qualidade do sono', kind: 'textarea' },
      { id: 'sleepBruxismComments', label: 'Bruxismo do sono — comentários do profissional', kind: 'textarea' },
      { id: 'awakeBruxismComments', label: 'Bruxismo em vigília — comentários do profissional', kind: 'textarea' },
      { id: 'parafunctionalHabits', label: 'Hábitos parafuncionais', kind: 'textarea' },
      { id: 'emotionalFactors', label: 'Observações sobre fatores emocionais', kind: 'textarea' },
      { id: 'physicalActivity', label: 'Observações sobre atividade física', kind: 'textarea' },
      { id: 'generalObservations', label: 'Observações gerais', kind: 'textarea' },
    ],
  },
];

export const dctmdSymptomSections: InstrumentSection[] = [
  {
    id: 'dctmd-pain',
    title: 'DC/TMD — Dor e cefaleia',
    description: 'Questionário de sintomas, considerando os períodos indicados em cada pergunta.',
    questions: [
      { id: 'dc1', label: 'Você já sentiu dor na mandíbula, têmpora, ouvido ou na frente do ouvido, em qualquer lado?', kind: 'yesno', options: yesNo },
      { id: 'dc2', label: 'Quando essa dor começou pela primeira vez?', kind: 'text', help: 'Informe anos e/ou meses.' },
      { id: 'dc3', label: 'Nos últimos 30 dias, como a dor se apresentou?', kind: 'single', options: ['Nenhuma dor', 'A dor vem e vai', 'A dor está sempre presente'] },
      { id: 'dc4', label: 'Nos últimos 30 dias, quais atividades modificaram essa dor?', kind: 'multi', options: ['Mastigar alimentos duros ou resistentes', 'Abrir a boca ou movimentar a mandíbula', 'Manter os dentes juntos, apertar, ranger ou mascar chiclete', 'Falar, beijar ou bocejar', 'Nenhuma'] },
      { id: 'dc5', label: 'Nos últimos 30 dias, houve dor de cabeça que incluiu a região das têmporas?', kind: 'yesno', options: yesNo },
      { id: 'dc6', label: 'Quando a dor de cabeça temporal começou pela primeira vez?', kind: 'text', help: 'Informe anos e/ou meses.' },
      { id: 'dc7', label: 'Nos últimos 30 dias, quais atividades modificaram essa dor de cabeça?', kind: 'multi', options: ['Mastigar alimentos duros ou resistentes', 'Abrir a boca ou movimentar a mandíbula', 'Manter os dentes juntos, apertar, ranger ou mascar chiclete', 'Falar, beijar ou bocejar', 'Nenhuma'] },
    ],
  },
  {
    id: 'dctmd-joint',
    title: 'DC/TMD — Ruídos e travamentos articulares',
    questions: [
      { id: 'dc8', label: 'Nos últimos 30 dias, ouviu algum som ou barulho na articulação ao movimentar ou usar a mandíbula?', kind: 'single', options: ['Não', 'Sim — direita', 'Sim — esquerda', 'Sim — bilateral'] },
      { id: 'dc9', label: 'Alguma vez a mandíbula travou ou hesitou, impedindo a abertura completa?', kind: 'yesno', options: yesNo },
      { id: 'dc10', label: 'Esse travamento limitou a abertura e interferiu na capacidade de comer?', kind: 'yesno', options: yesNo },
      { id: 'dc11', label: 'Nos últimos 30 dias, a mandíbula travou sem abrir completamente e depois destravou?', kind: 'yesno', options: yesNo },
      { id: 'dc12', label: 'Neste momento, a mandíbula está travada ou com abertura limitada?', kind: 'yesno', options: yesNo },
      { id: 'dc13', label: 'Nos últimos 30 dias, a mandíbula travou em ampla abertura, impedindo o fechamento?', kind: 'yesno', options: yesNo },
      { id: 'dc14', label: 'Quando isso ocorreu, foi necessário relaxar, movimentar ou empurrar a mandíbula para fechar?', kind: 'yesno', options: yesNo },
    ],
  },
];

export const gcpsSection: InstrumentSection = {
  id: 'gcps',
  title: 'Escala Graduada de Dor Crônica de Von Korff — itens 1 a 4',
  description: 'O sistema calcula a intensidade característica da dor. Não é calculado o grau completo de incapacidade.',
  questions: [
    { id: 'gcps1', label: 'Em quantos dias, nos últimos seis meses, você teve dor facial?', kind: 'number', min: 0, max: 180, suffix: 'dias' },
    { id: 'gcps2', label: 'Qual é a intensidade da dor facial neste momento?', kind: 'scale', min: 0, max: 10 },
    { id: 'gcps3', label: 'Qual foi a pior dor facial nos últimos 30 dias?', kind: 'scale', min: 0, max: 10 },
    { id: 'gcps4', label: 'Qual foi a dor facial média nos últimos 30 dias?', kind: 'scale', min: 0, max: 10 },
  ],
};

export const stabSections: InstrumentSection[] = [
  {
    id: 'stab-demographic',
    title: 'STAB — Dados demográficos',
    questions: [
      { id: 'stabSex', label: 'Sexo', kind: 'single', options: ['Masculino', 'Feminino', 'Não declarado / Outro'] },
      { id: 'stabHeight', label: 'Altura', kind: 'number', suffix: 'cm' },
      { id: 'stabWeight', label: 'Peso', kind: 'number', suffix: 'kg' },
      { id: 'stabMarital', label: 'Estado civil', kind: 'single', options: ['Casado(a)', 'União estável', 'Divorciado(a)', 'Separado(a)', 'Viúvo(a)', 'Nunca casou'] },
      { id: 'stabEducation', label: 'Maior grau de escolaridade completo', kind: 'single', options: ['Ensino fundamental', 'Ensino médio', 'Ensino superior incompleto', 'Ensino superior completo', 'Pós-graduação'] },
    ],
  },
  {
    id: 'stab-a1',
    title: 'STAB A1 — Bruxismo do sono',
    questions: [
      { id: 'a1Sleep', label: 'Nos últimos 30 dias, com que frequência apertou ou rangeu os dentes durante o sono?', kind: 'single', options: ['Nenhuma vez', 'Menos que uma noite por mês', '1–3 noites por mês', '1–3 noites por semana', '4–7 noites por semana', 'Não sei'] },
    ],
  },
  {
    id: 'stab-a2',
    title: 'STAB A2 — Bruxismo em vigília',
    description: 'Frequência nos últimos 30 dias. O histórico é registrado em uma única pergunta ao final.',
    questions: [
      { id: 'a2Grinding', label: 'Ranger os dentes quando estava acordado(a)', kind: 'single', options: frequencyMonth },
      { id: 'a2Clenching', label: 'Apertar os dentes quando estava acordado(a)', kind: 'single', options: frequencyMonth },
      { id: 'a2Contact', label: 'Manter os dentes em contato, exceto durante a alimentação', kind: 'single', options: frequencyMonth },
      { id: 'a2Tension', label: 'Segurar, apertar ou tensionar os músculos sem contato dentário', kind: 'single', options: frequencyMonth },
      { id: 'aHistory', label: 'No passado, havia relato de bruxismo do sono e/ou em vigília?', kind: 'single', options: ['Não', 'Sim', 'Não sei'], help: 'Pergunta única de histórico de bruxismo, conforme definido para esta ficha.' },
    ],
  },
  {
    id: 'stab-a3',
    title: 'STAB A3 — Queixas do paciente',
    questions: [
      { id: 'a3PainDuration', label: 'Nos últimos 30 dias, como se apresentou a dor nos maxilares ou têmporas?', kind: 'single', options: ['Nenhuma dor', 'A dor vem e vai', 'A dor está sempre presente'] },
      { id: 'a3MorningPain', label: 'Dor ou rigidez nos maxilares ao acordar', kind: 'yesno', options: yesNo },
      { id: 'a3Locking', label: 'Travamento que impediu abrir completamente a boca', kind: 'yesno', options: yesNo },
      { id: 'a3PainChange', label: 'Atividades que modificaram a dor', kind: 'multi', options: ['Mastigar alimentos duros ou resistentes', 'Abrir ou movimentar a mandíbula', 'Manter os dentes juntos, apertar, ranger ou mascar chiclete', 'Falar, beijar ou bocejar'] },
      { id: 'a3Noise', label: 'Ruídos articulares ao movimentar ou usar a mandíbula', kind: 'yesno', options: yesNo },
      { id: 'a3AwakePain', label: 'Momentos com dor muscular em vigília', kind: 'multi', options: ['Entre acordar e café da manhã', 'Entre café da manhã e almoço', 'Entre almoço e jantar', 'Entre jantar e dormir', 'Nenhum'] },
      { id: 'a3Fatigue', label: 'Momentos com rigidez, cansaço ou fadiga em vigília', kind: 'multi', options: ['Entre acordar e café da manhã', 'Entre café da manhã e almoço', 'Entre almoço e jantar', 'Entre jantar e dormir', 'Nenhum'] },
      { id: 'a3WakeSymptoms', label: 'Sintomas observados ao acordar', kind: 'multi', options: ['Fadiga, dor ou aperto na mandíbula', 'Dentes apertados ou boca dolorida', 'Dor nas têmporas', 'Tensão nas ATM', 'Necessidade de movimentar a mandíbula', 'Dificuldade de abertura', 'Estalido transitório ao acordar'] },
      { id: 'a3Headache', label: 'Dor de cabeça temporal nos últimos 30 dias', kind: 'yesno', options: yesNo },
      { id: 'a3HeadacheDays', label: 'Se sim, por quantos dias?', kind: 'number', min: 0, max: 30, suffix: 'dias' },
      { id: 'a3WearSymptoms', label: 'Sintomas associados a desgaste dentário', kind: 'multi', options: ['Sensibilidade e/ou dor', 'Problemas funcionais', 'Comprometimento estético', 'Fraturas dentárias ou de restaurações', 'Alterações fonéticas', 'Nenhum'] },
      { id: 'a3Tinnitus', label: 'Zumbido ou barulhos nos ouvidos', kind: 'yesno', options: yesNo },
      { id: 'a3DryMouth', label: 'Sensação de boca seca', kind: 'single', options: ['Nunca', 'Ocasionalmente', 'Frequentemente'] },
      { id: 'a3Drooling', label: 'Salivação excessiva durante a noite', kind: 'single', options: ['Não ocorre', 'Travesseiro às vezes molhado', 'Travesseiro regularmente molhado', 'Travesseiro sempre molhado', 'Travesseiro e roupas de cama molhados toda noite'] },
    ],
  },
  {
    id: 'stab-b1',
    title: 'STAB B1 — Aspectos psicossociais',
    description: 'O PHQ-4 é preenchido separadamente na sala de espera. Esta ficha mantém somente os demais itens e o campo clínico geral de observações sobre fatores emocionais.',
    questions: [
      { id: 'b1CopingCreative', label: 'Procuro formas criativas de modificar situações difíceis', kind: 'single', options: ['Não me descreve de forma nenhuma', 'Não me descreve', 'Neutro', 'Me descreve', 'Me descreve muito bem'] },
      { id: 'b1CopingReaction', label: 'Apesar do que acontece comigo, acredito que posso controlar minhas reações', kind: 'single', options: ['Não me descreve de forma nenhuma', 'Não me descreve', 'Neutro', 'Me descreve', 'Me descreve muito bem'] },
      { id: 'b1CopingGrowth', label: 'Acredito que posso crescer de forma positiva lidando com situações difíceis', kind: 'single', options: ['Não me descreve de forma nenhuma', 'Não me descreve', 'Neutro', 'Me descreve', 'Me descreve muito bem'] },
      { id: 'b1CopingReplace', label: 'Busco ativamente formas de substituir as perdas que sofro na vida', kind: 'single', options: ['Não me descreve de forma nenhuma', 'Não me descreve', 'Neutro', 'Me descreve', 'Me descreve muito bem'] },
    ],
  },
  {
    id: 'stab-b2',
    title: 'STAB B2 — Condições relacionadas ao sono',
    questions: [
      { id: 'b2Apnea', label: 'Sinais relacionados à triagem de apneia do sono', kind: 'multi', options: ['Ronco alto', 'Cansaço ou sonolência diurna', 'Pausas respiratórias, engasgos ou respiração ofegante observados', 'Hipertensão', 'IMC maior que 35', 'Mais de 50 anos', 'Pescoço largo conforme critério do instrumento', 'Sexo masculino', 'Nenhum'] },
      { id: 'b2Insomnia', label: 'Sinais relacionados à triagem de insônia', kind: 'multi', options: ['Dificuldade para iniciar o sono', 'Pensamentos impedem o sono', 'Desperta e não consegue voltar a dormir', 'Preocupação e dificuldade para relaxar', 'Despertar precoce', 'Permanece acordado(a) por 30 minutos ou mais', 'Nenhum'] },
      { id: 'b2Movement', label: 'Sinais relacionados a movimentos periódicos dos membros ou pernas inquietas', kind: 'multi', options: ['Tensão nas pernas sem exercício', 'Contrações corporais durante o sono', 'Chutes durante a noite', 'Dor, formigamento ou cãibras nas pernas', 'Necessidade de movimentar as pernas', 'Sonolência diurna apesar de dormir', 'Nenhum'] },
      { id: 'b2SleepPosition', label: 'Frequência de posição de sono que coloca pressão sobre a mandíbula', kind: 'single', options: frequencyMonth },
    ],
  },
  {
    id: 'stab-b3',
    title: 'STAB B3 — Condições não relacionadas ao sono',
    questions: [
      { id: 'b3OralQ7', label: 'Segurar ou projetar a mandíbula para frente ou para o lado', kind: 'single', options: frequencyMonth },
      { id: 'b3OralQ8', label: 'Pressionar a língua contra os dentes', kind: 'single', options: frequencyMonth },
      { id: 'b3OralQ9', label: 'Manter a língua entre os dentes', kind: 'single', options: frequencyMonth },
      { id: 'b3OralQ10', label: 'Morder, mastigar ou brincar com língua, bochechas ou lábios', kind: 'single', options: frequencyMonth },
      { id: 'b3OralQ11', label: 'Manter a mandíbula em posição rígida ou tensa', kind: 'single', options: frequencyMonth },
      { id: 'b3OralQ12', label: 'Morder objetos, cabelos, dedos ou unhas', kind: 'single', options: frequencyMonth },
      { id: 'b3OralQ13', label: 'Mascar chiclete', kind: 'single', options: frequencyMonth },
      { id: 'b3OralQ14', label: 'Tocar instrumento musical que envolve boca ou mandíbula', kind: 'single', options: frequencyMonth },
      { id: 'b3OralQ15', label: 'Apoiar a mão no queixo', kind: 'single', options: frequencyMonth },
      { id: 'b3OralQ16', label: 'Mastigar apenas de um lado', kind: 'single', options: frequencyMonth },
      { id: 'b3OralQ17', label: 'Comer entre as refeições', kind: 'single', options: frequencyMonth },
      { id: 'b3OralQ18', label: 'Falar constantemente', kind: 'single', options: frequencyMonth },
      { id: 'b3OralQ19', label: 'Cantar', kind: 'single', options: frequencyMonth },
      { id: 'b3OralQ20', label: 'Bocejar', kind: 'single', options: frequencyMonth },
      { id: 'b3OralQ21', label: 'Segurar o telefone entre a cabeça e os ombros', kind: 'single', options: frequencyMonth },
      { id: 'b3Smartphone', label: 'Tempo médio diário de uso de smartphone', kind: 'number', suffix: 'horas' },
      { id: 'b3Motor', label: 'Desordens motoras orofaciais já diagnosticadas ou com sinais', kind: 'multi', options: ['Discinesia orofacial', 'Distonia oromandibular', 'Doença de Parkinson', 'Doença de Huntington', 'Síndrome de Tourette', 'Espasmo hemifacial', 'Discinesia tardia', 'Nenhuma'] },
      { id: 'b3RefluxHeartburn', label: 'Azia — frequência por semana', kind: 'single', options: ['0 dias', '1 dia', '2–3 dias', '4–7 dias'] },
      { id: 'b3RefluxRegurgitation', label: 'Regurgitação — frequência por semana', kind: 'single', options: ['0 dias', '1 dia', '2–3 dias', '4–7 dias'] },
      { id: 'b3RefluxAbdominalPain', label: 'Dor na parte superior ou média do abdômen — frequência por semana', kind: 'single', options: ['0 dias', '1 dia', '2–3 dias', '4–7 dias'] },
      { id: 'b3RefluxNausea', label: 'Náusea — frequência por semana', kind: 'single', options: ['0 dias', '1 dia', '2–3 dias', '4–7 dias'] },
      { id: 'b3RefluxSleep', label: 'Dificuldade para dormir por azia ou regurgitação — frequência por semana', kind: 'single', options: ['0 dias', '1 dia', '2–3 dias', '4–7 dias'] },
      { id: 'b3RefluxSelfMedication', label: 'Automedicação para azia ou regurgitação — frequência por semana', kind: 'single', options: ['0 dias', '1 dia', '2–3 dias', '4–7 dias'] },
      { id: 'b3Autoimmune', label: 'Condições autoimunes ou do tecido conjuntivo', kind: 'multi', options: ['Artrite reumatoide', 'Lúpus', 'Doenças reumáticas sistêmicas ou fibromialgia', 'Esclerose sistêmica', 'Polimialgia reumática', 'Doença mista do tecido conjuntivo', 'Outra', 'Nenhuma'] },
      { id: 'b3Adhd', label: 'Diagnóstico prévio de TDAH', kind: 'yesno', options: yesNo },
    ],
  },
  {
    id: 'stab-b4',
    title: 'STAB B4 — Medicações e substâncias',
    questions: [
      { id: 'b4Recreational', label: 'Uso de drogas recreativas ou ilegais', kind: 'yesno', options: yesNo },
      { id: 'b4RecreationalWhich', label: 'Se sim, quais?', kind: 'text' },
      { id: 'b4MedicationTypes', label: 'Classes de medicação em uso', kind: 'multi', options: ['Antidepressivos', 'Benzodiazepínicos', 'Neurolépticos, antipsicóticos ou antieméticos', 'Medicações para TDAH', 'Antialérgicos', 'Cannabis medicinal — CBD', 'Cannabis medicinal — THC', 'Opioides', 'Outras', 'Nenhuma'] },
      { id: 'b4MedicationList', label: 'Medicações e respectivas doses', kind: 'textarea' },
      { id: 'b4Tobacco', label: 'Tabaco', kind: 'single', options: ['Não usa', 'Usa atualmente', 'Parou de usar'] },
      { id: 'b4TobaccoAmount', label: 'Se usa tabaco, quantidade de cigarros por dia', kind: 'number', suffix: 'cigarros/dia' },
      { id: 'b4Alcohol', label: 'Bebidas alcoólicas', kind: 'single', options: ['Não consome', 'Consome atualmente', 'Parou de consumir'] },
      { id: 'b4AlcoholAmount', label: 'Se consome álcool, quantidade aproximada', kind: 'number', suffix: 'copos/dia' },
      { id: 'b4SoftDrinks', label: 'Refrigerantes e bebidas energéticas', kind: 'single', options: ['Não consome', 'Consome atualmente', 'Parou de consumir'] },
      { id: 'b4SoftDrinksAmount', label: 'Se consome refrigerantes ou energéticos, quantidade aproximada', kind: 'number', suffix: 'copos/dia' },
      { id: 'b4Citrus', label: 'Sucos ou frutas cítricas', kind: 'single', options: ['Não consome', 'Consome atualmente', 'Parou de consumir'] },
      { id: 'b4CitrusAmount', label: 'Se consome sucos ou frutas cítricas, quantidade aproximada', kind: 'number', suffix: 'porções/dia' },
      { id: 'b4Caffeine', label: 'Café, chá ou outras bebidas com cafeína', kind: 'single', options: ['Não consome', 'Consome atualmente', 'Parou de consumir'] },
      { id: 'b4CaffeineAmount', label: 'Se consome cafeína, quantidade aproximada', kind: 'number', suffix: 'xícaras/dia' },
      { id: 'b4ConsumptionNotes', label: 'Comentários sobre medicações e substâncias', kind: 'textarea' },
    ],
  },
  {
    id: 'stab-b5',
    title: 'STAB B5 — Histórico familiar',
    description: 'Fatores familiares adicionais do instrumento.',
    questions: [
      { id: 'b5Bruxism', label: 'Há histórico de bruxismo na família?', kind: 'single', options: ['Não', 'Sim', 'Não sei'] },
      { id: 'b5BruxismWho', label: 'Se sim, qual familiar?', kind: 'multi', options: ['Pai', 'Mãe', 'Filho', 'Filha', 'Avô', 'Avó'] },
      { id: 'b5Wear', label: 'Há histórico de desgaste dentário na família?', kind: 'single', options: ['Não', 'Sim', 'Não sei'] },
      { id: 'b5WearWho', label: 'Se sim, qual familiar?', kind: 'multi', options: ['Pai', 'Mãe', 'Filho', 'Filha', 'Avô', 'Avó'] },
      { id: 'b5Apnea', label: 'Há histórico de apneia do sono na família?', kind: 'single', options: ['Não', 'Sim', 'Não sei'] },
      { id: 'b5ApneaWho', label: 'Se sim, qual familiar?', kind: 'multi', options: ['Pai', 'Mãe', 'Filho', 'Filha', 'Avô', 'Avó'] },
      { id: 'b5OrofacialPain', label: 'Há histórico de dor orofacial não odontogênica na família?', kind: 'single', options: ['Não', 'Sim', 'Não sei'] },
      { id: 'b5OrofacialPainWho', label: 'Se sim, qual familiar?', kind: 'multi', options: ['Pai', 'Mãe', 'Filho', 'Filha', 'Avô', 'Avó'] },
      { id: 'b5Reflux', label: 'Há histórico de refluxo gastroesofágico na família?', kind: 'single', options: ['Não', 'Sim', 'Não sei'] },
      { id: 'b5RefluxWho', label: 'Se sim, qual familiar?', kind: 'multi', options: ['Pai', 'Mãe', 'Filho', 'Filha', 'Avô', 'Avó'] },
    ],
  },
];

const combinedStabA3RepeatedIds = new Set([
  'a3PainDuration',
  'a3Locking',
  'a3PainChange',
  'a3Noise',
  'a3Headache',
]);

/**
 * STAB for visits that also use DC/TMD. DC/TMD answers are canonical for pain
 * pattern, pain modifiers, temporal headache, joint noise and locking.
 */
export const combinedStabSections: InstrumentSection[] = stabSections.map((section) => {
  if (section.id !== 'stab-a3') return section;
  return {
    ...section,
    title: 'STAB A3 — Queixas complementares',
    description: 'Os itens equivalentes já respondidos no DC/TMD foram omitidos nesta versão combinada.',
    questions: section.questions
      .filter((question) => !combinedStabA3RepeatedIds.has(question.id))
      .map((question) => question.id === 'a3HeadacheDays'
        ? { ...question, id: 'combinedA3HeadacheDays', label: 'Se houve dor de cabeça temporal, em quantos dias ela ocorreu nos últimos 30 dias?' }
        : question),
  };
});

/** General clinical fields adjusted only for the combined path. */
export const combinedAnamnesisSections: InstrumentSection[] = anamnesisSections.map((section) => ({
  ...section,
  questions: section.questions
    .filter((question) => question.id !== 'currentMedication')
    .map((question) => {
      if (question.id === 'sleepQuality') return { ...question, label: 'Comentários adicionais sobre o sono' };
      if (question.id === 'parafunctionalHabits') return { ...question, label: 'Outros hábitos parafuncionais e observações' };
      return question;
    }),
}));

export const dtmDiagnoses = [
  'Mialgia',
  'Mialgia com dor espalhada',
  'Dor miofascial com referência',
  'Artralgia direita',
  'Artralgia esquerda',
  'Cefaleia atribuída à DTM',
  'Deslocamento do disco com redução',
  'Deslocamento do disco com redução e travamento intermitente',
  'Deslocamento do disco sem redução com limitação de abertura',
  'Deslocamento do disco sem redução sem limitação de abertura',
  'Doença articular degenerativa',
  'Subluxação',
  'Outro',
];

export const softTissueFindings = [
  'Linha alba',
  'Marcações nos lábios',
  'Edentações na língua',
  'Ulcerações na língua',
  'Exostoses do osso alveolar',
  'Alterações em mandíbula',
  'Alterações em maxila',
  'Outro',
];

export const toothWearMechanicSigns = [
  'Facetas brilhantes, planas e polidas',
  'Desgaste proporcional em esmalte e dentina',
  'Desgastes coincidentes entre antagonistas',
  'Fraturas de cúspides ou restaurações',
  'Impressões em bochechas, língua ou lábios',
  'Lesões cervicais não cariosas',
  'Lesões vestibulares ou cervicais amplas',
  'Áreas cervicais de pré-molares e caninos afetadas',
  'Trincas no esmalte',
  'Tórus mandibular',
  'Outro',
];
