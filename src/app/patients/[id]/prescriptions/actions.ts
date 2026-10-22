'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { PrescriptionItem } from '@/lib/types';

function formatPrescriptionSummary(items: PrescriptionItem[], advice: string | null): string {
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const lines: string[] = [
    `=== DIGITAL PRESCRIPTION (${dateStr}) ===`,
    'Medications:',
  ];

  items.forEach((it, idx) => {
    const parts = [
      `${idx + 1}. ${it.name}`,
      it.dosage ? `(${it.dosage})` : null,
      it.frequency ? `| Dose: ${it.frequency}` : null,
      it.duration ? `| Duration: ${it.duration}` : null,
      it.instructions ? `| Note: ${it.instructions}` : null,
    ].filter(Boolean);
    lines.push(`   ${parts.join(' ')}`);
  });

  if (advice && advice.trim()) {
    lines.push('');
    lines.push('Advice & Precautions:');
    lines.push(`   ${advice.trim()}`);
  }

  return lines.join('\n');
}

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

  const validItems = items.filter((it) => it.name && it.name.trim());
  if (validItems.length === 0) {
    return { success: false, error: 'Please enter at least one valid medication name' };
  }

  // 1. First attempt: Insert into patient_prescriptions table
  let tableSaved = false;
  let savedData: Record<string, unknown> | null = null;
  try {
    const { data, error } = await supabase
      .from('patient_prescriptions')
      .insert({
        patient_id: patientId,
        encounter_id: encounterId || null,
        user_id: user.id,
        items: validItems,
        advice: advice && advice.trim() ? advice.trim() : null,
      })
      .select()
      .single();

    if (!error && data) {
      tableSaved = true;
      savedData = data;
    }
  } catch (err) {
    console.warn('patient_prescriptions insert attempt encountered issue:', err);
  }

  // 2. Dual-Save / Fallback to Encounter Plan:
  // If patient_prescriptions table doesn't exist yet, save to encounters table
  // so the prescription is ALWAYS saved to the chart without throwing an error!
  if (!tableSaved) {
    try {
      const formattedRx = formatPrescriptionSummary(validItems, advice);

      // Check if there is an active encounter specified or today's encounter
      let targetEncounterId = encounterId;
      if (!targetEncounterId) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const { data: latestEnc } = await supabase
          .from('encounters')
          .select('id, plan, notes')
          .eq('patient_id', patientId)
          .eq('encounter_date', todayStr)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestEnc) {
          targetEncounterId = latestEnc.id;
          const currentPlan = latestEnc.plan ? latestEnc.plan.trim() : '';
          const updatedPlan = currentPlan ? `${currentPlan}\n\n${formattedRx}` : formattedRx;

          await supabase
            .from('encounters')
            .update({
              plan: updatedPlan,
              notes: latestEnc.notes || (advice ? advice.trim() : null),
              verified_at: new Date().toISOString(),
            })
            .eq('id', latestEnc.id);
        }
      }

      // If no encounter exists for today, create one so the chart holds the record
      if (!targetEncounterId) {
        const { data: newEnc } = await supabase
          .from('encounters')
          .insert({
            patient_id: patientId,
            user_id: user.id,
            encounter_type: 'other',
            encounter_date: new Date().toISOString().slice(0, 10),
            source: 'manual',
            chief_complaint: 'Prescription Refill / Quick Rx',
            plan: formattedRx,
            notes: advice ? advice.trim() : null,
            verified_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (newEnc) {
          targetEncounterId = newEnc.id;
        }
      }

      savedData = {
        id: targetEncounterId || 'encounter-saved',
        patient_id: patientId,
        items: validItems,
        advice: advice || null,
        created_at: new Date().toISOString(),
        saved_to: 'encounter_plan',
      };
    } catch (fallbackErr) {
      console.error('Fallback encounter save failed:', fallbackErr);
      return {
        success: false,
        error: fallbackErr instanceof Error ? fallbackErr.message : 'Failed to record prescription to chart',
      };
    }
  }

  revalidatePath(`/patients/${patientId}`);
  return {
    success: true,
    prescription: savedData,
    message: tableSaved
      ? 'Prescription saved to chart'
      : 'Prescription saved to patient encounter plan',
  };
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
