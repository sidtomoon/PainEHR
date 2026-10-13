'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { PrescriptionItem } from '@/lib/types';

export async function savePrescription(
  patientId: string,
  items: PrescriptionItem[],
  advice: string | null,
  encounterId?: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  if (!items || items.length === 0) {
    return { success: false, error: 'Prescription must contain at least one medicine' };
  }

  try {
    const { data, error } = await supabase
      .from('patient_prescriptions')
      .insert({
        patient_id: patientId,
        encounter_id: encounterId || null,
        user_id: user.id,
        items,
        advice: advice && advice.trim() ? advice.trim() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save prescription:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/patients/${patientId}`);
    return { success: true, prescription: data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save prescription';
    return { success: false, error: msg };
  }
}

export async function deletePrescription(patientId: string, prescriptionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const { error } = await supabase
      .from('patient_prescriptions')
      .delete()
      .eq('id', prescriptionId)
      .eq('patient_id', patientId);

    if (error) {
      console.error('Failed to delete prescription:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/patients/${patientId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete prescription';
    return { success: false, error: msg };
  }
}
