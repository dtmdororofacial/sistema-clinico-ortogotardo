import { Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export type Complaint = {
  title: string;
  painful: boolean;
  history: string;
  onset: string;
  frequencyDuration: string;
  evolution: string;
  quality: string[];
  averagePain30Days?: number;
  intensityComments: string;
  worsening: string[];
  improvement: string[];
  trigger: string[];
  accompanying: string[];
};

export const emptyComplaint = (): Complaint => ({
  title: '',
  painful: false,
  history: '',
  onset: '',
  frequencyDuration: '',
  evolution: '',
  quality: [],
  intensityComments: '',
  worsening: [],
  improvement: [],
  trigger: [],
  accompanying: [],
});

const multiGroups = [
  { key: 'quality', label: 'Qualidade', options: ['Pressão ou aperto', 'Ardente ou queimante', 'Pontada ou pulsátil', 'Choque', 'Outra'] },
  { key: 'worsening', label: 'Fatores de piora', options: ['Mastigação ou fala', 'Estresse', 'Frio', 'Calor', 'Atividade física', 'Outro'] },
  { key: 'improvement', label: 'Fatores de melhora', options: ['Descanso', 'Massagem', 'Medicação', 'Calor', 'Frio', 'Outro'] },
  { key: 'trigger', label: 'Fatores desencadeantes', options: ['Trauma', 'Tratamento odontológico', 'Tratamento ortodôntico', 'Estresse', 'Abertura excessiva', 'Outro'] },
  { key: 'accompanying', label: 'Sintomas acompanhantes', options: ['Náusea', 'Vômito', 'Fotofobia', 'Fonofobia', 'Osmofobia', 'Sinais autonômicos', 'Edema', 'Zumbido', 'Outro'] },
] as const;

export function ComplaintForm({
  complaints,
  onChange,
}: {
  complaints: Complaint[];
  onChange: (complaints: Complaint[]) => void;
}) {
  const update = <K extends keyof Complaint>(index: number, key: K, value: Complaint[K]) => {
    const next = complaints.map((complaint, current) =>
      current === index ? { ...complaint, [key]: value } : complaint,
    );
    onChange(next);
  };

  const toggleMulti = (index: number, key: 'quality' | 'worsening' | 'improvement' | 'trigger' | 'accompanying', option: string) => {
    const values = complaints[index][key];
    update(index, key, values.includes(option) ? values.filter((item) => item !== option) : [...values, option]);
  };

  const setPainful = (index: number, painful: boolean) => {
    onChange(complaints.map((complaint, current) => current === index ? {
      ...complaint,
      painful,
      ...(painful ? {} : { quality: [], averagePain30Days: undefined, intensityComments: '', worsening: [], improvement: [], trigger: [] }),
    } : complaint));
  };

  return (
    <div className="space-y-4">
      {complaints.map((complaint, index) => (
        <section key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--brand-orange)]">
                {index === 0 ? 'Queixa principal' : `Queixa ${index + 1}`}
              </p>
              <h3 className="mt-1 text-base font-semibold text-[var(--brand-navy)]">
                {complaint.title || 'Descreva a queixa'}
              </h3>
            </div>
            {index > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => onChange(complaints.filter((_, current) => current !== index))}>
                <Minus className="size-4" /> Remover
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold text-slate-700">Queixa</span>
              <Input value={complaint.title} onChange={(event) => update(index, 'title', event.target.value)} placeholder="Ex.: dor temporal, zumbido, ruído articular" />
            </label>

            <fieldset className="sm:col-span-2">
              <legend className="text-xs font-semibold text-slate-700">Esta queixa é dolorosa?</legend>
              <div className="mt-2 flex gap-2">
                {[true, false].map((option) => (
                  <button
                    type="button"
                    key={String(option)}
                    onClick={() => setPainful(index, option)}
                    className={`min-h-10 rounded-xl border px-5 text-xs font-semibold ${
                      complaint.painful === option
                        ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {option ? 'Sim' : 'Não'}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold text-slate-700">Histórico da queixa</span>
              <Textarea value={complaint.history} onChange={(event) => update(index, 'history', event.target.value)} className="min-h-24" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">Início</span>
              <Input value={complaint.onset} onChange={(event) => update(index, 'onset', event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">Frequência e duração</span>
              <Input value={complaint.frequencyDuration} onChange={(event) => update(index, 'frequencyDuration', event.target.value)} />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold text-slate-700">Evolução</span>
              <Input value={complaint.evolution} onChange={(event) => update(index, 'evolution', event.target.value)} placeholder="Manutenção, melhora, piora ou descrição livre" />
            </label>

            {complaint.painful ? (
              <>
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-slate-700">Intensidade média nos últimos 30 dias</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={complaint.averagePain30Days ?? 0}
                      onChange={(event) => update(index, 'averagePain30Days', Number(event.target.value))}
                      className="w-full accent-[var(--brand-blue)]"
                    />
                    <output className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-blue-soft)] font-bold text-[var(--brand-blue)]">
                      {complaint.averagePain30Days ?? 0}
                    </output>
                  </div>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-slate-700">Comentários sobre intensidade</span>
                  <Input value={complaint.intensityComments} onChange={(event) => update(index, 'intensityComments', event.target.value)} placeholder="Ex.: a pior dor ocorreu em um único dia" />
                </label>
              </>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4">
            {multiGroups.map((group) => {
              if (!complaint.painful && ['quality', 'worsening', 'improvement', 'trigger'].includes(group.key)) return null;
              return (
                <fieldset key={group.key}>
                  <legend className="text-xs font-semibold text-slate-700">{group.label}</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.options.map((option) => {
                      const selected = complaint[group.key].includes(option);
                      return (
                        <button
                          type="button"
                          key={option}
                          aria-pressed={selected}
                          onClick={() => toggleMulti(index, group.key, option)}
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${
                            selected
                              ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>
        </section>
      ))}

      {complaints.length < 3 ? (
        <Button variant="outline" onClick={() => onChange([...complaints, emptyComplaint()])} className="h-11">
          <Plus className="size-4" /> Adicionar {complaints.length === 1 ? 'queixa 2' : 'queixa 3'}
        </Button>
      ) : null}
    </div>
  );
}
