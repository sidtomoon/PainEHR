'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sendPreOpInstructions } from '@/lib/messaging/service';
import type { AppointmentStatus } from '@/lib/types';

export async function updateAppointmentStatus(patientId: string, appointmentId: string, status: AppointmentStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from('appointments').update({ status }).eq('id', appointmentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function sendPreOpMessage(patientId: string, appointmentId: string, _prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const [{ data: patient }, { data: appointment }] = await Promise.all([
    supabase.from('patients').select('name, phone, whatsapp_opt_in').eq('id', patientId).single(),
    supabase.from('appointments').select('scheduled_date, scheduled_time, location').eq('id', appointmentId).single(),
  ]);

  if (!patient?.phone) return { status: 'error' as const, message: 'This patient has no phone number on file.' };
  if (!patient.whatsapp_opt_in) return { status: 'error' as const, message: 'This patient hasn’t opted in to WhatsApp messages.' };

  const procedureName = String(formData.get('procedure_name') || '').trim() || 'your procedure';
  const instructions = String(formData.get('instructions') || '').trim();

  const result = await sendPreOpInstructions({
    phone: patient.phone,
    patientName: patient.name,
    procedureName,
    scheduledDate: appointment?.scheduled_date || '',
    scheduledTime: appointment?.scheduled_time || 'to be confirmed',
    location: appointment?.location || 'to be confirmed',
    instructions: instructions || 'None',
  });

  if (!result.success) return { status: 'error' as const, message: result.error || 'Send failed.' };
  revalidatePath(`/patients/${patientId}`);
  return { status: 'sent' as const, message: 'Pre-op instructions sent.' };
}
