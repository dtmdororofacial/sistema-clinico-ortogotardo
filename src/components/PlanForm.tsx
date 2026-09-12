import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Values = Record<string, string | number | string[] | undefined>;

const painDiagnoses = ['Nenhuma', 'Mialgia', 'Mialgia com dor espalhada', 'Dor miofascial com referência', 'Artralgia direita', 'Artralgia esquerda', 'Cefaleia atribuída à DTM', 'Outro'];
const jointDiagnoses = ['Nenhuma', 'Deslocamento de disco com redução', 'Deslocamento de disco com redução e travamento intermitente', 'Deslocamento de disco sem redução com limitação de abertura', 'Deslocamento de disco sem redução sem limitação de abertura', 'Doença articular degenerativa', 'Subluxação', 'Outro'];

function MultiChoices({ id, options, values, onChange }: { id: string; options: string[]; values: Values; onChange: (id: string, value: string[]) => void }) {
  const selected = Array.isArray(values[id]) ? (values[id] as string[]) : [];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const checked = selected.includes(option);
        return (
          <label key={option} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-xs leading-5 ${checked ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-soft)]' : 'border-slate-200'}`}>
            <Checkbox checked={checked} onCheckedChange={() => onChange(id, checked ? selected.filter((value) => value !== option) : [...selected, option])} className="mt-0.5" />
            {option}
          </label>
        );
      })}
    </div>
  );
}

export function PlanForm({ destination, values, onChange }: { destination: 'dtm' | 'bruxismo' | 'combinado'; values: Values; onChange: (id: string, value: string | number | string[]) => void }) {
  return (
    <div className="space-y-5">
      <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-base font-semibold text-[var(--brand-navy)]">Diagnóstico profissional de DTM {destination === 'bruxismo' ? '(quando avaliado)' : ''}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">O sistema apenas registra as alternativas selecionadas pelo profissional. Não calcula nem sugere diagnóstico.</p>
            <div className="mt-5 space-y-5">
              <fieldset>
                <legend className="mb-2 text-xs font-semibold text-slate-700">Desordens dolorosas</legend>
                <MultiChoices id="dtmPainDiagnosis" options={painDiagnoses} values={values} onChange={onChange} />
              </fieldset>
              {(['direita', 'esquerda'] as const).map((side) => (
                <fieldset key={side}>
                  <legend className="mb-2 text-xs font-semibold capitalize text-slate-700">ATM {side}</legend>
                  <MultiChoices id={`dtmJointDiagnosis_${side}`} options={jointDiagnoses} values={values} onChange={onChange} />
                </fieldset>
              ))}
              <label className="block space-y-2 text-xs font-semibold text-slate-700">
                Outro diagnóstico e comentários
                <Textarea className="min-h-24" value={String(values.dtmDiagnosisComments ?? '')} onChange={(event) => onChange('dtmDiagnosisComments', event.target.value)} />
              </label>
            </div>
          </section>
        </>
      {destination === 'bruxismo' || destination === 'combinado' ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-[var(--brand-navy)]">Avaliação de bruxismo</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">Registre a avaliação profissional. O sistema não utiliza a expressão “diagnóstico de bruxismo” e não produz classificação automática.</p>
          <label className="mt-4 block space-y-2 text-xs font-semibold text-slate-700">
            Síntese da avaliação
            <Textarea className="min-h-32" value={String(values.bruxismAssessment ?? '')} onChange={(event) => onChange('bruxismAssessment', event.target.value)} />
          </label>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-[var(--brand-navy)]">Conduta e continuidade</h3>
        <div className="mt-4 grid gap-4">
          <label className="space-y-2 text-xs font-semibold text-slate-700">
            Procedimentos realizados nesta consulta
            <Textarea className="min-h-24" value={String(values.procedures ?? '')} onChange={(event) => onChange('procedures', event.target.value)} />
          </label>
          <label className="space-y-2 text-xs font-semibold text-slate-700">
            Plano para a próxima consulta
            <Textarea className="min-h-24" value={String(values.nextPlan ?? '')} onChange={(event) => onChange('nextPlan', event.target.value)} />
          </label>
          <label className="space-y-2 text-xs font-semibold text-slate-700">
            Continuidade
            <select value={String(values.followUp ?? '')} onChange={(event) => onChange('followUp', event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 sm:max-w-md">
              <option value="">Selecione</option>
              <option>Retorno agendado</option><option>Retorno conforme necessidade</option><option>Encaminhamento</option><option>Alta</option><option>Outro</option>
            </select>
          </label>
          {values.followUp === 'Retorno agendado' ? (
            <label className="space-y-2 text-xs font-semibold text-slate-700 sm:max-w-xs">
              Data prevista
              <Input type="date" value={String(values.followUpDate ?? '')} onInput={(event) => onChange('followUpDate', event.currentTarget.value)} />
            </label>
          ) : null}
        </div>
      </section>
    </div>
  );
}
