import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/app/components/Header';
import { updateAppointmentStatus } from './appointments/actions';
import { SendPreOpForm } from './appointments/SendPreOpForm';
import { SendPostOpForm } from './encounters/SendPostOpForm';
import type { Appointment, Encounter, Patient, PatientCheckin, PatientOutcomesSummary } from '@/lib/types';

const TYPE_LABELS: Record<string, string> = {
  new: 'New', followup: 'Follow-up', procedure: 'Procedure', other: 'Other',
};

export default async function PatientPage({ params }: PageProps<'/patients/[id]'>) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: patient }, { data: encounters }, { data: appointments }, { data: outcomes }, { data: checkins }] = await Promise.all([
    supabase.from('patients').select('*').eq('id', id).single<Patient>(),
    supabase.from('encounters').select('*').eq('patient_id', id).order('encounter_date', { ascending: false }),
    supabase.from('appointments').select('*').eq('patient_id', id).eq('status', 'scheduled').order('scheduled_date', { ascending: true }),
    supabase.from('patient_outcomes_summary').select('*').eq('patient_id', id).maybeSingle<PatientOutcomesSummary>(),
    supabase.from('patient_checkins').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
  ]);

  if (!patient) notFound();

  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto px-4 pb-24 pt-2 w-full">
        <Link href="/patients" className="text-xs text-slate-400 hover:text-slate-600">
          ← Patients
        </Link>

        <div className="flex items-center justify-between mt-2 mb-4">
          <div>
            <h2 className="text-lg font-semibold">{patient.name}</h2>
            <div className="text-xs text-slate-400">
              {patient.patient_code} · {[patient.age && `${patient.age}y`, patient.sex, patient.phone].filter(Boolean).join(' · ')}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {(!encounters || encounters.length === 0) ? (
              <Link
                href={`/patients/${patient.id}/encounters/new?type=new`}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-3 py-2 text-sm font-medium"
              >
                + Initial Intake
              </Link>
            ) : (
              <>
                <Link
                  href={`/patients/${patient.id}/encounters/new?type=followup`}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-sm transition"
                >
                  + Follow-up
                </Link>
                <Link
                  href={`/patients/${patient.id}/encounters/new?type=procedure`}
                  className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-sm transition"
                >
                  + Procedure
                </Link>
                <Link
                  href={`/patients/${patient.id}/encounters/new?type=new`}
                  className="text-xs text-slate-500 hover:text-slate-700 px-1 py-1"
                  title="Record full new intake"
                >
                  + New Intake
                </Link>
              </>
            )}
          </div>
        </div>

        {outcomes && outcomes.baseline_date && outcomes.latest_date && outcomes.baseline_date !== outcomes.latest_date && (
          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-2">
              Outcomes — baseline ({outcomes.baseline_date}) → latest ({outcomes.latest_date})
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <OutcomeStat label="Pain" from={outcomes.baseline_pain} to={outcomes.latest_pain} lowerIsBetter />
              <OutcomeStat label="Function" from={outcomes.baseline_function} to={outcomes.latest_function} />
              <OutcomeStat label="Mood" from={outcomes.baseline_mood} to={outcomes.latest_mood} />
              <OutcomeStat label="Sleep" from={outcomes.baseline_sleep} to={outcomes.latest_sleep} />
            </div>
            {outcomes.pain_change_pct != null && (
              <div className="text-xs text-slate-500 mt-2">
                Pain {outcomes.pain_change_pct > 0 ? 'improved' : outcomes.pain_change_pct < 0 ? 'worsened' : 'unchanged'} by {Math.abs(outcomes.pain_change_pct)}% from baseline
              </div>
            )}
          </div>
        )}

        {appointments && appointments.length > 0 && (
          <div className="mb-4">
            <div className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-2">Upcoming</div>
            <div className="space-y-2">
              {(appointments as Appointment[]).map((appt) => (
                <div key={appt.id} className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium text-slate-800">{appt.scheduled_date}</span>
                      {appt.scheduled_time && <span className="text-slate-600"> {appt.scheduled_time}</span>}{' '}
                      <span className="text-teal-700">{TYPE_LABELS[appt.appointment_type]}</span>
                      {appt.location && <span className="text-slate-500"> · {appt.location}</span>}
                    </div>
                    <div className="flex gap-2">
                      <form action={updateAppointmentStatus.bind(null, patient.id, appt.id, 'completed')}>
                        <button className="text-xs text-teal-700 hover:text-teal-900 font-medium">Done</button>
                      </form>
                      <form action={updateAppointmentStatus.bind(null, patient.id, appt.id, 'cancelled')}>
                        <button className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                      </form>
                    </div>
                  </div>
                  {appt.appointment_type === 'procedure' && (
                    <div className="mt-1.5">
                      <SendPreOpForm patientId={patient.id} appointmentId={appt.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {checkins && checkins.length > 0 && (
          <div className="mb-4">
            <div className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-2">Check-ins</div>
            <div className="space-y-2">
              {(checkins as PatientCheckin[]).map((c) => (
                <div
                  key={c.id}
                  className={`px-4 py-2.5 rounded-lg border text-sm ${
                    c.patient_global_impression === 'much_worse' || c.patient_global_impression === 'worse'
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Day-3 post-op check-in:{' '}
                  {c.patient_global_impression
                    ? c.patient_global_impression.replace(/_/g, ' ')
                    : c.sent_at ? 'awaiting response' : 'not yet sent'}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-2">Timeline</div>

        {!encounters || encounters.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No encounters recorded yet.</div>
        ) : (
          <div className="space-y-2">
            {(encounters as Encounter[]).map((enc) => (
              <details key={enc.id} className="bg-white border border-slate-200 rounded-lg px-4 py-3 group">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{enc.encounter_date}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium uppercase tracking-wide">
                      {TYPE_LABELS[enc.encounter_type] || 'New'}
                    </span>
                    {!enc.verified_at && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium uppercase tracking-wide">
                        unverified
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {enc.diagnosis || 'No diagnosis recorded'}
                    {enc.diagnosis_code && (
                      <span className="ml-1.5 font-mono text-[11px] text-slate-400">[{enc.diagnosis_code}]</span>
                    )}
                    {enc.pain_score_nrs != null && (
                      <span className="ml-2 tabular-nums font-medium text-slate-700">NRS {enc.pain_score_nrs}/10</span>
                    )}
                  </div>
                </summary>
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-sm">
                  <DetailRow label="Chief complaint" value={enc.chief_complaint} />
                  <DetailRow label="Diagnosis code" value={enc.diagnosis_code} />
                  <DetailRow label="Pain location" value={enc.pain_location} />

                  {(enc.encounter_type === 'new' || enc.encounter_type === 'followup') && (
                    <>
                      <DetailRow label="Pain mechanism" value={enc.pain_mechanism} />
                      <DetailRow label="Functional impact" value={enc.functional_impact} />
                      <DetailRow label="Red flags" value={enc.red_flags} />
                      <DetailRow label="Diagnosis confidence" value={enc.diagnosis_confidence} />
                      <DetailRow label="Imaging concordance" value={enc.imaging_concordance} />
                      <DetailRow label="Cancer pain" value={yesNo(enc.is_cancer_pain)} />
                      {enc.is_cancer_pain && (
                        <>
                          <DetailRow label="Cancer type" value={enc.cancer_type} />
                          <DetailRow label="Metastatic disease" value={yesNo(enc.metastatic_disease)} />
                          <DetailRow label="Oncologic treatment" value={enc.oncologic_treatment} />
                          <DetailRow label="Goal of care" value={enc.goal_of_care} />
                        </>
                      )}
                    </>
                  )}

                  {enc.encounter_type === 'procedure' && (
                    <>
                      <DetailRow label="Procedure category" value={enc.procedure_category} />
                      <DetailRow label="Procedure" value={enc.procedure} />
                      <DetailRow label="Level(s) / laterality" value={enc.procedure_level_laterality} />
                      <DetailRow label="Guidance used" value={enc.procedure_guidance} />
                      <DetailRow label="Drugs used" value={enc.drugs_used} />
                      <DetailRow label="Procedure intent" value={enc.procedure_intent} />
                      <DetailRow label="Immediate pain relief" value={enc.immediate_pain_relief_nrs != null ? `${enc.immediate_pain_relief_nrs}/10` : null} />
                      <DetailRow label="Immediate complications" value={enc.immediate_complications} />
                      <DetailRow label="Planned follow-up interval" value={enc.planned_followup_interval} />
                      <div className="pt-1">
                        <SendPostOpForm patientId={patient.id} encounterId={enc.id} />
                      </div>
                    </>
                  )}

                  {enc.encounter_type === 'other' && <DetailRow label="Procedure" value={enc.procedure} />}

                  {enc.encounter_type === 'followup' && (
                    <>
                      <DetailRow label="Functional change" value={enc.functional_change} />
                      <DetailRow label="Re-intervention needed" value={yesNo(enc.reintervention_needed)} />
                      <DetailRow label="Learning point" value={enc.learning_point} />
                    </>
                  )}

                  <DetailRow label="Function" value={enc.function_score_0_10} />
                  <DetailRow label="Mood" value={enc.mood_score_0_10} />
                  <DetailRow label="Sleep" value={enc.sleep_score_0_10} />
                  <DetailRow label="Quality of life" value={enc.qol_score_0_10} />
                  <DetailRow label="Widespread pain" value={yesNo(enc.widespread_pain)} />
                  <DetailRow label="Patient global impression" value={enc.patient_global_impression} />
                  <DetailRow label="Adverse event" value={enc.adverse_event} />

                  <DetailRow label="Plan" value={enc.plan} />
                  <DetailRow label="Notes" value={enc.notes} />
                  <div className="text-[11px] text-slate-400 pt-1">source: {enc.source}</div>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number | null }) {
  if (value === null || value === undefined) return null;
  return (
    <div>
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}: </span>
      <span className="text-slate-700">{String(value).replace(/_/g, ' ')}</span>
    </div>
  );
}

function yesNo(value: boolean | null): string | null {
  if (value === null) return null;
  return value ? 'Yes' : 'No';
}

function OutcomeStat({ label, from, to, lowerIsBetter = false }: {
  label: string; from: number | null; to: number | null; lowerIsBetter?: boolean;
}) {
  if (from == null || to == null) return <div />;
  const delta = to - from;
  const improved = lowerIsBetter ? delta < 0 : delta > 0;
  const worsened = lowerIsBetter ? delta > 0 : delta < 0;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`font-medium tabular-nums ${improved ? 'text-teal-700' : worsened ? 'text-rose-700' : 'text-slate-700'}`}>
        {from} → {to}
      </div>
    </div>
  );
}
