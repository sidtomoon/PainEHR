import { notFound } from 'next/navigation';
import { Header } from '@/app/components/Header';
import { createClient } from '@/lib/supabase/server';
import { saveEncounter } from '@/app/patients/[id]/encounters/actions';
import { CaptureFlow } from './CaptureFlow';
import type { Encounter, EncounterType, Patient } from '@/lib/types';

export default async function NewEncounterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type } = await searchParams;
  const supabase = await createClient();

  const [{ data: patient }, { data: priorEncounters }] = await Promise.all([
    supabase.from('patients').select('id, name, patient_code').eq('id', id).maybeSingle<Pick<Patient, 'id' | 'name' | 'patient_code'>>(),
    supabase
      .from('encounters')
      .select('chief_complaint, diagnosis, diagnosis_code, pain_location, pain_score_nrs, encounter_date')
      .eq('patient_id', id)
      .order('encounter_date', { ascending: false })
      .order('created_at', { ascending: false }),
  ]);

  if (!patient) notFound();

  // Carry forward the most recent non-blank value per field
  const rows = (priorEncounters as (Pick<Encounter, 'chief_complaint' | 'diagnosis' | 'diagnosis_code' | 'pain_location' | 'pain_score_nrs'> & { encounter_date?: string })[] | null) ?? [];
  const prior = rows.length
    ? {
        chief_complaint: rows.find((r) => r.chief_complaint)?.chief_complaint ?? null,
        diagnosis: rows.find((r) => r.diagnosis)?.diagnosis ?? null,
        diagnosis_code: rows.find((r) => r.diagnosis_code)?.diagnosis_code ?? null,
        pain_location: rows.find((r) => r.pain_location)?.pain_location ?? null,
        pain_score_nrs: rows.find((r) => r.pain_score_nrs != null)?.pain_score_nrs ?? null,
      }
    : null;

  const validTypes: EncounterType[] = ['new', 'followup', 'procedure', 'other'];
  const initialType: EncounterType = (type && validTypes.includes(type as EncounterType))
    ? (type as EncounterType)
    : (prior ? 'followup' : 'new');

  return (
    <>
      <Header />
      <CaptureFlow
        patientId={id}
        patientName={patient.name}
        patientCode={patient.patient_code}
        saveAction={saveEncounter.bind(null, id)}
        priorEncounter={prior}
        initialType={initialType}
      />
    </>
  );
}
