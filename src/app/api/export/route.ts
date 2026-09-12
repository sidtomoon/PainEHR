import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth-roles';

/**
 * CSV export of research-consented patient data.
 *
 * GET /api/export?type=summary   — one row per consented patient (outcomes summary)
 * GET /api/export?type=encounters — one row per encounter for consented patients
 *
 * Auth-gated: requires a logged-in admin session.
 * Only patients with research_consent = true are included.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required to export data' }, { status: 403 });
  }

  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'summary';

  if (type === 'encounters') {
    return exportEncounters(supabase);
  }
  return exportSummary(supabase);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function exportSummary(supabase: any) {
  const { data, error } = await supabase
    .from('patient_outcomes_summary')
    .select('*')
    .eq('research_consent', true)
    .order('patient_code', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = [
    'patient_code', 'name',
    'baseline_date', 'baseline_pain', 'baseline_function', 'baseline_mood', 'baseline_sleep', 'baseline_qol',
    'latest_date', 'latest_pain', 'latest_function', 'latest_mood', 'latest_sleep', 'latest_qol',
    'latest_diagnosis', 'latest_pain_location', 'latest_global_impression',
    'pain_change', 'pain_change_pct',
  ];

  const csv = toCsv(headers, data || []);
  const timestamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="painehr_outcomes_summary_${timestamp}.csv"`,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function exportEncounters(supabase: any) {
  // First get consented patient IDs
  const { data: patients, error: pErr } = await supabase
    .from('patients')
    .select('id, patient_code')
    .eq('research_consent', true);

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (!patients || patients.length === 0) {
    return new Response('No research-consented patients found.', { status: 200 });
  }

  const patientIds = patients.map((p: { id: string }) => p.id);
  const codeMap = new Map(patients.map((p: { id: string; patient_code: string }) => [p.id, p.patient_code]));

  const { data: encounters, error: eErr } = await supabase
    .from('encounters')
    .select('*')
    .in('patient_id', patientIds)
    .order('encounter_date', { ascending: true });

  if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });

  const headers = [
    'patient_code', 'encounter_date', 'encounter_type',
    'diagnosis', 'diagnosis_code', 'pain_location', 'pain_score_nrs',
    'function_score_0_10', 'mood_score_0_10', 'sleep_score_0_10', 'qol_score_0_10',
    'patient_global_impression', 'widespread_pain',
    'pain_mechanism', 'procedure', 'procedure_category',
    'chief_complaint', 'adverse_event',
  ];

  // Inject patient_code from lookup map
  const rows = (encounters || []).map((enc: Record<string, unknown>) => ({
    ...enc,
    patient_code: codeMap.get(enc.patient_id as string) || '',
  }));

  const csv = toCsv(headers, rows);
  const timestamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="painehr_encounters_${timestamp}.csv"`,
    },
  });
}

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n') + '\n';
}
