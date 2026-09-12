import { CheckCircle2, FileText, ShieldCheck } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import type { Complaint } from '@/src/components/ComplaintForm';
import type { PainPoint } from '@/src/components/PainMap';
import { anamnesisSections, combinedAnamnesisSections, combinedStabSections, dctmdSymptomSections, gcpsSection, stabSections } from '@/src/domain/instruments';
import { calculateCpi, isMeaningful } from '@/src/lib/clinical';

type Values = Record<string, string | number | string[] | undefined>;

export function ReviewForm({
  patientName,
  age,
  destination,
  complaints,
  painPoints,
  values,
  consent,
  onConsentChange,
}: {
  patientName: string;
  age: number | null;
  destination: 'dtm' | 'bruxismo' | 'combinado';
  complaints: Complaint[];
  painPoints: PainPoint[];
  values: Values;
  consent: boolean;
  onConsentChange: (value: boolean) => void;
}) {
  const cpi = calculateCpi(values);
  const relevantSections = destination === 'dtm'
    ? [...dctmdSymptomSections, gcpsSection, ...anamnesisSections]
    : destination === 'bruxismo'
      ? [...stabSections, ...anamnesisSections]
      : [...dctmdSymptomSections, gcpsSection, ...combinedStabSections, ...combinedAnamnesisSections];
  const domainSummaries = relevantSections.map((section) => ({
    title: section.title,
    findings: section.questions.filter((question) => isMeaningful(values[question.id])).map((question) => ({ label: question.label, value: values[question.id] })),
  })).filter((section) => section.findings.length);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-5" /></span>
          <div>
            <h3 className="text-base font-semibold text-[var(--brand-navy)]">Revisão do prontuário</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">Confira os dados antes de finalizar. A finalização bloqueia esta versão; correções posteriores geram novo histórico.</p>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-slate-500">Paciente</dt><dd className="mt-1 font-semibold">{patientName || 'Não informado'}</dd></div>
          <div><dt className="text-xs text-slate-500">Idade</dt><dd className="mt-1 font-semibold">{age === null ? 'Não calculada' : `${age} anos`}</dd></div>
          <div><dt className="text-xs text-slate-500">Caminho</dt><dd className="mt-1 font-semibold">{destination === 'dtm' ? 'DTM' : destination === 'bruxismo' ? 'Avaliação de bruxismo' : 'DTM + STAB'}</dd></div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-navy)]"><FileText className="size-4" /> Resumo clínico</h3>
        <div className="mt-4 space-y-4">
          {complaints.filter((complaint) => complaint.title.trim()).map((complaint, index) => (
            <div key={index} className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand-orange)]">{index === 0 ? 'Queixa principal' : `Queixa ${index + 1}`}</p>
              <p className="mt-1 text-sm font-semibold">{complaint.title}</p>
              {complaint.history ? <p className="mt-2 text-xs leading-5 text-slate-600">{complaint.history}</p> : null}
              {complaint.painful ? <p className="mt-2 text-xs text-slate-600">Dor média em 30 dias: {complaint.averagePain30Days ?? 0}/10</p> : null}
            </div>
          ))}
          {cpi !== null ? <p className="rounded-xl bg-[var(--brand-blue-soft)] p-4 text-sm font-semibold text-[var(--brand-blue)]">Intensidade característica da dor: {cpi}/100</p> : null}
          {painPoints.length ? <p className="text-xs text-slate-600">Regiões registradas no mapa da dor: {painPoints.map((point) => `${point.region} (${point.side})`).join(', ')}.</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-[var(--brand-navy)]">{destination === 'dtm' ? 'Achados da anamnese' : destination === 'bruxismo' ? 'Resultados por domínio do STAB' : 'Achados da anamnese e resultados por domínio do STAB'}</h3>
        <p className="mt-1 text-xs text-slate-500">{destination === 'dtm' ? 'Somente respostas clínicas pertinentes.' : 'STAB sem pontuação global e sem sugestão diagnóstica.'}</p>
        <div className="mt-4 grid gap-3">
          {domainSummaries.length ? domainSummaries.map((section) => (
            <details key={section.title} className="rounded-xl bg-slate-50 p-3">
              <summary className="cursor-pointer text-xs font-semibold text-slate-700">{section.title} · {section.findings.length} achado(s)</summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">{section.findings.map((finding) => <div key={finding.label} className="rounded-lg bg-white p-3 text-xs"><span className="font-semibold text-slate-700">{finding.label}</span><p className="mt-1 break-words text-slate-500">{Array.isArray(finding.value) ? finding.value.join(', ') : String(finding.value)}</p></div>)}</div>
            </details>
          )) : <p className="text-xs text-slate-500">Nenhum achado adicional preenchido.</p>}
        </div>
      </section>

      <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-5 ${consent ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
        <Checkbox checked={consent} onCheckedChange={(value) => onConsentChange(Boolean(value))} className="mt-0.5" />
        <span>
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800"><ShieldCheck className="size-4" /> Confirmação obrigatória</span>
          <span className="mt-1 block text-xs leading-5 text-slate-600">Declaro que a autorização necessária para o registro deste atendimento foi obtida.</span>
        </span>
      </label>
    </div>
  );
}
