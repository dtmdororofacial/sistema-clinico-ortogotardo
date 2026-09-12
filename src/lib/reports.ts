import type { Complaint } from '@/src/components/ComplaintForm';
import type { Answers } from '@/src/components/InstrumentForm';
import type { PainPoint } from '@/src/components/PainMap';
import type { ExamMode } from '@/src/components/PhysicalExamForm';
import {
  anamnesisSections,
  combinedAnamnesisSections,
  combinedStabSections,
  dctmdSymptomSections,
  gcpsSection,
  stabSections,
  type InstrumentSection,
} from '@/src/domain/instruments';
import { calculateCpi, isMeaningful } from '@/src/lib/clinical';

export type ReportItem = { label: string; value: string | number | string[] };
export type ReportSection = { title: string; items: ReportItem[] };
export type ReportDocument = { name: string; sections: ReportSection[] };

const manualLabels: Record<string, string> = {
  painLocation_direito: 'Local da dor — lado direito',
  painLocation_esquerdo: 'Local da dor — lado esquerdo',
  headacheLocation: 'Localização da cefaleia nos últimos 30 dias',
  referenceTooth: 'Dente de referência',
  horizontalOverlap: 'Trespasse horizontal (mm)',
  verticalOverlap: 'Trespasse vertical (mm)',
  midlineDeviation: 'Desvio de linha média (mm)',
  openingPattern: 'Padrão de abertura e fechamento',
  openingNoPain: 'Abertura sem dor (mm)',
  openingMaxUnassisted: 'Abertura máxima não assistida (mm)',
  openingMaxAssisted: 'Abertura máxima assistida (mm)',
  lateralRight: 'Lateralidade direita (mm)',
  lateralLeft: 'Lateralidade esquerda (mm)',
  protrusion: 'Protrusão (mm)',
  movementPainComments: 'Dor ou cefaleia familiar durante os movimentos',
  jointLockingComments: 'Travamentos e comentários articulares',
  palpationComments: 'Comentários da palpação',
  masseterHypertrophy: 'Hipertrofia do masséter',
  softTissueFindings: 'Achados em tecidos moles e ósseos',
  softTissueOptions: 'Achados selecionados em tecidos moles e ósseos',
  toothWearSigns: 'Sinais mecânicos e de desgaste',
  dentalPeriodontal: 'Exame dental e periodontal',
  restorationsImplants: 'Restaurações e implantes',
  oralDevice: 'Achados no dispositivo oral rígido',
  examObservations: 'Observações livres do exame físico',
  dtmPainDiagnosis: 'Desordens dolorosas registradas pelo profissional',
  dtmJointDiagnosis_direita: 'Diagnósticos da ATM direita',
  dtmJointDiagnosis_esquerda: 'Diagnósticos da ATM esquerda',
  dtmDiagnosisComments: 'Outro diagnóstico e comentários',
  bruxismAssessment: 'Síntese da avaliação de bruxismo',
  procedures: 'Procedimentos realizados nesta consulta',
  nextPlan: 'Plano para a próxima consulta',
  followUp: 'Continuidade',
  followUpDate: 'Data prevista',
  returnDate: 'Data do retorno',
  returnPain30: 'Intensidade média da dor nos últimos 30 dias',
  returnComplaintNotes: 'Observações do retorno sobre as queixas',
  returnJointNoise: 'Presença de ruídos articulares',
  returnOpeningNoPain: 'Abertura sem dor (mm)',
  returnOpeningMaxUnassisted: 'Abertura máxima não assistida (mm)',
  returnOpeningMaxAssisted: 'Abertura máxima assistida (mm)',
  return_palpationComments: 'Comentários da palpação',
  returnAssessment: 'Avaliação atual ou diagnóstico realizado nesta consulta',
  returnProcedures: 'Procedimentos da consulta',
  returnNextPlan: 'Plano para a próxima consulta',
  returnObservations: 'Observações adicionais',
};

