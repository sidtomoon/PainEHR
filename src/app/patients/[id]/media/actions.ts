'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { MediaType } from '@/lib/types';

export async function updateOneDriveFolder(patientId: string, folderUrl: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const cleanUrl = folderUrl && folderUrl.trim() ? folderUrl.trim() : null;

  try {
    const { error } = await supabase
      .from('patients')
      .update({ onedrive_folder_url: cleanUrl })
      .eq('id', patientId);

    if (error) {
      console.error('Failed to update onedrive_folder_url:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/patients/${patientId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update folder link';
    return { success: false, error: msg };
  }
}

export async function addPatientMedia(patientId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const title = String(formData.get('title') || '').trim();
  const mediaType = (String(formData.get('media_type') || 'other').trim()) as MediaType;
  const url = String(formData.get('url') || '').trim();
  const scanDate = String(formData.get('scan_date') || '').trim() || new Date().toISOString().split('T')[0];
  const notes = String(formData.get('notes') || '').trim() || null;
  const encounterId = String(formData.get('encounter_id') || '').trim() || null;

  if (!title) {
    return { success: false, error: 'Title is required' };
  }
  if (!url) {
    return { success: false, error: 'OneDrive link / URL is required' };
  }

  try {
    const { error } = await supabase.from('patient_media').insert({
      patient_id: patientId,
      encounter_id: encounterId,
      user_id: user.id,
      media_type: mediaType,
      title,
      url,
      scan_date: scanDate,
      notes,
    });

    if (error) {
      console.error('Failed to insert patient_media:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/patients/${patientId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save media record';
    return { success: false, error: msg };
  }
}

export async function deletePatientMedia(patientId: string, mediaId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const { error } = await supabase
      .from('patient_media')
      .delete()
      .eq('id', mediaId)
      .eq('patient_id', patientId);

    if (error) {
      console.error('Failed to delete patient_media:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/patients/${patientId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete media';
    return { success: false, error: msg };
  }
}
