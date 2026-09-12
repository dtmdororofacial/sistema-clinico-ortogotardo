import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { softTissueFindings, toothWearMechanicSigns } from '@/src/domain/instruments';

export type ExamMode = 'dtm' | 'bruxismo' | 'combinado';
type ExamAnswers = Record<string, string | number | string[] | undefined>;

const palpationStructures = [
  'Temporal posterior',
  'Temporal médio',
  'Temporal anterior',
  'Masséter origem',
  'Masséter corpo',
  'Masséter inserção',
  'ATM polo lateral',
  'Ao redor da ATM',
  'Esternocleidomastoideo',
  'Trapézio',
  'Occipitais',
  'Outros',
];

const jointMovements = ['Abertura', 'Fechamento', 'Lateralidade direita', 'Lateralidade esquerda', 'Protrusão'];
const dentalRows = ['Mobilidade', 'Sensibilidade térmica', 'Dor ao morder', 'Dentes fraturados'];
const restorationRows = ['Restaurações perdidas ou quebradas', 'Restaurações desgastadas', 'Fraturas de cerâmica', 'Implantes com mobilidade', 'Fraturas de implantes', 'Perda de parafuso de implantes'];
const deviceSigns = ['Marcas de atrito', 'Marcas de apertamento', 'Marcas combinadas', 'Fraturas ou perfurações'];

function safeKey(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
}

