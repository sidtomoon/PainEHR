import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { CheckinForm } from './CheckinForm';

export default async function CheckinPage({ params }: PageProps<'/checkin/[token]'>) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: checkin } = await supabase
    .from('patient_checkins')
    .select('id, responded_at, source_encounter_id, patients(name)')
    .eq('token', token)
    .maybeSingle();

  if (!checkin) notFound();

  const patient = Array.isArray(checkin.patients) ? checkin.patients[0] : checkin.patients;

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4 py-8">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900 mb-1">Pain Clinic Patient Portal</h1>
        {checkin.responded_at ? (
          <p className="text-sm text-teal-700 mt-2 font-medium">
            ✅ Thank you — we&apos;ve recorded your recovery response.
          </p>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-4">
              Hi {patient?.name || 'there'} — how are you feeling since your consultation / procedure, compared to before it?
            </p>
            <CheckinForm token={token} />
          </>
        )}

        {/* Prescription Access */}
        {checkin.source_encounter_id && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link
              href={`/rx/${checkin.source_encounter_id}`}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 py-2.5 px-3 rounded-lg transition shadow-2xs"
            >
              <span>📄</span>
              <span>View &amp; Download Your Prescription PDF</span>
            </Link>
          </div>
        )}

        {/* Guided Home Therapies */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <span className="font-bold text-slate-700 block mb-1.5 uppercase text-[10px] tracking-wide">
            🧘 Guided Non-Invasive Therapies:
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-center">
            <Link
              href="/modalities/prt"
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-teal-50 text-[11px] font-semibold text-teal-900 transition"
            >
              PRT Somatic Tracking
            </Link>
            <Link
              href="/modalities/graded-pt"
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 text-[11px] font-semibold text-blue-900 transition"
            >
              Graded PT Pacing
            </Link>
            <Link
              href="/modalities/act"
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-amber-50 text-[11px] font-semibold text-amber-900 transition"
            >
              ACT Values Check
            </Link>
            <Link
              href="/modalities/yoga"
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-emerald-50 text-[11px] font-semibold text-emerald-900 transition"
            >
              CLBP Yoga &amp; Breath
            </Link>
            <Link
              href="/modalities/cbt-i"
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-indigo-50 text-[11px] font-semibold text-indigo-900 col-span-2 transition"
            >
              CBT-I Sleep Calculator &amp; Pacing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
