import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/app/components/Header';
import { isMessagingConfigured } from '@/lib/messaging/service';
import { BroadcastDispatcher } from './BroadcastDispatcher';
import { logAnnouncement } from './actions';
import type { Announcement } from '@/lib/types';

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const [{ data: announcements }, { data: optedInPatients }] = await Promise.all([
    supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(20),
    supabase
      .from('patients')
      .select('id, name, patient_code, phone')
      .eq('whatsapp_opt_in', true)
      .not('phone', 'is', null)
      .order('name', { ascending: true }),
  ]);

  const patients = (optedInPatients || []) as {
    id: string;
    name: string;
    patient_code: string;
    phone: string;
  }[];

  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto px-4 pb-24 pt-2 w-full">
        <Link href="/patients" className="text-xs text-slate-400 hover:text-slate-600">← Patients</Link>
        <h2 className="text-lg font-semibold mt-2 mb-1">Clinic Announcements & Broadcasts</h2>
        <p className="text-xs text-slate-400 mb-4">
          Broadcast notices (doctor leave, clinic timings, etc.) to patients who&apos;ve opted in to WhatsApp — {patients.length} currently opted in.
        </p>

        <BroadcastDispatcher
          patients={patients}
          isAutomatedConfigured={isMessagingConfigured()}
          createAction={logAnnouncement}
        />

        <div className="text-xs uppercase tracking-wide text-slate-400 font-medium mt-6 mb-2">History</div>
        {!announcements || announcements.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No announcements logged yet.</div>
        ) : (
          <div className="space-y-2">
            {(announcements as Announcement[]).map((a) => (
              <div key={a.id} className="bg-white border border-slate-200 rounded-lg px-4 py-3">
                <div className="text-xs text-slate-400 mb-1">
                  {a.sent_at ? new Date(a.sent_at).toLocaleString() : 'Logged for records'}
                </div>
                <div className="text-sm text-slate-700">{a.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
