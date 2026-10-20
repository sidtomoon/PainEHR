'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function markReminderSent(appointmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const { error } = await supabase
      .from('appointments')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', appointmentId);

    if (error) {
      console.error('Failed to mark reminder as sent:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/reminders');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update reminder status';
    return { success: false, error: msg };
  }
}
