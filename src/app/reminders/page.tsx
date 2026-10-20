import { createClient } from '@/lib/supabase/server';
import { Header } from '@/app/components/Header';
import { RemindersDesk } from './RemindersDesk';

export default async function RemindersPage() {
  const supabase = await createClient();

  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, patient:patients(*)')
    .eq('status', 'scheduled')
    .gte('scheduled_date', todayDateStr)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true });

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 pb-24 pt-3 w-full">
        <RemindersDesk
          initialAppointments={(appointments || []) as any[]}
          todayDateStr={todayDateStr}
          tomorrowDateStr={tomorrowDateStr}
        />
      </div>
    </>
  );
}
