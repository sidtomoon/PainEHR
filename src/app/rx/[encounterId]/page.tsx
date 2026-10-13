import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { PatientRxToolbar } from './PatientRxToolbar';
import type { Appointment, Encounter, Patient } from '@/lib/types';

const TYPE_LABELS: Record<string, string> = {
  new: 'New Patient Intake',
  followup: 'Follow-up Consultation',
  procedure: 'Interventional Pain Procedure',
  other: 'Special Consultation',
};

export default async function PatientPrescriptionPortalPage({
  params,
}: {
  params: Promise<{ encounterId: string }>;
}) {
  const { encounterId } = await params;
  const supabase = createServiceClient();

  const { data: encounter } = await supabase
    .from('encounters')
    .select('*')
    .eq('id', encounterId)
    .single<Encounter>();

  if (!encounter) notFound();

  const [{ data: patient }, { data: appointments }] = await Promise.all([
    supabase.from('patients').select('*').eq('id', encounter.patient_id).single<Patient>(),
    supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', encounter.patient_id)
      .gte('scheduled_date', new Date().toISOString().slice(0, 10))
      .eq('status', 'scheduled')
      .order('scheduled_date', { ascending: true })
      .limit(1),
  ]);

  if (!patient) notFound();

  const nextAppointment = appointments && appointments.length > 0 ? (appointments[0] as Appointment) : null;

  const planItems = encounter.plan
    ? encounter.plan
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <PatientRxToolbar patientName={patient.name} />

        {/* Prescription Document */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 sm:p-10 text-slate-800 print:shadow-none print:border-none print:p-0 print:m-0">
          {/* Clinic Header */}
          <div className="border-b-2 border-teal-800 pb-5 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xl font-bold tracking-tight text-teal-900 block">
                  PAIN MEDICINE &amp; SPINE CLINIC
                </span>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wider mt-0.5">
                  Advanced Interventional Pain Management &amp; Rehabilitation
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Comprehensive Evaluation · Image-Guided Interventions · Multimodal Care
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                  Prescription Record
                </span>
                <p className="text-xs font-semibold text-slate-800 mt-1.5">
                  Date: {encounter.encounter_date}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  ID: {encounter.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Patient Demographics */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Patient Name</span>
                <span className="font-bold text-sm text-slate-900">{patient.name}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Patient Code</span>
                <span className="font-mono font-semibold text-slate-800">{patient.patient_code}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Age / Sex</span>
                <span className="font-semibold text-slate-800">
                  {[patient.age && `${patient.age} Y`, patient.sex].filter(Boolean).join(' / ') || '—'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Consultation Type</span>
                <span className="font-semibold text-teal-800">
                  {TYPE_LABELS[encounter.encounter_type] || 'Consultation'}
                </span>
              </div>
            </div>
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
                <p className="font-semibold text-slate-800 mt-0.5">{encounter.chief_complaint || 'Pain Consultation'}</p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Pain Score (NRS):</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {encounter.pain_score_nrs != null ? `${encounter.pain_score_nrs} / 10` : 'Not recorded'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Location &amp; Mechanism:</span>
                <p className="font-semibold text-slate-800 mt-0.5 capitalize">
                  {[encounter.pain_location, encounter.pain_mechanism].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Procedure Details if applicable */}
          {encounter.encounter_type === 'procedure' && (
            <div className="mb-6 bg-teal-50/50 border border-teal-200 rounded-lg p-4 text-xs">
              <span className="text-teal-900 font-bold uppercase text-[11px] mb-2 block tracking-wide">
                💉 Interventional Procedure Performed
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 font-medium">Procedure:</span>
                  <p className="font-bold text-slate-900">{encounter.procedure || 'Interventional Block'}</p>
                </div>
                {encounter.procedure_level_laterality && (
                  <div>
                    <span className="text-slate-400 font-medium">Level / Side:</span>
                    <p className="font-semibold text-slate-800">{encounter.procedure_level_laterality}</p>
                  </div>
                )}
                {encounter.drugs_used && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 font-medium">Medications Administered:</span>
                    <p className="font-semibold text-slate-800">{encounter.drugs_used}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ℞ Prescription & Treatment Plan */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl font-serif font-black text-teal-800 italic">℞</span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Medications &amp; Treatment Plan
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
                <p className="text-xs text-slate-400 italic">No specific medications prescribed.</p>
              )}

              {encounter.notes && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Advice &amp; Instructions:
                  </span>
                  <p className="text-xs text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
                    {encounter.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Patient-Facing Interactive Guided Therapy Cards */}
          <div className="no-print mb-6 bg-gradient-to-br from-teal-50 to-blue-50/40 border border-teal-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🧘</span>
              <div>
                <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">
                  Your Guided Digital Management Therapies
                </h4>
                <p className="text-[11px] text-teal-800">
                  You can perform these interactive guided sessions anytime from your phone or computer:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
              <Link
                href="/modalities/prt"
                className="bg-white hover:bg-teal-50 border border-teal-200 rounded-lg p-2.5 text-center shadow-2xs transition"
              >
                <span className="block font-bold text-xs text-teal-900">PRT</span>
                <span className="block text-[10px] text-slate-500">Somatic Tracking</span>
                <span className="text-[10px] text-teal-700 font-semibold block mt-1">Start Exercise →</span>
              </Link>

              <Link
                href="/modalities/graded-pt"
                className="bg-white hover:bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-center shadow-2xs transition"
              >
                <span className="block font-bold text-xs text-blue-900">Graded PT</span>
                <span className="block text-[10px] text-slate-500">Movement Timer</span>
                <span className="text-[10px] text-blue-700 font-semibold block mt-1">Start Routine →</span>
              </Link>

              <Link
                href="/modalities/act"
                className="bg-white hover:bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-center shadow-2xs transition"
              >
                <span className="block font-bold text-xs text-amber-900">ACT</span>
                <span className="block text-[10px] text-slate-500">Values &amp; Defusion</span>
                <span className="text-[10px] text-amber-800 font-semibold block mt-1">Start Session →</span>
              </Link>

              <Link
                href="/modalities/yoga"
                className="bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center shadow-2xs transition"
              >
                <span className="block font-bold text-xs text-emerald-900">CLBP Yoga</span>
                <span className="block text-[10px] text-slate-500">Breathing Pacer</span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-1">Start Practice →</span>
              </Link>

              <Link
                href="/modalities/cbt-i"
                className="bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 text-center shadow-2xs transition col-span-2 sm:col-span-1"
              >
                <span className="block font-bold text-xs text-indigo-900">CBT-I</span>
                <span className="block text-[10px] text-slate-500">Sleep Calculator</span>
                <span className="text-[10px] text-indigo-700 font-semibold block mt-1">Check Sleep →</span>
              </Link>
            </div>
          </div>

          {/* Precautions */}
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 leading-normal">
            <span className="font-bold text-slate-700 uppercase">Precautions:</span>{' '}
            Please contact clinic or emergency care immediately if you develop fever, progressive leg/arm weakness, numbness, or loss of bladder/bowel control.
          </div>

          {/* Follow-up / Review */}
          <div className="flex items-center justify-between border-t border-b border-slate-200 py-3 mb-8 text-xs">
            <div>
              <span className="font-bold text-slate-500 uppercase text-[10px]">Next Review / Appointment:</span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {nextAppointment ? (
                  <>
                    Scheduled on <strong className="text-teal-700">{nextAppointment.scheduled_date}</strong>
                    {nextAppointment.scheduled_time ? ` at ${nextAppointment.scheduled_time}` : ''}
                  </>
                ) : (
                  encounter.planned_followup_interval || 'As advised or SOS if pain worsens'
                )}
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              Pain OPD Hours: 09:00 AM – 05:00 PM
            </div>
          </div>

          {/* Signature */}
          <div className="pt-4 flex justify-between items-end text-xs text-slate-600">
            <div>
              <p className="text-[10px] text-slate-400">Official Electronic Prescription</p>
              <p className="text-[10px] text-slate-400 font-mono">
                Verified: {new Date().toISOString().slice(0, 10)}
              </p>
            </div>
            <div className="text-right">
              <div className="w-40 border-b border-slate-400 mb-1 ml-auto"></div>
              <p className="font-bold text-slate-900 text-sm">Consultant Pain Specialist</p>
              <p className="text-[10px] text-slate-500">Department of Pain Medicine</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
