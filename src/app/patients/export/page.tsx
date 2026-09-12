import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/app/components/Header';
import { requireAdmin } from '@/lib/auth-roles';

export default async function ExportPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { count: consentedCount } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('research_consent', true);

  const { count: totalCount } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true });

  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto px-4 pb-24 pt-2 w-full">
        <Link href="/patients" className="text-xs text-slate-400 hover:text-slate-600">
          ← Patients
        </Link>

        <h2 className="text-lg font-semibold mt-2 mb-1">Research Export</h2>
        <p className="text-xs text-slate-400 mb-4">
          Download CSV data for research-consented patients only.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-4">
          <div className="text-sm text-slate-700">
            <span className="font-medium tabular-nums">{consentedCount ?? 0}</span> of{' '}
            <span className="tabular-nums">{totalCount ?? 0}</span> patients have research consent
          </div>
          {(consentedCount ?? 0) === 0 && (
            <div className="text-xs text-amber-700 mt-1">
              No patients have research consent enabled. Mark patients as consented during registration or edit their profile.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-800">Outcomes Summary</div>
                <div className="text-xs text-slate-400">
                  One row per patient — baseline vs latest pain, function, mood, sleep, QoL, and % change
                </div>
              </div>
              <a
                href="/api/export?type=summary"
                download
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium shrink-0"
              >
                Download CSV
              </a>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-800">All Encounters</div>
                <div className="text-xs text-slate-400">
                  One row per encounter — diagnosis, ICD code, scores, procedures, adverse events
                </div>
              </div>
              <a
                href="/api/export?type=encounters"
                download
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium shrink-0"
              >
                Download CSV
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-slate-400 space-y-1">
          <p>
            <strong>Privacy note:</strong> Only patients who have explicitly provided research consent are included in exports.
            Patient names are included for clinician reference — de-identify before sharing outside your practice.
          </p>
          <p>
            Exported files are compatible with R, SPSS, Python (pandas), and Excel.
          </p>
        </div>
      </div>
    </>
  );
}