const allInstrumentSections = [...dctmdSymptomSections, gcpsSection, ...stabSections, ...anamnesisSections];
const questionLabels = Object.fromEntries(
  allInstrumentSections.flatMap((section) => section.questions.map((question) => [question.id, question.label])),
);

function labelFor(id: string) {
  if (manualLabels[id] || questionLabels[id]) return manualLabels[id] || questionLabels[id];
  const palpationMatch = id.match(/^(return_)?palp_(.+)_(direito|esquerdo)_(status|intensity|familiar|referred|referredTo|headache)$/);
  if (palpationMatch) {
    const [, , structure, side, field] = palpationMatch;
    const fieldLabels: Record<string, string> = {
      status: 'Resultado', intensity: 'Intensidade', familiar: 'Dor familiar', referred: 'Dor referida', referredTo: 'Local da referência', headache: 'Cefaleia familiar',
    };
    return `${structure.replaceAll('_', ' ')} — lado ${side} — ${fieldLabels[field]}`;
  }
  const noiseMatch = id.match(/^noise_(.+)_(direita|esquerda)$/);
  if (noiseMatch) return `Ruído em ${noiseMatch[1].replaceAll('_', ' ')} — ${noiseMatch[2]}`;
  const wearMatch = id.match(/^wear_s(\d+)_(occlusal|palatal)$/);
  if (wearMatch) return `Desgaste no sextante ${wearMatch[1]} — ${wearMatch[2] === 'occlusal' ? 'oclusal/incisal' : 'palatino'}`;
  const sextantMatch = id.match(/^(dental|restoration)_(.+)_s(\d)$/);
  if (sextantMatch) return `${sextantMatch[2].replaceAll('_', ' ')} — sextante ${sextantMatch[3]}`;
  const deviceMatch = id.match(/^device_(.+)$/);
  if (deviceMatch) return `Dispositivo oral — ${deviceMatch[1].replaceAll('_', ' ')}`;
  return id.replaceAll('_', ' ');
}

function recorded(value: unknown) {
  return value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0);
}

function examRecorded(value: unknown) {
  return recorded(value) && String(value).toLowerCase() !== 'não avaliado';
}

function sectionFromAnswers(title: string, section: InstrumentSection, answers: Answers, positiveOnly = true): ReportSection {
  return {
    title,
    items: section.questions
      .filter((question) => positiveOnly ? isMeaningful(answers[question.id]) : recorded(answers[question.id]))
      .map((question) => ({ label: question.label, value: answers[question.id] as string | number | string[] })),
  };
}

function complaintSections(complaints: Complaint[]): ReportSection[] {
  return complaints.filter((complaint) => complaint.title.trim()).map((complaint, index) => {
    const items: ReportItem[] = [
      { label: index === 0 ? 'Queixa principal' : `Queixa ${index + 1}`, value: complaint.title },
      { label: 'Histórico da queixa', value: complaint.history },
      { label: 'Início', value: complaint.onset },
      { label: 'Frequência e duração', value: complaint.frequencyDuration },
      { label: 'Evolução', value: complaint.evolution },
      ...(complaint.painful ? [
        { label: 'Qualidade', value: complaint.quality },
        { label: 'Intensidade média nos últimos 30 dias', value: `${complaint.averagePain30Days ?? 0}/10` },
        { label: 'Comentários sobre intensidade', value: complaint.intensityComments },
        { label: 'Fatores de piora', value: complaint.worsening },
        { label: 'Fatores de melhora', value: complaint.improvement },
        { label: 'Fatores desencadeantes', value: complaint.trigger },
      ] : []),
      { label: 'Sintomas acompanhantes', value: complaint.accompanying },
    ];
    return { title: index === 0 ? 'Queixa principal' : `Queixa ${index + 1}`, items: items.filter((item) => recorded(item.value)) };
  });
}

