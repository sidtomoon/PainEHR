import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendAppointmentReminder } from '@/lib/messaging/service';

const REMINDER_DAYS_AHEAD = 1;

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + REMINDER_DAYS_AHEAD);
  const targetDateStr = targetDate.toISOString().slice(0, 10);

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, appointment_type, scheduled_date, patients!inner(name, phone, whatsapp_opt_in)')
    .eq('scheduled_date', targetDateStr)
    .eq('status', 'scheduled')
    .is('reminder_sent_at', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const appt of appointments || []) {
    const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
    if (!patient?.whatsapp_opt_in || !patient.phone) {
      results.push({ appointmentId: appt.id, skipped: true, reason: 'not opted in or no phone' });
      continue;
    }

    const result = await sendAppointmentReminder({
      phone: patient.phone,
      patientName: patient.name,
      appointmentType: appt.appointment_type,
      scheduledDate: appt.scheduled_date,
    });

    if (result.success) {
      await supabase.from('appointments').update({ reminder_sent_at: new Date().toISOString() }).eq('id', appt.id);
    }
    results.push({ appointmentId: appt.id, ...result });
  }

  return NextResponse.json({ checked: appointments?.length || 0, results });
}
