'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sendPostOpInstructions } from '@/lib/messaging/service';

export async function sendPostOpMessage(patientId: string, encounterId: string, _prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const [{ data: patient }, { data: encounter }] = await Promise.all([
    supabase.from('patients').select('name, phone, whatsapp_opt_in').eq('id', patientId).single(),
    supabase.from('encounters').select('procedure').eq('id', encounterId).single(),
  ]);

  if (!patient?.phone) return { status: 'error' as const, message: 'This patient has no phone number on file.' };
  if (!patient.whatsapp_opt_in) return { status: 'error' as const, message: 'This patient hasn’t opted in to WhatsApp messages.' };

  const instructions = String(formData.get('instructions') || '').trim();

  const result = await sendPostOpInstructions({
    phone: patient.phone,
    patientName: patient.name,
    procedureName: encounter?.procedure || 'your procedure',
    instructions: instructions || 'Please contact the clinic if you have any concerns.',
  });

  if (!result.success) return { status: 'error' as const, message: result.error || 'Send failed.' };
  revalidatePath(`/patients/${patientId}`);
  return { status: 'sent' as const, message: 'Post-op instructions sent.' };
}
