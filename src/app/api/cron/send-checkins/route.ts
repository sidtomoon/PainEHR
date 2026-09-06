import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendCheckinPrompt } from '@/lib/messaging/service';

const CHECKIN_DAYS_AFTER = 3;

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - CHECKIN_DAYS_AFTER);
  const targetDateStr = targetDate.toISOString().slice(0, 10);

  const { data: encounters, error } = await supabase
    .from('encounters')
    .select('id, patient_id, patients!inner(name, phone, whatsapp_opt_in)')
    .eq('encounter_type', 'procedure')
    .eq('encounter_date', targetDateStr);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const enc of encounters || []) {
    const patient = Array.isArray(enc.patients) ? enc.patients[0] : enc.patients;
    if (!patient?.whatsapp_opt_in || !patient.phone) {
      results.push({ encounterId: enc.id, skipped: true, reason: 'not opted in or no phone' });
      continue;
    }

    const { data: checkin, error: insertError } = await supabase
      .from('patient_checkins')
      .insert({ patient_id: enc.patient_id, source_encounter_id: enc.id, checkin_type: 'day3_postop_pgic' })
      .select('id, token')
      .single();

    if (insertError) {
      // Unique violation means a check-in for this encounter already exists — not an error.
      results.push({ encounterId: enc.id, skipped: true, reason: insertError.message });
      continue;
    }

    const checkinUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkin/${checkin.token}`;
    const result = await sendCheckinPrompt({ phone: patient.phone, patientName: patient.name, checkinUrl });

    if (result.success) {
      await supabase.from('patient_checkins').update({ sent_at: new Date().toISOString() }).eq('id', checkin.id);
    }
    results.push({ encounterId: enc.id, ...result });
  }

  return NextResponse.json({ checked: encounters?.length || 0, results });
}
