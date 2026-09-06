import { Header } from '@/app/components/Header';
import { createClient } from '@/lib/supabase/server';
import { saveEncounter } from '@/app/patients/[id]/encounters/actions';
import { CaptureFlow } from './CaptureFlow';
import type { Encounter } from '@/lib/types';

export default async function NewEncounterPage({ params }: PageProps<'/patients/[id]/encounters/new'>) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: priorEncounters } = await supabase
    .from('encounters')
    .select('chief_complaint, diagnosis, pain_location')
    .eq('patient_id', id)
    .order('encounter_date', { ascending: false })
    .order('created_at', { ascending: false });

  // Carry forward the most recent *non-blank* value per field — a procedure
  // visit that didn't restate the diagnosis shouldn't blank it out for the
  // next follow-up.
  const rows = (priorEncounters as Pick<Encounter, 'chief_complaint' | 'diagnosis' | 'pain_location'>[] | null) ?? [];
  const prior = rows.length
    ? {
        chief_complaint: rows.find((r) => r.chief_complaint)?.chief_complaint ?? null,
        diagnosis: rows.find((r) => r.diagnosis)?.diagnosis ?? null,
        pain_location: rows.find((r) => r.pain_location)?.pain_location ?? null,
      }
    : null;

  return (
    <>
      <Header />
      <CaptureFlow patientId={id} saveAction={saveEncounter.bind(null, id)} priorEncounter={prior} />
    </>
  );
}
