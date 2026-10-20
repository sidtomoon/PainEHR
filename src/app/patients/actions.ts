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

/**
 * Retrospectively updates patient demographic fields (CR No., Name, Age, Sex, Phone)
 * extracted from an OPD card or modified by the clinician.
 */
export async function updatePatientDemographics(
  patientId: string,
  demographics: {
    name?: string | null;
    patient_code?: string | null;
    age?: number | null;
    sex?: SexType | null;
    phone?: string | null;
  },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 'error' as const, message: 'Unauthorized' };

  const updates: Record<string, unknown> = {};
  if (demographics.name && demographics.name.trim()) updates.name = demographics.name.trim();
  if (demographics.patient_code && demographics.patient_code.trim()) updates.patient_code = demographics.patient_code.trim();
  if (demographics.age !== undefined && demographics.age !== null) updates.age = demographics.age;
  if (demographics.sex) updates.sex = demographics.sex;
  if (demographics.phone !== undefined) updates.phone = demographics.phone ? demographics.phone.trim() : null;

  if (Object.keys(updates).length === 0) {
    return { status: 'success' as const, message: 'No demographic changes to apply.' };
  }

  const { error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', patientId);

  if (error) {
    const msg = error.code === '23505' ? `CR No. "${demographics.patient_code}" is already in use by another patient.` : error.message;
    return { status: 'error' as const, message: msg };
  }

  revalidatePath(`/patients/${patientId}`);
  revalidatePath('/patients');
  return { status: 'success' as const, message: 'Patient demographics updated successfully.' };
}
