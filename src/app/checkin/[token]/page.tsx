import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { CheckinForm } from './CheckinForm';

export default async function CheckinPage({ params }: PageProps<'/checkin/[token]'>) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: checkin } = await supabase
    .from('patient_checkins')
    .select('id, responded_at, patients(name)')
    .eq('token', token)
    .maybeSingle();

  if (!checkin) notFound();

  const patient = Array.isArray(checkin.patients) ? checkin.patients[0] : checkin.patients;

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-lg p-6">
        <h1 className="text-lg font-semibold text-slate-800 mb-1">PainEHR check-in</h1>
        {checkin.responded_at ? (
          <p className="text-sm text-teal-700 mt-3">Thank you — we&apos;ve already recorded your response.</p>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-4">
              Hi {patient?.name || 'there'} — how are you feeling since your procedure, compared to before it?
            </p>
            <CheckinForm token={token} />
          </>
        )}
      </div>
    </div>
  );
}
