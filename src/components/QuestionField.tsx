import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import type { Question } from '@/src/domain/instruments';

type AnswerValue = string | number | string[] | undefined;

export function QuestionField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: AnswerValue;
  onChange: (value: string | number | string[]) => void;
}) {
  const selectedValues = Array.isArray(value) ? value : [];

  const toggleValue = (option: string) => {
    onChange(
      selectedValues.includes(option)
        ? selectedValues.filter((current) => current !== option)
        : [...selectedValues, option],
    );
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <label htmlFor={question.id} className="text-sm font-medium leading-6 text-slate-800">
          {question.label}
          {question.required ? <span className="ml-1 text-[var(--brand-orange)]">*</span> : null}
        </label>
        {question.help ? <p className="mt-1 text-xs leading-5 text-slate-500">{question.help}</p> : null}
      </div>

      {question.kind === 'text' ? (
        <Input id={question.id} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />
      ) : null}

      {question.kind === 'textarea' ? (
        <Textarea
          id={question.id}
          value={String(value ?? '')}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-24 resize-y"
          placeholder="Registro do profissional"
        />
      ) : null}

      {question.kind === 'number' ? (
        <div className="flex max-w-xs items-center gap-3">
          <Input
            id={question.id}
            type="number"
            min={question.min}
            max={question.max}
            value={value === undefined ? '' : Number(value)}
            onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
          />
          {question.suffix ? <span className="text-xs text-slate-500">{question.suffix}</span> : null}
        </div>
      ) : null}

      {question.kind === 'scale' ? (
        <div className="grid gap-3 sm:grid-cols-[1fr_68px] sm:items-center">
          <div>
            <Slider
              id={question.id}
              min={question.min ?? 0}
              max={question.max ?? 10}
              step={1}
              value={[typeof value === 'number' ? value : 0]}
              onValueChange={(next) => onChange(Array.isArray(next) ? Number(next[0]) : Number(next))}
            />
            <div className="mt-2 flex justify-between text-[11px] text-slate-500">
              <span>0 — sem dor</span>
              <span>10 — pior dor</span>
            </div>
          </div>
          <output className="flex h-11 items-center justify-center rounded-xl bg-[var(--brand-blue-soft)] text-lg font-bold text-[var(--brand-blue)]">
            {typeof value === 'number' ? value : 0}
          </output>
        </div>
      ) : null}

      {question.kind === 'single' || question.kind === 'yesno' ? (
        <div className="flex flex-wrap gap-2">
          {question.options?.map((option) => {
            const selected = value === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(option)}
                className={`min-h-10 rounded-xl border px-3 py-2 text-left text-xs font-medium transition ${
                  selected
                    ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-[var(--brand-blue)]'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : null}

      {question.kind === 'multi' ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {question.options?.map((option) => {
            const checked = selectedValues.includes(option);
            return (
              <label
                key={option}
                className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-xs leading-5 transition ${
                  checked ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-soft)]' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggleValue(option)} className="mt-0.5" />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
