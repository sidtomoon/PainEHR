'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-roles';
import type { AppointmentStatus, AppointmentType, LeaveType } from '@/lib/types';

export type ActionResult = {
  success: boolean;
  error?: string;
  missingTable?: boolean;
};

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export async function createAppointment(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized. Please log in.' };

    const patientId = str(formData, 'patient_id');
    if (!patientId) return { success: false, error: 'Please select a patient.' };

    const appointmentType = (str(formData, 'appointment_type') || 'followup') as AppointmentType;
    const scheduledDate = str(formData, 'scheduled_date');
    if (!scheduledDate) return { success: false, error: 'Scheduled date is required.' };

    const scheduledTime = str(formData, 'scheduled_time');
    const location = str(formData, 'location');
    const notes = str(formData, 'notes');

    const { error } = await supabase.from('appointments').insert({
      user_id: user.id,
      patient_id: patientId,
      appointment_type: appointmentType,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      location,
      notes,
      status: 'scheduled',
    });

    if (error) return { success: false, error: error.message };

    revalidatePath('/calendar');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to book appointment.' };
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/calendar');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update appointment.' };
  }
}

export async function rescheduleAppointment(
  appointmentId: string,
  scheduledDate: string,
  scheduledTime: string | null,
  location: string | null,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const { error } = await supabase
      .from('appointments')
      .update({
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime || null,
        location: location || null,
        status: 'scheduled',
      })
      .eq('id', appointmentId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/calendar');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to reschedule appointment.' };
  }
}

export async function deleteAppointment(appointmentId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/calendar');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete appointment.' };
  }
}

export async function createDoctorLeave(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized. Please sign in again.' };

    const title = str(formData, 'title');
    if (!title) return { success: false, error: 'Leave title is required.' };

    const startDate = str(formData, 'start_date');
    const endDate = str(formData, 'end_date') || startDate;
    if (!startDate) return { success: false, error: 'Start date is required.' };

    const leaveType = (str(formData, 'leave_type') || 'leave') as LeaveType;
    const notes = str(formData, 'notes');

    // 1. Try doctor_leaves table
    const { error } = await supabase.from('doctor_leaves').insert({
      user_id: user.id,
      title,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      notes,
      all_day: true,
    });

    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        (error.message && error.message.toLowerCase().includes('doctor_leaves'))
      ) {
        // Fallback: save to announcements table so it works immediately without SQL migrations
        const payload = JSON.stringify({
          type: 'doctor_leave',
          title,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          all_day: true,
          notes,
        });

        const { error: annError } = await supabase.from('announcements').insert({
          user_id: user.id,
          message: payload,
        });

        if (annError) {
          return {
            success: false,
            missingTable: true,
            error: annError.message,
          };
        }

        revalidatePath('/calendar');
        return { success: true };
      }
      return { success: false, error: error.message };
    }

    revalidatePath('/calendar');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to record doctor leave.',
    };
  }
}

export async function deleteDoctorLeave(leaveId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    // 1. Try deleting from doctor_leaves
    const { error } = await supabase
      .from('doctor_leaves')
      .delete()
      .eq('id', leaveId);

    // 2. Try deleting from announcements (fallback storage)
    const { error: annError } = await supabase
      .from('announcements')
      .delete()
      .eq('id', leaveId);

    if (error && annError) {
      return { success: false, error: error.message || annError.message };
    }

    revalidatePath('/calendar');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete leave.' };
  }
}

