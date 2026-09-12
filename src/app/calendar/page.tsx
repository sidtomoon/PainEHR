import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/app/components/Header';
import { CalendarClient } from './CalendarClient';
import type { AppointmentWithPatient, DoctorLeave, Patient } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

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

  // 2. Fetch doctor leaves (graceful fallback if table 0007 not run yet)
  let doctorLeaves: DoctorLeave[] = [];
  try {
    const { data: leavesData, error: leavesError } = await supabase
      .from('doctor_leaves')
      .select('*')
      .order('start_date', { ascending: true });

    if (!leavesError && leavesData) {
      doctorLeaves = leavesData as DoctorLeave[];
    }
  } catch (err) {
    console.warn('Doctor leaves query failed (migration 0007 may not be applied yet):', err);
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
        />
      </main>
    </>
  );
}
