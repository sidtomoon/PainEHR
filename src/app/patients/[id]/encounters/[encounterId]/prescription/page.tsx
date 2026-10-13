import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PrescriptionPrintButton } from './PrescriptionPrintButton';
import type { Appointment, Encounter, Patient } from '@/lib/types';

const TYPE_LABELS: Record<string, string> = {
  new: 'New Patient Intake',
  followup: 'Follow-up Consultation',
  procedure: 'Interventional Pain Procedure',
  other: 'Special Consultation',
};

export default async function PrescriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; encounterId: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id: patientId, encounterId } = await params;
  const { created } = await searchParams;
  const isNew = created === 'true';

  const supabase = await createClient();

  const [{ data: patient }, { data: encounter }, { data: appointments }] = await Promise.all([
    supabase.from('patients').select('*').eq('id', patientId).single<Patient>(),
    supabase.from('encounters').select('*').eq('id', encounterId).eq('patient_id', patientId).single<Encounter>(),
    supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .gte('scheduled_date', new Date().toISOString().slice(0, 10))
      .eq('status', 'scheduled')
      .order('scheduled_date', { ascending: true })
      .limit(1),
  ]);

  if (!patient || !encounter) {
    notFound();
  }

  const nextAppointment = appointments && appointments.length > 0 ? (appointments[0] as Appointment) : null;

  // Build summary text for quick copy
  const summaryLines = [
    `PAIN CLINIC PRESCRIPTION & ENCOUNTER SUMMARY`,
    `Date: ${encounter.encounter_date}`,
    `Patient: ${patient.name} (${patient.age || '—'}y, ${patient.sex || '—'}), ID: ${patient.patient_code}`,
    encounter.diagnosis ? `Diagnosis: ${encounter.diagnosis} ${encounter.diagnosis_code ? `[${encounter.diagnosis_code}]` : ''}` : '',
    encounter.pain_score_nrs != null ? `Pain Score (NRS): ${encounter.pain_score_nrs}/10 (${encounter.pain_location || 'unspecified'})` : '',
    encounter.procedure ? `Procedure: ${encounter.procedure}` : '',
    encounter.plan ? `\nRx / Treatment Plan:\n${encounter.plan}` : '',
    encounter.notes ? `\nInstructions & Advice:\n${encounter.notes}` : '',
    nextAppointment ? `\nNext Review: ${nextAppointment.scheduled_date} ${nextAppointment.scheduled_time || ''}` : '',
  ].filter(Boolean).join('\n');

  // Format plan into line items if multiline
  const planItems = encounter.plan
    ? encounter.plan
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <PrescriptionPrintButton
          patientId={patient.id}
          encounterId={encounter.id}
          patientPhone={patient.phone}
          patientName={patient.name}
          summaryText={summaryLines}
          isNewEncounter={isNew}
        />

        {/* Printable Prescription Sheet */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 sm:p-10 text-slate-800 print:shadow-none print:border-none print:p-0 print:m-0">
          {/* Clinic Header */}
          <div className="border-b-2 border-teal-800 pb-5 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tracking-tight text-teal-900">
                    PAIN MEDICINE &amp; SPINE CLINIC
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wider mt-0.5">
                  Advanced Interventional Pain Management &amp; Palliative Care
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Comprehensive Evaluation · Image-Guided Interventions · Multimodal Analgesia
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                  OPD Prescription &amp; Record
                </span>
                <p className="text-xs font-semibold text-slate-800 mt-1.5">
                  Date: {encounter.encounter_date}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Enc ID: {encounter.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Patient Demographics Box */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Patient Name</span>
                <span className="font-bold text-sm text-slate-900">{patient.name}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">UHID / Patient Code</span>
                <span className="font-mono font-semibold text-slate-800">{patient.patient_code}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Age / Sex</span>
                <span className="font-semibold text-slate-800">
                  {[patient.age && `${patient.age} Y`, patient.sex].filter(Boolean).join(' / ') || '—'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Encounter Type</span>
                <span className="font-semibold text-teal-800">
                  {TYPE_LABELS[encounter.encounter_type] || 'Consultation'}
                </span>
              </div>
            </div>

            {patient.phone && (
              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>Contact: {patient.phone}</span>
                <span>Verified: {encounter.verified_at ? new Date(encounter.verified_at).toLocaleDateString() : 'Yes'}</span>
              </div>
            )}
          </div>

          {/* Clinical Assessment */}
          <div className="mb-6 space-y-3">
            <div className="border-l-4 border-teal-600 pl-3">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Clinical Diagnosis</span>
              <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                <span className="text-base font-bold text-slate-900">
                  {encounter.diagnosis || 'Clinical evaluation completed'}
                </span>
                {encounter.diagnosis_code && (
                  <span className="text-xs font-mono font-semibold bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                    ICD-11: {encounter.diagnosis_code}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white rounded-lg p-3 border border-slate-200">
              <div>
                <span className="text-slate-400 font-medium">Chief Complaint:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {encounter.chief_complaint || 'Pain Consultation'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Pain Severity (NRS):</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {encounter.pain_score_nrs != null ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-sm font-bold text-teal-700">{encounter.pain_score_nrs} / 10</span>
                      <span className="text-[10px] text-slate-500">
                        ({encounter.pain_score_nrs >= 7 ? 'Severe' : encounter.pain_score_nrs >= 4 ? 'Moderate' : 'Mild'})
                      </span>
                    </span>
                  ) : (
                    'Not specified'
                  )}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Location &amp; Mechanism:</span>
                <p className="font-semibold text-slate-800 mt-0.5 capitalize">
                  {[encounter.pain_location, encounter.pain_mechanism].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
            </div>

            {/* Red flags or pertinent history */}
            {(encounter.past_history || encounter.red_flags) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {encounter.past_history && (
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Medical History / Comorbidities:</span>
                    <p className="text-slate-700 mt-0.5 whitespace-pre-line">{encounter.past_history}</p>
                  </div>
                )}
                {encounter.red_flags && (
                  <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-amber-900">
                    <span className="font-bold uppercase text-[10px]">Red Flags Screened:</span>
                    <p className="mt-0.5">{encounter.red_flags}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Procedure Record (If Procedure Encounter) */}
          {encounter.encounter_type === 'procedure' && (
            <div className="mb-6 bg-teal-50/50 border border-teal-200 rounded-lg p-4 text-xs">
              <div className="flex items-center gap-1.5 text-teal-900 font-bold uppercase text-[11px] mb-2 tracking-wide">
                <span>💉 Interventional Procedure Performed</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 font-medium">Procedure Name:</span>
                  <p className="font-bold text-slate-900">{encounter.procedure || 'Interventional Pain Block'}</p>
                </div>
                {encounter.procedure_category && (
                  <div>
                    <span className="text-slate-400 font-medium">Category:</span>
                    <p className="font-semibold text-slate-800 capitalize">{encounter.procedure_category.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {encounter.procedure_level_laterality && (
                  <div>
                    <span className="text-slate-400 font-medium">Level / Laterality:</span>
                    <p className="font-semibold text-slate-800">{encounter.procedure_level_laterality}</p>
                  </div>
                )}
                {encounter.procedure_guidance && (
                  <div>
                    <span className="text-slate-400 font-medium">Imaging Guidance:</span>
                    <p className="font-semibold text-slate-800 uppercase">{encounter.procedure_guidance}</p>
                  </div>
                )}
                {encounter.drugs_used && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 font-medium">Drugs &amp; Injectates:</span>
                    <p className="font-semibold text-slate-800">{encounter.drugs_used}</p>
                  </div>
                )}
                {encounter.immediate_pain_relief_nrs != null && (
                  <div>
                    <span className="text-slate-400 font-medium">Post-procedure NRS:</span>
                    <p className="font-bold text-teal-700">{encounter.immediate_pain_relief_nrs} / 10</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rx — Medications & Treatment Plan */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl font-serif font-black text-teal-800 italic">℞</span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Medication Prescription &amp; Treatment Plan
              </h3>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/40">
              {planItems.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {planItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-teal-600 font-bold mt-0.5">•</span>
                      <span className="font-medium text-slate-800 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">No specific medications prescribed for this encounter.</p>
              )}

              {/* Special Clinical Instructions / Notes */}
              {encounter.notes && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <span>📋</span> Advice, Physiotherapy &amp; Lifestyle Instructions:
                  </span>
                  <div className="space-y-1 text-xs text-slate-700 leading-relaxed">
                    {encounter.notes.split('\n').map((line, idx) => {
                      const trimmed = line.trim();
                      if (!trimmed) return <div key={idx} className="h-1" />;
                      if (trimmed.startsWith('📋') || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                        return (
                          <p key={idx} className="font-bold text-teal-950 mt-2.5 mb-1 text-[11px] uppercase tracking-wide border-b border-teal-200/60 pb-0.5">
                            {trimmed}
                          </p>
                        );
                      }
                      if (trimmed.startsWith('⚠️')) {
                        return (
                          <p key={idx} className="text-rose-900 font-semibold bg-rose-50 px-2 py-1 rounded border border-rose-200 my-1">
                            {trimmed}
                          </p>
                        );
                      }
                      if (trimmed.startsWith('•')) {
                        return (
                          <p key={idx} className="pl-1.5 flex items-start gap-1.5 my-0.5">
                            <span className="text-teal-600 font-bold">•</span>
                            <span>{trimmed.slice(1).trim()}</span>
                          </p>
                        );
                      }
                      return <p key={idx}>{trimmed}</p>;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Precautions / Emergency Red Flag Advice */}
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 leading-normal">
            <span className="font-bold text-slate-700 uppercase">Emergency / Precautions:</span>{' '}
            Please report immediately to the emergency department or contact clinic if you experience: fever, severe worsening pain, numbness/weakness in limbs, or loss of bowel/bladder control.
          </div>

          {/* Follow-up & Review */}
          <div className="flex items-center justify-between border-t border-b border-slate-200 py-3 mb-10 text-xs">
            <div>
              <span className="font-bold text-slate-500 uppercase text-[10px]">Follow-up / Review:</span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {nextAppointment ? (
                  <>
                    Scheduled on <strong className="text-teal-700">{nextAppointment.scheduled_date}</strong>
                    {nextAppointment.scheduled_time ? ` at ${nextAppointment.scheduled_time}` : ''}
                    {nextAppointment.location ? ` (${nextAppointment.location})` : ''}
                  </>
                ) : encounter.planned_followup_interval ? (
                  `Review after ${encounter.planned_followup_interval} or SOS if pain worsens`
                ) : (
                  'As advised / SOS if symptoms persist'
                )}
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              Pain OPD Hours: 09:00 AM – 05:00 PM
            </div>
          </div>

          {/* Signature Block */}
          <div className="pt-6 flex justify-between items-end text-xs text-slate-600">
            <div>
              <p className="text-[10px] text-slate-400">Generated from PainEHR Electronic Record</p>
              <p className="text-[10px] text-slate-400 font-mono">
                Prescription Verified · {new Date().toISOString().slice(0, 16).replace('T', ' ')}
              </p>
            </div>

            <div className="text-right">
              <div className="w-44 border-b border-slate-400 mb-1.5 ml-auto"></div>
              <p className="font-bold text-slate-900 text-sm">Consultant Pain Specialist</p>
              <p className="text-[11px] text-slate-500">Dept. of Pain Medicine &amp; Spine Interventions</p>
              <p className="text-[10px] text-slate-400">Regn. No: Reg-PainMed-India</p>
            </div>
          </div>
        </div>

        <div className="no-print mt-6 text-center text-xs text-slate-400 pb-12">
          <Link href={`/patients/${patient.id}`} className="text-teal-600 hover:text-teal-700 font-medium">
            ← Return to Patient Encounter Timeline
          </Link>
        </div>
      </div>
    </div>
  );
}
