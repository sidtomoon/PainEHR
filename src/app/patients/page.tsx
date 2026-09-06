import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/app/components/Header';
import type { Patient } from '@/lib/types';

export default async function PatientsPage({ searchParams }: PageProps<'/patients'>) {
  const { q } = await searchParams;
  const search = typeof q === 'string' ? q : '';

  const supabase = await createClient();
  let query = supabase.from('patients').select('*').order('created_at', { ascending: false });
  if (search) query = query.ilike('name', `%${search}%`);
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
              placeholder="Search patients"
              className="w-full pl-3 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </form>
          <Link
            href="/patients/new"
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-3 py-2 text-sm font-medium"
          >
            + New
          </Link>
        </div>

        {!patients || patients.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No patients yet. Add your first one to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {(patients as Patient[]).map((p) => (
              <Link
                key={p.id}
                href={`/patients/${p.id}`}
                className="block bg-white border border-slate-200 rounded-lg px-4 py-3 hover:border-teal-300 transition"
              >
                <div className="font-medium text-slate-800">{p.name}</div>
                <div className="text-xs text-slate-400">
                  {p.patient_code} · {[p.age && `${p.age}y`, p.sex, p.phone].filter(Boolean).join(' · ')}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
