'use client';

import type { ClinicalRule } from '@/lib/clinical-decision-rules';

interface DirectedHistoryProps {
  rule: ClinicalRule;
  answers: Record<string, string[]>;
  onAnswerChange: (questionId: string, selectedOptions: string[]) => void;
  onAutoSyncSummary?: (historySummary: string, redFlagsSummary: string) => void;
}

export function DirectedHistorySection({
  rule,
  answers,
  onAnswerChange,
  onAutoSyncSummary,
}: DirectedHistoryProps) {
  function computeSummariesAndSync(nextAnswers: Record<string, string[]>) {
    if (!onAutoSyncSummary) return;

    const normalNotes: string[] = [];
    const redFlagNotes: string[] = [];

    rule.questions.forEach((q) => {
      const selected = nextAnswers[q.id] || [];
      if (selected.length === 0) return;

      if (q.isRedFlag) {
        // Check if any positive red flag was selected (excluding negative screening options)
        const positives = selected.filter(
          (opt) => !opt.toLowerCase().includes('screened: no') && !opt.toLowerCase().includes('none')
        );
        if (positives.length > 0) {
          redFlagNotes.push(`⚠️ ${q.label}: ${positives.join('; ')}`);
        } else {
          redFlagNotes.push(`✓ ${q.label}: None / Screened negative`);
        }
      } else {
        normalNotes.push(`${q.label}: ${selected.join(', ')}`);
      }
    });

    onAutoSyncSummary(normalNotes.join('\n'), redFlagNotes.join('\n'));
  }

  function handleToggle(questionId: string, option: string, isMulti: boolean, _isRedFlag?: boolean) {
    const current = answers[questionId] || [];
    let next: string[];

    if (!isMulti) {
      // Single select: toggle option on/off
      next = current.includes(option) ? [] : [option];
    } else {
      // Multi-select
      if (current.includes(option)) {
        next = current.filter((o) => o !== option);
      } else {
        // If selecting a "None / Screened negative" option, clear other positives
        if (option.toLowerCase().includes('none') || option.toLowerCase().includes('screened: no')) {
          next = [option];
        } else {
          // If selecting a positive symptom, remove any "None" option
          const withoutNone = current.filter(
            (o) => !o.toLowerCase().includes('none') && !o.toLowerCase().includes('screened: no')
          );
          next = [...withoutNone, option];
        }
      }
    }

    onAnswerChange(questionId, next);
    computeSummariesAndSync({ ...answers, [questionId]: next });
  }

  return (
    <div className="bg-teal-50/50 border border-teal-200/80 rounded-xl p-4 space-y-4 transition-all">
      <div className="flex items-center justify-between pb-2 border-b border-teal-100">
        <div className="flex items-center gap-2">
          <span className="text-base">🎯</span>
          <div>
            <h3 className="text-xs font-bold text-teal-950 uppercase tracking-wider">
              Directed Clinical History: {rule.name}
            </h3>
            <p className="text-[11px] text-teal-700">
              Questions automatically tailored to this diagnosis code
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold">
          CDSS Directed
        </span>
      </div>

      <div className="space-y-4">
        {rule.questions.map((q) => {
          const selected = answers[q.id] || [];

          return (
            <div key={q.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  {q.isRedFlag ? '🚨 ' : ''}{q.label}
                  {q.type === 'multi' && (
                    <span className="text-[10px] text-slate-400 font-normal ml-1">(Select all that apply)</span>
                  )}
                </label>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {q.options.map((opt) => {
                  const isSelected = selected.includes(opt);
                  const isRedPositive =
                    q.isRedFlag &&
                    isSelected &&
                    !opt.toLowerCase().includes('screened: no') &&
                    !opt.toLowerCase().includes('none');

                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleToggle(q.id, opt, q.type === 'multi', q.isRedFlag)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border text-left transition ${
                        isRedPositive
                          ? 'bg-rose-100 border-rose-400 text-rose-900 font-semibold shadow-xs'
                          : isSelected
                          ? 'bg-teal-600 border-teal-700 text-white font-medium shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-teal-50/40'
                      }`}
                    >
                      {isSelected ? '✓ ' : ''}{opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
