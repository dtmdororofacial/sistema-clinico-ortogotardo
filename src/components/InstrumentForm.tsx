import { ChevronDown } from 'lucide-react';

import { QuestionField } from '@/src/components/QuestionField';
import type { InstrumentSection } from '@/src/domain/instruments';

export type Answers = Record<string, string | number | string[] | undefined>;

export const conditionalQuestions: Record<string, { dependsOn: string; value: string }> = {
  dc2: { dependsOn: 'dc1', value: 'Sim' },
  dc3: { dependsOn: 'dc1', value: 'Sim' },
  dc4: { dependsOn: 'dc1', value: 'Sim' },
  dc6: { dependsOn: 'dc5', value: 'Sim' },
  dc7: { dependsOn: 'dc5', value: 'Sim' },
  dc10: { dependsOn: 'dc9', value: 'Sim' },
  dc11: { dependsOn: 'dc9', value: 'Sim' },
  dc12: { dependsOn: 'dc9', value: 'Sim' },
  dc14: { dependsOn: 'dc13', value: 'Sim' },
  a3HeadacheDays: { dependsOn: 'a3Headache', value: 'Sim' },
  b4RecreationalWhich: { dependsOn: 'b4Recreational', value: 'Sim' },
  b4TobaccoAmount: { dependsOn: 'b4Tobacco', value: 'Usa atualmente' },
  b4AlcoholAmount: { dependsOn: 'b4Alcohol', value: 'Consome atualmente' },
  b4SoftDrinksAmount: { dependsOn: 'b4SoftDrinks', value: 'Consome atualmente' },
  b4CitrusAmount: { dependsOn: 'b4Citrus', value: 'Consome atualmente' },
  b4CaffeineAmount: { dependsOn: 'b4Caffeine', value: 'Consome atualmente' },
  b5BruxismWho: { dependsOn: 'b5Bruxism', value: 'Sim' },
  b5WearWho: { dependsOn: 'b5Wear', value: 'Sim' },
  b5ApneaWho: { dependsOn: 'b5Apnea', value: 'Sim' },
  b5OrofacialPainWho: { dependsOn: 'b5OrofacialPain', value: 'Sim' },
  b5RefluxWho: { dependsOn: 'b5Reflux', value: 'Sim' },
};

export function InstrumentForm({
  sections,
  answers,
  onChange,
}: {
  sections: InstrumentSection[];
  answers: Answers;
  onChange: (id: string, value: string | number | string[]) => void;
}) {
  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <details
          key={section.id}
          open={index === 0}
          className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-white px-5 py-4 marker:hidden">
            <div>
              <h3 className="text-sm font-semibold text-[var(--brand-navy)]">{section.title}</h3>
              {section.description ? <p className="mt-1 text-xs leading-5 text-slate-500">{section.description}</p> : null}
            </div>
            <ChevronDown className="size-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
          </summary>
          <div className="grid gap-3 border-t border-slate-200 p-4 sm:p-5">
            {section.questions.filter((question) => {
              const condition = conditionalQuestions[question.id];
              return !condition || answers[condition.dependsOn] === condition.value;
            }).map((question) => (
              <QuestionField
                key={question.id}
                question={question}
                value={answers[question.id]}
                onChange={(value) => onChange(question.id, value)}
              />
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
