'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { AppointmentStatus, AppointmentType, LeaveType } from '@/lib/types';

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export async function createAppointment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const patientId = str(formData, 'patient_id');
  if (!patientId) throw new Error('Please select a patient.');

  const appointmentType = (str(formData, 'appointment_type') || 'followup') as AppointmentType;
  const scheduledDate = str(formData, 'scheduled_date');
  if (!scheduledDate) throw new Error('Scheduled date is required.');

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

  if (error) throw new Error(error.message);

  revalidatePath('/calendar');
  return { success: true };
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId);

  if (error) throw new Error(error.message);

  revalidatePath('/calendar');
  return { success: true };
}

export async function rescheduleAppointment(
  appointmentId: string,
  scheduledDate: string,
  scheduledTime: string | null,
  location: string | null,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('appointments')
    .update({
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime || null,
      location: location || null,
      status: 'scheduled',
    })
    .eq('id', appointmentId);

  if (error) throw new Error(error.message);

  revalidatePath('/calendar');
  return { success: true };
}

export async function deleteAppointment(appointmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) throw new Error(error.message);

  revalidatePath('/calendar');
  return { success: true };
}

export async function createDoctorLeave(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const title = str(formData, 'title');
  if (!title) throw new Error('Leave title is required.');

  const startDate = str(formData, 'start_date');
  const endDate = str(formData, 'end_date') || startDate;
  if (!startDate) throw new Error('Start date is required.');

  const leaveType = (str(formData, 'leave_type') || 'leave') as LeaveType;
  const notes = str(formData, 'notes');

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
    if (error.code === '42P01') {
      throw new Error('Doctor leaves table does not exist in Supabase yet. Please run migration 0007 in your Supabase SQL editor.');
    }
    throw new Error(error.message);
  }

  revalidatePath('/calendar');
  return { success: true };
}

export async function deleteDoctorLeave(leaveId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('doctor_leaves')
    .delete()
    .eq('id', leaveId);

  if (error) throw new Error(error.message);

  revalidatePath('/calendar');
  return { success: true };
}
