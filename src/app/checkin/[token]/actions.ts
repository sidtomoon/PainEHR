'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';
import type { PatientGlobalImpression } from '@/lib/types';

export async function submitCheckin(token: string, _prevState: unknown, formData: FormData) {
  const response = String(formData.get('response') || '') as PatientGlobalImpression | '';
  if (!response) return { status: 'error' as const, message: 'Please choose an option.' };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('patient_checkins')
    .update({ patient_global_impression: response, responded_at: new Date().toISOString() })
    .eq('token', token);

  if (error) return { status: 'error' as const, message: 'Something went wrong. Please try again.' };

  revalidatePath(`/checkin/${token}`);
  return { status: 'sent' as const, message: 'Thank you — your response has been recorded.' };
}
