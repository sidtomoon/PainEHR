'use client';

import { useState } from 'react';

type HistorySuggestion = { question: string; reason: string };
type ExamSuggestion = { maneuver: string; reason: string };

type Context = {
  chiefComplaint: string;
  diagnosis: string;
  painLocation: string;
  painMechanism: string;
  encounterType: string;
  transcript: string;
  filledFields: string[];
};

async function fetchSuggestions(stage: 'history' | 'exam', ctx: Context) {
  const res = await fetch('/api/cdss/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stage,
      chiefComplaint: ctx.chiefComplaint,
      diagnosis: ctx.diagnosis,
      painLocation: ctx.painLocation,
      painMechanism: ctx.painMechanism,
      encounterType: ctx.encounterType,
      transcript: ctx.transcript,
      filledFields: ctx.filledFields,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.suggestions as (HistorySuggestion | ExamSuggestion)[];
}

export function CdssPrompts({ context }: { context: Context }) {
  const [historyState, setHistoryState] = useState<{ loading: boolean; error: string | null; items: HistorySuggestion[] | null }>({
    loading: false, error: null, items: null,
  });
  const [examState, setExamState] = useState<{ loading: boolean; error: string | null; items: ExamSuggestion[] | null }>({
    loading: false, error: null, items: null,
  });

  async function loadHistory() {
    setHistoryState({ loading: true, error: null, items: null });
    try {
      const items = await fetchSuggestions('history', context) as HistorySuggestion[];
      setHistoryState({ loading: false, error: null, items });
    } catch (e) {
      setHistoryState({ loading: false, error: e instanceof Error ? e.message : 'Failed to load suggestions.', items: null });
    }
  }

  async function loadExam() {
    setExamState({ loading: true, error: null, items: null });
    try {
      const items = await fetchSuggestions('exam', context) as ExamSuggestion[];
      setExamState({ loading: false, error: null, items });
    } catch (e) {
      setExamState({ loading: false, error: e instanceof Error ? e.message : 'Failed to load suggestions.', items: null });
    }
  }

  return (
    <div className="border border-slate-200 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">CDSS — checklist only, not a diagnosis</div>
      </div>

      <div>
        <button
          type="button" onClick={loadHistory} disabled={historyState.loading}
          className="text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded px-3 py-1.5 font-medium"
        >
          {historyState.loading ? 'Thinking…' : 'Suggest history questions'}
        </button>
        {historyState.error && <p className="text-xs text-rose-700 mt-1.5">{historyState.error}</p>}
        {historyState.items && (
          <ul className="mt-2 space-y-1.5">
            {historyState.items.map((item, i) => (
              <li key={i} className="text-xs">
                <span className="font-medium text-slate-700">{item.question}</span>
                <span className="text-slate-400"> — {item.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <button
          type="button" onClick={loadExam} disabled={examState.loading}
          className="text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded px-3 py-1.5 font-medium"
        >
          {examState.loading ? 'Thinking…' : 'Suggest exam points'}
        </button>
        {examState.error && <p className="text-xs text-rose-700 mt-1.5">{examState.error}</p>}
        {examState.items && (
          <ul className="mt-2 space-y-1.5">
            {examState.items.map((item, i) => (
              <li key={i} className="text-xs">
                <span className="font-medium text-slate-700">{item.maneuver}</span>
                <span className="text-slate-400"> — {item.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
