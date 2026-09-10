'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { SexType } from '@/lib/types';

export async function createPatient(_prevState: unknown, formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  if (!name) return { status: 'error' as const, message: 'Name is required.' };

  const ageRaw = String(formData.get('age') || '').trim();
  const age = ageRaw ? Number(ageRaw) : null;
  const sex = (String(formData.get('sex') || '') || null) as SexType | null;
  const phone = String(formData.get('phone') || '').trim() || null;
  const researchConsent = formData.get('research_consent') === 'on';
  const whatsappOptIn = formData.get('whatsapp_opt_in') === 'on';
  const today = new Date().toISOString().slice(0, 10);
  const patientCodeRaw = String(formData.get('patient_code') || '').trim();
  const insertPayload: Record<string, unknown> = {
    name, age, sex, phone,
    research_consent: researchConsent || null,
    research_consent_date: researchConsent ? today : null,
    whatsapp_opt_in: whatsappOptIn,
    whatsapp_opt_in_date: whatsappOptIn ? today : null,
  };
  if (patientCodeRaw) {
    insertPayload.patient_code = patientCodeRaw;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 'error' as const, message: 'You must be signed in to add a patient.' };
  insertPayload.user_id = user.id;

  const { data, error } = await supabase
    .from('patients')
    .insert(insertPayload)
    .select('id')
    .single();

  if (error) {
    const msg = error.code === '23505' ? `A patient with UID "${patientCodeRaw}" already exists.` : error.message;
    return { status: 'error' as const, message: msg };
  }

  revalidatePath('/patients');
  redirect(`/patients/${data.id}`);
}