function mapSection(points: PainPoint[]): ReportSection {
  return {
    title: 'Mapa da dor',
    items: points.map((point, index) => ({
      label: `Ponto ${index + 1} — queixa ${point.complaint}`,
      value: `${point.region}; ${point.side}; intensidade ${point.intensity}/10; ${point.painType}; coordenadas ${point.x.toFixed(1)}%, ${point.y.toFixed(1)}%`,
    })),
  };
}

export function buildDocuments({
  type,
  destination,
  examMode,
  complaints,
  painPoints,
  answers,
}: {
  type: 'INICIAL' | 'RETORNO';
  destination: 'dtm' | 'bruxismo' | 'combinado' | null;
  examMode: ExamMode;
  complaints: Complaint[];
  painPoints: PainPoint[];
  answers: Answers;
}): ReportDocument[] {
  if (type === 'RETORNO') {
    const returnItems = Object.entries(answers)
      .filter(([id, value]) => id.startsWith('return') && examRecorded(value))
      .map(([id, value]) => ({ label: labelFor(id), value: value as string | number | string[] }));
    return [{ name: 'Retorno clínico.pdf', sections: [{ title: 'Retorno clínico', items: returnItems }] }];
  }

  const clinicalSections = destination === 'dtm'
    ? [...dctmdSymptomSections, gcpsSection, ...anamnesisSections]
    : destination === 'bruxismo'
      ? [...stabSections, ...anamnesisSections]
      : [...dctmdSymptomSections, gcpsSection, ...combinedStabSections, ...combinedAnamnesisSections];
  const anamnesis = [
    ...complaintSections(complaints),
    ...(painPoints.length ? [mapSection(painPoints)] : []),
    ...clinicalSections.map((section) => sectionFromAnswers(section.title, section, answers, true)),
  ];
  const cpi = calculateCpi(answers);
  if (destination !== 'bruxismo' && cpi !== null) anamnesis.push({ title: 'Resultado calculado', items: [{ label: 'Intensidade característica da dor', value: `${cpi}/100` }] });

  const examItems = Object.entries(answers)
    .filter(([id, value]) => {
      const isExam = id.startsWith('palp_') || id.startsWith('noise_') || id.startsWith('wear_') || id.startsWith('dental_') || id.startsWith('restoration_') || id.startsWith('device_') || [
        'painLocation_direito', 'painLocation_esquerdo', 'headacheLocation', 'referenceTooth', 'horizontalOverlap', 'verticalOverlap', 'midlineDeviation', 'openingPattern', 'openingNoPain', 'openingMaxUnassisted', 'openingMaxAssisted', 'lateralRight', 'lateralLeft', 'protrusion', 'movementPainComments', 'jointLockingComments', 'palpationComments', 'masseterHypertrophy', 'softTissueOptions', 'softTissueFindings', 'toothWearSigns', 'dentalPeriodontal', 'restorationsImplants', 'oralDevice', 'examObservations',
      ].includes(id);
      return isExam && examRecorded(value);
    })
    .map(([id, value]) => ({ label: labelFor(id), value: value as string | number | string[] }));

  const planItems = Object.entries(answers)
    .filter(([id, value]) => ['dtmPainDiagnosis', 'dtmJointDiagnosis_direita', 'dtmJointDiagnosis_esquerda', 'dtmDiagnosisComments', 'bruxismAssessment', 'procedures', 'nextPlan', 'followUp', 'followUpDate'].includes(id) && recorded(value))
    .map(([id, value]) => ({ label: labelFor(id), value: value as string | number | string[] }));

  return [
    { name: '01 Anamnese e resumo clínico.pdf', sections: anamnesis.filter((section) => section.items.length) },
    { name: '02 Exame físico.pdf', sections: [{ title: `Exame físico — ${examMode}`, items: examItems }] },
    { name: '03 Diagnóstico avaliação e plano.pdf', sections: [{ title: destination === 'dtm' ? 'Diagnóstico profissional e plano' : destination === 'bruxismo' ? 'Avaliação de bruxismo e plano' : 'Diagnóstico de DTM, avaliação de bruxismo e plano', items: planItems }] },
  ].filter((document) => document.sections.some((section) => section.items.length));
}
