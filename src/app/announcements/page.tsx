import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/app/components/Header';
import { isMessagingConfigured } from '@/lib/messaging/service';
import { AnnouncementForm } from './AnnouncementForm';
import type { Announcement } from '@/lib/types';

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const [{ data: announcements }, { count: optedInCount }] = await Promise.all([
    supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('patients').select('id', { count: 'exact', head: true }).eq('whatsapp_opt_in', true),
  ]);

  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto px-4 pb-24 pt-2 w-full">
        <Link href="/patients" className="text-xs text-slate-400 hover:text-slate-600">← Patients</Link>
        <h2 className="text-lg font-semibold mt-2 mb-1">Announcements</h2>
        <p className="text-xs text-slate-400 mb-4">
          Broadcasts (doctor unavailability, clinic location, etc.) to patients who&apos;ve opted in to WhatsApp — {optedInCount ?? 0} currently opted in.
        </p>

        {!isMessagingConfigured() && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            WhatsApp isn&apos;t configured yet (no provider set in environment variables). Announcements will be logged but won&apos;t actually send until that&apos;s set up.
          </div>
        )}

        <AnnouncementForm />

        <div className="text-xs uppercase tracking-wide text-slate-400 font-medium mt-6 mb-2">History</div>
        {!announcements || announcements.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No announcements sent yet.</div>
        ) : (
          <div className="space-y-2">
            {(announcements as Announcement[]).map((a) => (
              <div key={a.id} className="bg-white border border-slate-200 rounded-lg px-4 py-3">
                <div className="text-xs text-slate-400 mb-1">
                  {a.sent_at ? new Date(a.sent_at).toLocaleString() : 'not sent'}
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
