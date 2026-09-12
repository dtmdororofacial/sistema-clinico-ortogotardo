import { useState } from 'react';
import { MapPin, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type PainPoint = {
  id: string;
  x: number;
  y: number;
  region: string;
  side: string;
  intensity: number;
  painType: string;
  complaint: number;
};

const regions = ['Face', 'Têmpora', 'ATM', 'Ouvido', 'Mandíbula', 'Pescoço', 'Ombro', 'Corpo', 'Boca e dentes', 'Outra'];
const painTypes = ['Pressão ou aperto', 'Queimação', 'Pontada ou pulsátil', 'Choque', 'Peso ou cansaço', 'Outra'];

export function PainMap({ points, onChange }: { points: PainPoint[]; onChange: (points: PainPoint[]) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = points.find((point) => point.id === selectedId) ?? null;

  const addPoint = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rectangle = event.currentTarget.getBoundingClientRect();
    const point: PainPoint = {
      id: crypto.randomUUID(),
      x: ((event.clientX - rectangle.left) / rectangle.width) * 100,
      y: ((event.clientY - rectangle.top) / rectangle.height) * 100,
      region: 'Face',
      side: 'Não se aplica',
      intensity: 0,
      painType: 'Outra',
      complaint: 1,
    };
    onChange([...points, point]);
    setSelectedId(point.id);
  };

  const update = (changes: Partial<PainPoint>) => {
    if (!selectedId) return;
    onChange(points.map((point) => (point.id === selectedId ? { ...point, ...changes } : point)));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]">
          <MapPin className="size-5" />
        </span>
        <div>
          <h3 className="font-semibold text-[var(--brand-navy)]">Mapa da dor</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Clique na imagem para marcar uma região. Depois informe lado, intensidade, tipo de dor e número da queixa.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
        <button
          type="button"
          onClick={addPoint}
          className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-orange-soft)]"
          aria-label="Adicionar ponto ao mapa de dor"
        >
          <img src={`${import.meta.env.BASE_URL}clinical/pain-map-original.png`} alt="Mapa anatômico com corpo, faces e boca" className="h-auto w-full" />
          {points.map((point, index) => (
            <button
              key={point.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedId(point.id);
              }}
              className={`absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white shadow-md ${
                point.id === selectedId ? 'bg-[var(--brand-orange)] ring-4 ring-orange-200' : 'bg-[var(--brand-blue)]'
              }`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              aria-label={`Ponto ${index + 1}: ${point.region}`}
            >
              {index + 1}
            </button>
          ))}
        </button>

        <div className="rounded-2xl bg-slate-50 p-4">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--brand-navy)]">Ponto selecionado</p>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Excluir ponto"
                  onClick={() => {
                    onChange(points.filter((point) => point.id !== selected.id));
                    setSelectedId(null);
                  }}
                >
                  <Trash2 className="size-4 text-red-600" />
                </Button>
              </div>
              <label className="block space-y-1.5 text-xs font-medium text-slate-700">
                Região
                <select value={selected.region} onChange={(event) => update({ region: event.target.value })} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3">
                  {regions.map((region) => <option key={region}>{region}</option>)}
                </select>
              </label>
              <label className="block space-y-1.5 text-xs font-medium text-slate-700">
                Lado
                <select value={selected.side} onChange={(event) => update({ side: event.target.value })} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3">
                  {['Direito', 'Esquerdo', 'Bilateral', 'Linha média', 'Não se aplica'].map((side) => <option key={side}>{side}</option>)}
                </select>
              </label>
              <label className="block space-y-1.5 text-xs font-medium text-slate-700">
                Intensidade de 0 a 10
                <Input type="number" min="0" max="10" value={selected.intensity} onChange={(event) => update({ intensity: Number(event.target.value) })} />
              </label>
              <label className="block space-y-1.5 text-xs font-medium text-slate-700">
                Tipo de dor
                <select value={selected.painType} onChange={(event) => update({ painType: event.target.value })} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3">
                  {painTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label className="block space-y-1.5 text-xs font-medium text-slate-700">
                Número da queixa
                <select value={selected.complaint} onChange={(event) => update({ complaint: Number(event.target.value) })} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3">
                  {[1, 2, 3].map((number) => <option key={number} value={number}>Queixa {number}</option>)}
                </select>
              </label>
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <MapPin className="size-6 text-slate-300" />
              <p className="mt-2 text-xs leading-5 text-slate-500">Selecione um ponto existente ou clique sobre a imagem.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
