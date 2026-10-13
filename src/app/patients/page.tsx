import { createClient } from '@/lib/supabase/server';
import { Header } from '@/app/components/Header';
import { PatientsDirectoryWithQueue } from './PatientsDirectoryWithQueue';
import type { Patient } from '@/lib/types';

export default async function PatientsPage({ searchParams }: PageProps<'/patients'>) {
  const { q } = await searchParams;
  const search = typeof q === 'string' ? q.trim() : '';

  const supabase = await createClient();
  const todayStr = new Date().toISOString().split('T')[0];

  const [{ data: patients }, { data: todayAppointments }] = await Promise.all([
    supabase.from('patients').select('*').order('created_at', { ascending: false }),
    supabase
      .from('appointments')
      .select('*, patient:patients(*)')
      .eq('scheduled_date', todayStr)
      .order('scheduled_time', { ascending: true }),
  ]);

  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto px-4 pb-24 pt-2 w-full">
        <PatientsDirectoryWithQueue
          patients={(patients || []) as Patient[]}
          todayAppointments={(todayAppointments || []) as any[]}
          initialSearch={search}
        />
      </div>
    </>
  );
}
