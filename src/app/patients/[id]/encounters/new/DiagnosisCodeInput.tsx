'use client';

import { useState, useRef, useEffect } from 'react';
import { ICD11_PAIN_CODES } from '@/lib/icd11-pain-codes';
import type { Icd11Code } from '@/lib/icd11-pain-codes';

/**
 * Autocomplete input for ICD-11 diagnosis codes. Filters the static
 * pain-relevant code list by code, label, or keywords as the user types.
 * Selecting a code sets the hidden form field; typing a free-text code
 * that isn't in the list is also allowed (the field is text, not enum).
 */
export function DiagnosisCodeInput({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (code: string) => void;
  onSelect?: (code: Icd11Code) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const matches = query.trim().length > 0
    ? ICD11_PAIN_CODES.filter((c) => matchesCode(c, query.trim().toLowerCase())).slice(0, 8)
    : [];

  function handleInputChange(text: string) {
    setQuery(text);
    onChange(text);
    setOpen(true);
    setHighlighted(-1);
  }

  function selectCode(code: Icd11Code) {
    const display = `${code.code} ${code.label}`;
    setQuery(display);
    onChange(code.code);
    onSelect?.(code);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || matches.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      selectCode(matches[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Diagnosis code (ICD-11)
        </label>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => { if (query.trim()) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder="Type code or diagnosis name…"
        autoComplete="off"
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      <input type="hidden" name="diagnosis_code" value={value} />

      {open && matches.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {matches.map((c, i) => (
            <li key={c.code}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); selectCode(c); }}
                className={`w-full text-left px-3 py-2 text-sm ${
                  i === highlighted
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="font-mono text-xs text-slate-400 mr-1.5">{c.code}</span>
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function matchesCode(code: Icd11Code, query: string): boolean {
  if (code.code.toLowerCase().includes(query)) return true;
  if (code.label.toLowerCase().includes(query)) return true;
  return code.keywords.some((k) => k.toLowerCase().includes(query));
}
