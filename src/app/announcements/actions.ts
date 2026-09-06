'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sendAnnouncement } from '@/lib/messaging/service';

export async function createAnnouncement(_prevState: unknown, formData: FormData) {
  const message = String(formData.get('message') || '').trim();
  if (!message) return { status: 'error' as const, message: 'Enter a message.' };

  const supabase = await createClient();

  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('id, phone, whatsapp_opt_in')
    .eq('whatsapp_opt_in', true)
    .not('phone', 'is', null);

  if (patientsError) return { status: 'error' as const, message: patientsError.message };
  if (!patients || patients.length === 0) {
    return { status: 'error' as const, message: 'No patients have opted in to WhatsApp messages yet.' };
  }

  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert({ message })
    .select('id')
    .single();
  if (error) return { status: 'error' as const, message: error.message };

  await supabase.from('announcement_recipients').insert(
    patients.map((p) => ({ announcement_id: announcement.id, patient_id: p.id })),
  );

  let sent = 0;
  let failed = 0;
  for (const patient of patients) {
    const result = await sendAnnouncement({ phone: patient.phone!, message });
    await supabase
      .from('announcement_recipients')
      .update({
        status: result.success ? 'sent' : 'failed',
        provider_message_id: result.providerMessageId,
        error: result.error,
        sent_at: result.success ? new Date().toISOString() : null,
      })
      .eq('announcement_id', announcement.id)
      .eq('patient_id', patient.id);
    if (result.success) sent++; else failed++;
  }

  await supabase.from('announcements').update({ sent_at: new Date().toISOString() }).eq('id', announcement.id);

  revalidatePath('/announcements');
  return { status: 'sent' as const, message: `Sent to ${sent} patient${sent === 1 ? '' : 's'}${failed ? `, ${failed} failed` : ''}.` };
}
