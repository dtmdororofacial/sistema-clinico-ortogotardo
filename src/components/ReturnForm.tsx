import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PalpationMatrix } from '@/src/components/PhysicalExamForm';

type Values = Record<string, string | number | string[] | undefined>;

export function ReturnForm({ values, onChange }: { values: Values; onChange: (id: string, value: string | number | string[]) => void }) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-[var(--brand-navy)]">Evolução das queixas</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-xs font-semibold text-slate-700">
            Data do retorno
            <Input type="date" value={String(values.returnDate ?? new Date().toISOString().slice(0, 10))} onInput={(event) => onChange('returnDate', event.currentTarget.value)} />
          </label>
          <label className="space-y-2 text-xs font-semibold text-slate-700">
            Intensidade média da dor nos últimos 30 dias
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="10" value={Number(values.returnPain30 ?? 0)} onChange={(event) => onChange('returnPain30', Number(event.target.value))} className="w-full accent-[var(--brand-blue)]" />
              <output className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-blue-soft)] font-bold text-[var(--brand-blue)]">{Number(values.returnPain30 ?? 0)}</output>
            </div>
          </label>
          <label className="space-y-2 text-xs font-semibold text-slate-700 sm:col-span-2">
            Observações do retorno sobre as queixas
            <Textarea className="min-h-28" value={String(values.returnComplaintNotes ?? '')} onChange={(event) => onChange('returnComplaintNotes', event.target.value)} />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-[var(--brand-navy)]">ATM e abertura de boca</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="space-y-2 text-xs font-semibold text-slate-700 sm:col-span-3">
            Presença de ruídos articulares
            <Textarea className="min-h-20" value={String(values.returnJointNoise ?? '')} onChange={(event) => onChange('returnJointNoise', event.target.value)} placeholder="Registre lado, tipo de ruído, movimento e comentários." />
          </label>
          {[
            ['returnOpeningNoPain', 'Abertura sem dor'],
            ['returnOpeningMaxUnassisted', 'Abertura máxima não assistida'],
            ['returnOpeningMaxAssisted', 'Abertura máxima assistida'],
          ].map(([id, label]) => (
            <label key={id} className="space-y-2 text-xs font-semibold text-slate-700">
              {label} (mm)
              <Input type="number" min="0" value={values[id] === undefined ? '' : Number(values[id])} onChange={(event) => onChange(id, event.target.value === '' ? '' : Number(event.target.value))} />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-[var(--brand-navy)]">Palpação realizada no retorno</h3>
        <p className="mt-1 text-xs text-slate-500">Mesma matriz do exame físico. Preencha apenas as estruturas avaliadas.</p>
        <div className="mt-4"><PalpationMatrix answers={values} onChange={onChange} prefix="return_" /></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-[var(--brand-navy)]">Registro da consulta</h3>
        <div className="mt-4 grid gap-4">
          <label className="space-y-2 text-xs font-semibold text-slate-700">
            Avaliação atual ou diagnóstico realizado nesta consulta
            <Textarea className="min-h-24" value={String(values.returnAssessment ?? '')} onChange={(event) => onChange('returnAssessment', event.target.value)} />
          </label>
          <label className="space-y-2 text-xs font-semibold text-slate-700">
            Procedimentos da consulta
            <Textarea className="min-h-24" value={String(values.returnProcedures ?? '')} onChange={(event) => onChange('returnProcedures', event.target.value)} />
          </label>
          <label className="space-y-2 text-xs font-semibold text-slate-700">
            Plano para a próxima consulta
            <Textarea className="min-h-24" value={String(values.returnNextPlan ?? '')} onChange={(event) => onChange('returnNextPlan', event.target.value)} />
          </label>
          <label className="space-y-2 text-xs font-semibold text-slate-700">
            Observações adicionais
            <Textarea className="min-h-24" value={String(values.returnObservations ?? '')} onChange={(event) => onChange('returnObservations', event.target.value)} />
          </label>
        </div>
      </section>
    </div>
  );
}
