'use client';

import { useState, useEffect } from 'react';

type HistorySuggestion = { question: string; reason: string };
type ExamSuggestion = { maneuver: string; reason: string };

export interface PubMedArticle {
  pmid: string;
  title: string;
  journal: string;
  pubDate: string;
  authors: string[];
  doi: string | null;
  url: string;
}

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
  const [historyState, setHistoryState] = useState<{
    loading: boolean;
    error: string | null;
    items: HistorySuggestion[] | null;
  }>({
    loading: false,
    error: null,
    items: null,
  });

  const [examState, setExamState] = useState<{
    loading: boolean;
    error: string | null;
    items: ExamSuggestion[] | null;
  }>({
    loading: false,
    error: null,
    items: null,
  });

  // PubMed live state
  const [pubmedLoading, setPubmedLoading] = useState(false);
  const [pubmedError, setPubmedError] = useState<string | null>(null);
  const [pubmedArticles, setPubmedArticles] = useState<PubMedArticle[] | null>(null);
  const [evidenceFilter, setEvidenceFilter] = useState<'guidelines' | 'reviews' | 'trials' | 'all'>('guidelines');
  const [copiedPmid, setCopiedPmid] = useState<string | null>(null);

  // UpToDate & OpenEvidence state
  const [copiedEvidence, setCopiedEvidence] = useState(false);
  const [institutionalProxy, setInstitutionalProxy] = useState('');
  const [showProxyConfig, setShowProxyConfig] = useState(false);

  useEffect(() => {
    try {
      const savedProxy = localStorage.getItem('painehr_uptodate_proxy');
      if (savedProxy) setInstitutionalProxy(savedProxy);
    } catch {
      // ignore localStorage errors
    }
  }, []);

  function saveProxy(val: string) {
    setInstitutionalProxy(val);
    try {
      localStorage.setItem('painehr_uptodate_proxy', val.trim());
    } catch {
      // ignore
    }
  }

  async function loadHistory() {
    setHistoryState({ loading: true, error: null, items: null });
    try {
      const items = (await fetchSuggestions('history', context)) as HistorySuggestion[];
      setHistoryState({ loading: false, error: null, items });
    } catch (e) {
      setHistoryState({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load suggestions.',
        items: null,
      });
    }
  }

  async function loadExam() {
    setExamState({ loading: true, error: null, items: null });
    try {
      const items = (await fetchSuggestions('exam', context)) as ExamSuggestion[];
      setExamState({ loading: false, error: null, items });
    } catch (e) {
      setExamState({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load suggestions.',
        items: null,
      });
    }
  }

  async function fetchPubmedEvidence(filter: 'guidelines' | 'reviews' | 'trials' | 'all' = evidenceFilter) {
    setPubmedLoading(true);
    setPubmedError(null);
    setEvidenceFilter(filter);

    try {
      const res = await fetch('/api/cdss/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosis: context.diagnosis,
          painLocation: context.painLocation,
          painMechanism: context.painMechanism,
          filterType: filter,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch PubMed articles');
      }

      setPubmedArticles(data.articles || []);
    } catch (e) {
      setPubmedError(e instanceof Error ? e.message : 'Error querying PubMed NCBI');
    } finally {
      setPubmedLoading(false);
    }
  }

  function getEvidenceQuery() {
    const parts = [
      context.diagnosis ? `Diagnosis: ${context.diagnosis}` : null,
      context.painLocation ? `Location: ${context.painLocation}` : null,
      context.painMechanism ? `Mechanism: ${context.painMechanism}` : null,
      context.chiefComplaint ? `Symptoms: ${context.chiefComplaint}` : null,
    ].filter(Boolean);
    return parts.length > 0
      ? `Evidence-based management and clinical guidelines for ${
          context.diagnosis || context.chiefComplaint || 'chronic pain'
        } (${parts.join(', ')})`
      : 'Evidence-based interventions and pharmacological management in interventional pain medicine';
  }

  async function copyForOpenEvidence() {
    const query = getEvidenceQuery();
    try {
      await navigator.clipboard.writeText(query);
      setCopiedEvidence(true);
      setTimeout(() => setCopiedEvidence(false), 2500);
    } catch {
      // ignore
    }
  }

  async function copyCitation(art: PubMedArticle) {
    const citation = `${art.authors.join(', ')}. ${art.title}. ${art.journal}. ${art.pubDate}. PMID: ${art.pmid}.`;
    try {
      await navigator.clipboard.writeText(citation);
      setCopiedPmid(art.pmid);
      setTimeout(() => setCopiedPmid(null), 2000);
    } catch {
      // ignore
    }
  }

  function getUpToDateUrl(searchTerm?: string) {
    const term = searchTerm || context.diagnosis || context.chiefComplaint || 'pain management';
    const baseUrl = `https://www.uptodate.com/contents/search?search=${encodeURIComponent(term)}&sp=0`;
    if (institutionalProxy.trim()) {
      const proxy = institutionalProxy.trim();
      return proxy.endsWith('=') || proxy.endsWith('/')
        ? `${proxy}${encodeURIComponent(baseUrl)}`
        : `${proxy}/${baseUrl}`;
    }
    return baseUrl;
  }

  const activeDiagnosis = context.diagnosis || context.chiefComplaint || 'pain';

  return (
    <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-white shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
          CDSS — Diagnostic &amp; Clinical Evidence
        </div>
        <span className="text-[10px] text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
          Point of Care
        </span>
      </div>

      {/* Stage 1 & 2: Diagnostic Checklists */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={loadHistory}
          disabled={historyState.loading}
          className="text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded px-3 py-1.5 font-medium cursor-pointer transition"
        >
          {historyState.loading ? 'Thinking…' : 'Suggest history questions'}
        </button>

        <button
          type="button"
          onClick={loadExam}
          disabled={examState.loading}
          className="text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded px-3 py-1.5 font-medium cursor-pointer transition"
        >
          {examState.loading ? 'Thinking…' : 'Suggest exam points'}
        </button>
      </div>

      {historyState.error && <p className="text-xs text-rose-700">{historyState.error}</p>}
      {historyState.items && (
        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase">History Prompts:</span>
          <ul className="mt-1.5 space-y-1.5">
            {historyState.items.map((item, i) => (
              <li key={i} className="text-xs">
                <span className="font-medium text-slate-700">{item.question}</span>
                <span className="text-slate-400"> — {item.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {examState.error && <p className="text-xs text-rose-700">{examState.error}</p>}
      {examState.items && (
        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Exam Maneuvers:</span>
          <ul className="mt-1.5 space-y-1.5">
            {examState.items.map((item, i) => (
              <li key={i} className="text-xs">
                <span className="font-medium text-slate-700">{item.maneuver}</span>
                <span className="text-slate-400"> — {item.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* PubMed / NCBI E-Utilities Section */}
      <div className="pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              PubMed / NCBI E-Utilities
            </span>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded">
              100% Free API
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchPubmedEvidence(evidenceFilter)}
            disabled={pubmedLoading}
            className="text-xs bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded px-2.5 py-1 font-semibold shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
          >
            {pubmedLoading ? (
              <span>Searching PubMed…</span>
            ) : (
              <>
                <span>⚡ Fetch Latest Evidence</span>
              </>
            )}
          </button>
        </div>

        {/* Filter chips for PubMed evidence */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {(
            [
              ['guidelines', 'Clinical Guidelines'],
              ['reviews', 'Systematic Reviews'],
              ['trials', 'Clinical Trials / RCTs'],
              ['all', 'All Evidence'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => fetchPubmedEvidence(key)}
              className={`text-[11px] px-2 py-0.5 rounded border transition cursor-pointer ${
                evidenceFilter === key
                  ? 'bg-slate-800 text-white border-slate-800 font-medium'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {pubmedError && <p className="text-xs text-rose-600 mb-2">{pubmedError}</p>}

        {pubmedArticles && (
          <div className="space-y-2 mt-2 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
            {pubmedArticles.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No articles found matching this query. Try choosing &ldquo;All Evidence&rdquo; or refining the diagnosis.
              </p>
            ) : (
              pubmedArticles.map((art) => (
                <div
                  key={art.pmid}
                  className="bg-white p-2 rounded border border-slate-200 text-xs hover:border-slate-300 transition"
                >
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-teal-800 hover:text-teal-900 hover:underline line-clamp-2"
                  >
                    {art.title} ↗
                  </a>
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span className="italic font-serif">
                      {art.journal} · {art.pubDate}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyCitation(art)}
                        className="text-[10px] text-slate-400 hover:text-slate-700 underline cursor-pointer"
                      >
                        {copiedPmid === art.pmid ? '✓ Copied' : 'Copy Citation'}
                      </button>
                      <span className="font-mono text-[10px] text-slate-400">PMID: {art.pmid}</span>
                    </div>
                  </div>
                  {art.authors.length > 0 && (
                    <div className="text-[10px] text-slate-400 mt-0.5">{art.authors.join(', ')}</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* UpToDate (Institutional Access) Section */}
      <div className="pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              UpToDate
            </span>
            <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded">
              Institutional Access
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowProxyConfig(!showProxyConfig)}
            className="text-[10px] text-teal-700 hover:text-teal-900 underline cursor-pointer"
          >
            {showProxyConfig ? 'Hide Settings' : institutionalProxy ? 'Proxy Configured ⚙️' : 'Configure Proxy ⚙️'}
          </button>
        </div>

        {showProxyConfig && (
          <div className="p-2 mb-2 bg-slate-50 border border-slate-200 rounded text-xs">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Institutional Proxy Prefix (EZProxy / OpenAthens):
            </label>
            <input
              type="text"
              value={institutionalProxy}
              onChange={(e) => saveProxy(e.target.value)}
              placeholder="e.g. https://elibrary.institution.edu/login?url="
              className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              If your hospital or university uses a proxy link, paste it above. Links will automatically route through your institutional authentication.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={getUpToDateUrl(activeDiagnosis)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded px-2.5 py-1 font-medium inline-flex items-center gap-1 transition"
          >
            <span>📖 Topic: &ldquo;{activeDiagnosis}&rdquo; ↗</span>
          </a>

          <a
            href="https://www.uptodate.com/drug-interactions/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded px-2.5 py-1 font-medium inline-flex items-center gap-1 transition"
          >
            💊 Lexicomp Drug Checker ↗
          </a>
        </div>
      </div>

      {/* OpenEvidence Clinician Bridge */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-600 uppercase">OpenEvidence:</span>
          <button
            type="button"
            onClick={copyForOpenEvidence}
            className="text-xs text-teal-700 hover:text-teal-900 font-medium underline cursor-pointer"
          >
            {copiedEvidence ? '✓ Query Copied!' : 'Copy clinical query'}
          </button>
          <span>·</span>
          <a
            href="https://www.openevidence.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-700 hover:text-teal-900 underline"
          >
            OpenEvidence.com ↗
          </a>
        </div>
        <span className="text-[10px] text-slate-400">US NPI required</span>
      </div>
    </div>
  );
}
