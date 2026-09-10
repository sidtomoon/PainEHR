import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/app/components/Header';
import type { Patient } from '@/lib/types';

export default async function PatientsPage({ searchParams }: PageProps<'/patients'>) {
  const { q } = await searchParams;
  const search = typeof q === 'string' ? q.trim() : '';

  const supabase = await createClient();
  let query = supabase.from('patients').select('*').order('created_at', { ascending: false });
  if (search) {
    query = query.or(`name.ilike.%${search}%,patient_code.ilike.%${search}%`);
  }
  const { data: patients } = await query;

  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto px-4 pb-24 pt-2 w-full">
        <div className="flex items-center gap-2 mb-4 mt-2">
          <form className="relative flex-1" action="/patients">
            <input
              name="q"
              defaultValue={search}
              placeholder="Search by UID or patient name…"
              className="w-full pl-3 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </form>
          <Link
            href="/patients/new"
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap shrink-0"
          >
            + New
          </Link>
        </div>

        {!patients || patients.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            {search ? `No patients matching "${search}".` : 'No patients yet. Add your first one to get started.'}
          </div>
        ) : (
          <div className="space-y-2">
            {(patients as Patient[]).map((p) => (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <Link href={`/patients/${p.id}`} className="group flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 group-hover:text-teal-700 transition">
                      {p.name}
                    </span>
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {p.patient_code}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">
                    {[p.age && `${p.age}y`, p.sex, p.phone].filter(Boolean).join(' · ')}
                  </div>
                </Link>

                <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <Link
                    href={`/patients/${p.id}/encounters/new?type=followup`}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition"
                  >
                    + Follow-up
                  </Link>
                  <Link
                    href={`/patients/${p.id}/encounters/new?type=procedure`}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
                  >
                    + Procedure
                  </Link>
                  <Link
                    href={`/patients/${p.id}`}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600 transition"
                  >
                    Chart →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