function SextantMatrix({ prefix, rows, answers, onChange }: { prefix: string; rows: string[]; answers: ExamAnswers; onChange: (id: string, value: string | number | string[]) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-xs"><thead><tr><th className="border border-slate-200 bg-slate-50 p-2 text-left">Achado</th>{[1, 2, 3, 4, 5, 6].map((sextant) => <th key={sextant} className="border border-slate-200 bg-slate-50 p-2">Sextante {sextant}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row}><th className="border border-slate-200 p-2 text-left font-medium">{row}</th>{[1, 2, 3, 4, 5, 6].map((sextant) => { const id = `${prefix}_${safeKey(row)}_s${sextant}`; return <td key={id} className="border border-slate-200 p-1"><Input aria-label={`${row}, sextante ${sextant}`} type="number" min="0" className="h-9 min-w-16" value={answers[id] === undefined ? '' : Number(answers[id])} onChange={(event) => onChange(id, event.target.value === '' ? '' : Number(event.target.value))} /></td>; })}</tr>)}</tbody></table></div>;
}

export function PalpationMatrix({ answers, onChange, prefix = '' }: { answers: ExamAnswers; onChange: (id: string, value: string | number | string[]) => void; prefix?: string }) {
  return (
    <div className="space-y-3">
      {palpationStructures.map((structure) => {
        const base = `${prefix}palp_${safeKey(structure)}`;
        return (
          <div key={structure} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-[var(--brand-navy)]">{structure}</p>
            <div className="grid gap-3 lg:grid-cols-2">
              {(['direito', 'esquerdo'] as const).map((side) => {
                const status = String(answers[`${base}_${side}_status`] ?? 'Não avaliado');
                const hasPain = status === 'Dor';
                return (
                  <div key={side} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold capitalize text-slate-700">Lado {side}</span>
                      <select
                        value={status}
                        onChange={(event) => onChange(`${base}_${side}_status`, event.target.value)}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs"
                      >
                        <option>Não avaliado</option>
                        <option>Sem dor</option>
                        <option>Dor</option>
                      </select>
                    </div>
                    {hasPain ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <fieldset className="text-[11px] font-medium text-slate-600">
                          <legend>Intensidade da dor (0–3)</legend>
                          <div className="mt-1 grid grid-cols-4 gap-1">
                            {[0, 1, 2, 3].map((intensity) => {
                              const selected = answers[`${base}_${side}_intensity`] === intensity;
                              return (
                                <button
                                  key={intensity}
                                  type="button"
                                  aria-pressed={selected}
                                  onClick={() => onChange(`${base}_${side}_intensity`, intensity)}
                                  className={`h-9 rounded-lg border text-xs font-semibold ${selected ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white' : 'border-slate-200 bg-white text-slate-700'}`}
                                >
                                  {intensity}
                                </button>
                              );
                            })}
                          </div>
                        </fieldset>
                        <label className="text-[11px] font-medium text-slate-600">
                          Dor familiar
                          <select className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2" value={String(answers[`${base}_${side}_familiar`] ?? 'Não')} onChange={(event) => onChange(`${base}_${side}_familiar`, event.target.value)}>
                            <option>Não</option><option>Sim</option>
                          </select>
                        </label>
                        <label className="text-[11px] font-medium text-slate-600">
                          Dor referida
                          <select className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2" value={String(answers[`${base}_${side}_referred`] ?? 'Não')} onChange={(event) => onChange(`${base}_${side}_referred`, event.target.value)}>
                            <option>Não</option><option>Sim</option>
                          </select>
                        </label>
                        <label className="text-[11px] font-medium text-slate-600">
                          Local da referência
                          <Input className="mt-1 h-9" value={String(answers[`${base}_${side}_referredTo`] ?? '')} onChange={(event) => onChange(`${base}_${side}_referredTo`, event.target.value)} />
                        </label>
                        {structure.startsWith('Temporal') ? (
                          <label className="text-[11px] font-medium text-slate-600 sm:col-span-2">
                            Cefaleia familiar
                            <select className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2" value={String(answers[`${base}_${side}_headache`] ?? 'Não')} onChange={(event) => onChange(`${base}_${side}_headache`, event.target.value)}>
                              <option>Não</option><option>Sim</option>
                            </select>
                          </label>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <label className="block space-y-2 text-xs font-semibold text-slate-700">
        Comentários da palpação
        <Textarea className="min-h-20" value={String(answers[`${prefix}palpationComments`] ?? '')} onChange={(event) => onChange(`${prefix}palpationComments`, event.target.value)} />
      </label>
    </div>
  );
}

function DtmExam({ answers, onChange }: { answers: ExamAnswers; onChange: (id: string, value: string | number | string[]) => void }) {
  return (
    <div className="space-y-5">
      <ExamSection title="Local da dor e cefaleia">
        <div className="grid gap-4 sm:grid-cols-2">
          {['direito', 'esquerdo'].map((side) => (
            <label key={side} className="space-y-2 text-xs font-semibold capitalize text-slate-700">
              Lado {side}
              <Input value={String(answers[`painLocation_${side}`] ?? '')} onChange={(event) => onChange(`painLocation_${side}`, event.target.value)} placeholder="Temporal, masséter, ATM ou outro" />
            </label>
          ))}
          <label className="space-y-2 text-xs font-semibold text-slate-700 sm:col-span-2">
            Localização da cefaleia nos últimos 30 dias
            <Input value={String(answers.headacheLocation ?? '')} onChange={(event) => onChange('headacheLocation', event.target.value)} />
          </label>
        </div>
      </ExamSection>

      <ExamSection title="Relações incisais e padrão de abertura">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['referenceTooth', 'Dente de referência'],
            ['horizontalOverlap', 'Trespasse horizontal (mm)'],
            ['verticalOverlap', 'Trespasse vertical (mm)'],
            ['midlineDeviation', 'Desvio de linha média (mm)'],
          ].map(([id, label]) => (
            <label key={id} className="space-y-2 text-xs font-semibold text-slate-700">
              {label}
              <Input value={String(answers[id] ?? '')} onChange={(event) => onChange(id, event.target.value)} />
            </label>
          ))}
          <label className="space-y-2 text-xs font-semibold text-slate-700 sm:col-span-2">
            Padrão de abertura e fechamento
            <select value={String(answers.openingPattern ?? 'Não avaliado')} onChange={(event) => onChange('openingPattern', event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3">
              <option>Não avaliado</option><option>Reto</option><option>Desvio corrigido</option><option>Desvio não corrigido à direita</option><option>Desvio não corrigido à esquerda</option><option>Outro</option>
            </select>
          </label>
        </div>
      </ExamSection>

      <ExamSection title="Movimentos mandibulares">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['openingNoPain', 'Abertura sem dor'],
            ['openingMaxUnassisted', 'Abertura máxima não assistida'],
            ['openingMaxAssisted', 'Abertura máxima assistida'],
            ['lateralRight', 'Lateralidade direita'],
            ['lateralLeft', 'Lateralidade esquerda'],
            ['protrusion', 'Protrusão'],
          ].map(([id, label]) => (
            <label key={id} className="space-y-2 text-xs font-semibold text-slate-700">
              {label} (mm)
              <Input type="number" min="0" value={answers[id] === undefined ? '' : Number(answers[id])} onChange={(event) => onChange(id, event.target.value === '' ? '' : Number(event.target.value))} />
            </label>
          ))}
        </div>
        <label className="mt-4 block space-y-2 text-xs font-semibold text-slate-700">
          Dor familiar ou cefaleia familiar durante os movimentos
          <Textarea className="min-h-20" value={String(answers.movementPainComments ?? '')} onChange={(event) => onChange('movementPainComments', event.target.value)} placeholder="Registre somente temporal, masséter e ATM, quando avaliados." />
        </label>
      </ExamSection>

      <ExamSection title="Ruídos e travamentos articulares">
        <div className="space-y-3">
          {jointMovements.map((movement) => (
            <div key={movement} className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_180px_180px] sm:items-center">
              <span className="text-xs font-semibold text-slate-700">{movement}</span>
              {['direita', 'esquerda'].map((side) => (
                <select key={side} value={String(answers[`noise_${safeKey(movement)}_${side}`] ?? 'Não avaliado')} onChange={(event) => onChange(`noise_${safeKey(movement)}_${side}`, event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs">
                  <option>Não avaliado</option><option>Sem ruído</option><option>Estalido</option><option>Crepitação</option><option>Outro</option>
                </select>
              ))}
            </div>
          ))}
        </div>
        <label className="mt-4 block space-y-2 text-xs font-semibold text-slate-700">
          Travamentos e comentários articulares
          <Textarea className="min-h-20" value={String(answers.jointLockingComments ?? '')} onChange={(event) => onChange('jointLockingComments', event.target.value)} />
        </label>
      </ExamSection>

      <ExamSection title="Palpação muscular e da ATM" description="Marque “Não avaliado” quando a estrutura não for examinada.">
        <PalpationMatrix answers={answers} onChange={onChange} />
      </ExamSection>
    </div>
  );
}

function BruxismExam({ answers, onChange }: { answers: ExamAnswers; onChange: (id: string, value: string | number | string[]) => void }) {
  const selectedSigns = Array.isArray(answers.toothWearSigns) ? answers.toothWearSigns : [];
  const selectedTissues = Array.isArray(answers.softTissueOptions) ? answers.softTissueOptions : [];
  return (
    <div className="space-y-5">
      <ExamSection title="Masséter e tecidos intra e extraorais">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-xs font-semibold text-slate-700">
            Hipertrofia do masséter
            <select value={String(answers.masseterHypertrophy ?? 'Não avaliado')} onChange={(event) => onChange('masseterHypertrophy', event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3">
              <option>Não avaliado</option><option>Ausente</option><option>Direita</option><option>Esquerda</option><option>Bilateral</option>
            </select>
          </label>
          <fieldset className="sm:col-span-2"><legend className="text-xs font-semibold text-slate-700">Achados em tecidos moles e ósseos</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{softTissueFindings.map((finding) => { const checked = selectedTissues.includes(finding); return <label key={finding} className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-xs ${checked ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-soft)]' : 'border-slate-200'}`}><Checkbox checked={checked} onCheckedChange={() => onChange('softTissueOptions', checked ? selectedTissues.filter((value) => value !== finding) : [...selectedTissues, finding])} />{finding}</label>; })}</div></fieldset>
          <label className="space-y-2 text-xs font-semibold text-slate-700 sm:col-span-2">Outros achados e comentários<Textarea className="min-h-24" value={String(answers.softTissueFindings ?? '')} onChange={(event) => onChange('softTissueFindings', event.target.value)} /></label>
        </div>
      </ExamSection>

      <ExamSection title="Desgaste dentário" description="Sem escala visual. O profissional informa o grau observado e descreve a distribuição.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((sextant) => (
            <div key={sextant} className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-bold text-slate-700">Sextante {sextant}</p>
              <label className="mt-2 block text-[11px] text-slate-600">
                Oclusal/incisal — grau informado
                <Input className="mt-1 h-9" value={String(answers[`wear_s${sextant}_occlusal`] ?? '')} onChange={(event) => onChange(`wear_s${sextant}_occlusal`, event.target.value)} />
              </label>
              <label className="mt-2 block text-[11px] text-slate-600">
                Palatino — grau informado
                <Input className="mt-1 h-9" value={String(answers[`wear_s${sextant}_palatal`] ?? '')} onChange={(event) => onChange(`wear_s${sextant}_palatal`, event.target.value)} />
              </label>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {toothWearMechanicSigns.map((sign) => {
            const checked = selectedSigns.includes(sign);
            return (
              <label key={sign} className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-xs leading-5 ${checked ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-soft)]' : 'border-slate-200 bg-white'}`}>
                <Checkbox checked={checked} onCheckedChange={() => onChange('toothWearSigns', checked ? selectedSigns.filter((value) => value !== sign) : [...selectedSigns, sign])} className="mt-0.5" />
                {sign}
              </label>
            );
          })}
        </div>
      </ExamSection>

      <ExamSection title="Dentes, periodonto, restaurações e implantes">
        <p className="mb-2 text-xs font-semibold text-slate-700">Número de dentes com cada achado</p><SextantMatrix prefix="dental" rows={dentalRows} answers={answers} onChange={onChange} />
        <p className="mb-2 mt-5 text-xs font-semibold text-slate-700">Número de dentes, restaurações ou implantes com cada achado</p><SextantMatrix prefix="restoration" rows={restorationRows} answers={answers} onChange={onChange} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-xs font-semibold text-slate-700">Comentários dentais e periodontais<Textarea className="min-h-24" value={String(answers.dentalPeriodontal ?? '')} onChange={(event) => onChange('dentalPeriodontal', event.target.value)} /></label><label className="space-y-2 text-xs font-semibold text-slate-700">Comentários sobre restaurações e implantes<Textarea className="min-h-24" value={String(answers.restorationsImplants ?? '')} onChange={(event) => onChange('restorationsImplants', event.target.value)} /></label></div>
      </ExamSection>

      <ExamSection title="Dispositivo oral rígido">
        <div className="grid gap-3 sm:grid-cols-2">{deviceSigns.map((sign) => { const id = `device_${safeKey(sign)}`; const selected = Array.isArray(answers[id]) ? answers[id] as string[] : []; return <fieldset key={id} className="rounded-xl border border-slate-200 p-3"><legend className="px-1 text-xs font-semibold text-slate-700">{sign}</legend><div className="mt-2 flex flex-wrap gap-3">{['Direito', 'Anterior', 'Esquerdo'].map((region) => <label key={region} className="flex items-center gap-2 text-xs"><Checkbox checked={selected.includes(region)} onCheckedChange={() => onChange(id, selected.includes(region) ? selected.filter((value) => value !== region) : [...selected, region])} />{region}</label>)}</div></fieldset>; })}</div>
        <label className="mt-4 block space-y-2 text-xs font-semibold text-slate-700">Comentários sobre o dispositivo<Textarea className="min-h-24" value={String(answers.oralDevice ?? '')} onChange={(event) => onChange('oralDevice', event.target.value)} /></label>
      </ExamSection>
    </div>
  );
}

function ExamSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-[var(--brand-navy)]">{title}</h3>
      {description ? <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function PhysicalExamForm({ mode, onModeChange, answers, onChange }: { mode: ExamMode; onModeChange: (mode: ExamMode) => void; answers: ExamAnswers; onChange: (id: string, value: string | number | string[]) => void }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-[var(--brand-navy)]">Tipo de exame realizado</h3>
        <p className="mt-1 text-xs text-slate-500">A triagem sugere uma opção, mas o profissional pode alterá-la.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {([
            ['dtm', 'DTM'],
            ['bruxismo', 'Bruxismo'],
            ['combinado', 'Combinado'],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => onModeChange(value)} className={`min-h-10 rounded-xl border px-4 text-xs font-semibold ${mode === value ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {mode === 'dtm' || mode === 'combinado' ? <DtmExam answers={answers} onChange={onChange} /> : null}
      {mode === 'bruxismo' || mode === 'combinado' ? <BruxismExam answers={answers} onChange={onChange} /> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <label className="block space-y-2 text-xs font-semibold text-slate-700">
          Observações livres do exame físico
          <Textarea className="min-h-28" value={String(answers.examObservations ?? '')} onChange={(event) => onChange('examObservations', event.target.value)} />
        </label>
      </section>
    </div>
  );
}
