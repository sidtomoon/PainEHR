import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/app/components/Header';
import { CalendarClient } from './CalendarClient';
import { getCurrentUser } from '@/lib/auth-roles';
import type { AppointmentWithPatient, DoctorLeave, Patient } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  const supabase = await createClient();

  // 1. Fetch appointments with patient details
  const { data: rawAppointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select(`
      id,
      patient_id,
      created_from_encounter_id,
      appointment_type,
      scheduled_date,
      scheduled_time,
      location,
      status,
      notes,
      reminder_sent_at,
      created_at,
      patient:patients (
        id,
        name,
        patient_code,
        phone
      )
    `)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true });

  if (appointmentsError) {
    console.error('Failed to fetch appointments:', appointmentsError);
  }

  // Filter out any appointments where patient might be null/missing
  const appointments = (rawAppointments || []).filter(
    (a) => a && a.patient
  ) as unknown as AppointmentWithPatient[];

  // 2. Fetch doctor leaves (first from doctor_leaves, with fallback to announcements)
  let doctorLeaves: DoctorLeave[] = [];
  try {
    const { data: leavesData, error: leavesError } = await supabase
      .from('doctor_leaves')
      .select('*')
      .order('start_date', { ascending: true });

    if (!leavesError && leavesData && leavesData.length > 0) {
      doctorLeaves = leavesData as DoctorLeave[];
    } else {
      // Fallback: fetch from announcements table
      const { data: annData } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (annData) {
        doctorLeaves = annData
          .map((a) => {
            try {
              const parsed = JSON.parse(a.message);
              if (parsed.type === 'doctor_leave') {
                return {
                  id: a.id,
                  user_id: a.user_id,
                  title: parsed.title,
                  leave_type: parsed.leave_type || 'leave',
                  start_date: parsed.start_date,
                  end_date: parsed.end_date,
                  all_day: parsed.all_day ?? true,
                  notes: parsed.notes || null,
                  created_at: a.created_at,
                } as DoctorLeave;
              }
            } catch {
              // ignore non-JSON messages
            }
            return null;
          })
          .filter(Boolean) as DoctorLeave[];
      }
    }
  } catch (err) {
    console.warn('Doctor leaves query failed:', err);
    doctorLeaves = [];
  }

  // 3. Fetch patients list for quick appointment booking
  const { data: rawPatients } = await supabase
    .from('patients')
    .select('id, name, patient_code, phone')
    .order('name', { ascending: true });

  const patients = (rawPatients || []) as Pick<Patient, 'id' | 'name' | 'patient_code' | 'phone'>[];

  return (
    <>
      <Header />
      <main className="w-full">
        <CalendarClient
          initialAppointments={appointments}
          initialDoctorLeaves={doctorLeaves}
          patients={patients}
          userRole={currentUser.role}
        />
      </main>
    </>
  );
}
