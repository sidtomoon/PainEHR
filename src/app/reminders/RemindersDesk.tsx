'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { Appointment, Patient, AppointmentType } from '@/lib/types';
import { markReminderSent } from './actions';

type AppointmentWithPatient = Appointment & {
  patient: Patient;
};

interface Props {
  initialAppointments: AppointmentWithPatient[];
  todayDateStr: string;
  tomorrowDateStr: string;
}

const TYPE_LABELS: Record<AppointmentType, string> = {
  followup: 'Follow-up',
  procedure: 'Procedure',
};

export function RemindersDesk({
  initialAppointments,
  todayDateStr,
  tomorrowDateStr,
}: Props) {
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>(initialAppointments);
  const [filter, setFilter] = useState<'tomorrow' | 'today' | 'all'>('tomorrow');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = appointments.filter((appt) => {
    if (filter === 'tomorrow') return appt.scheduled_date === tomorrowDateStr;
    if (filter === 'today') return appt.scheduled_date === todayDateStr;
    return true;
  });

  const sentCount = filtered.filter((a) => !!a.reminder_sent_at).length;
  const pendingCount = filtered.length - sentCount;

  const buildReminderText = (appt: AppointmentWithPatient) => {
    const p = appt.patient;
    const typeLabel = TYPE_LABELS[appt.appointment_type] || 'Consultation';
    const timeStr = appt.scheduled_time ? ` at ${appt.scheduled_time}` : '';
    const locStr = appt.location ? `\nLocation: ${appt.location}` : '';

    return `Hello ${p.name}, this is a friendly reminder for your upcoming *${typeLabel}* visit at Dr. Varun's Pain Clinic on *${appt.scheduled_date}*${timeStr}.${locStr}\n\nPlease bring any recent MRI/X-ray films and your current medication list.\nIf you need to reschedule or have any queries, please reply to this message.`;
  };

  const handleSendWhatsApp = (appt: AppointmentWithPatient) => {
    const p = appt.patient;
    if (!p.phone) {
      alert(`Patient ${p.name} does not have a phone number on file.`);
      return;
    }

    const cleanPhone = p.phone.replace(/[^0-9]/g, '');
    const phoneParam = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = buildReminderText(appt);

    const url = `https://wa.me/${phoneParam}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    // Optimistically update reminder status
    setAppointments((prev) =>
      prev.map((item) =>
        item.id === appt.id
          ? { ...item, reminder_sent_at: new Date().toISOString() }
          : item
      )
    );

    // Persist to database
    startTransition(async () => {
      await markReminderSent(appt.id);
    });
  };

  const handleCopyText = (appt: AppointmentWithPatient) => {
    const msg = buildReminderText(appt);
    navigator.clipboard.writeText(msg);
    setCopiedId(appt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-xl p-4 shadow-sm border border-emerald-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📲</span>
              <h2 className="text-base font-bold tracking-tight">
                Free 1-Click WhatsApp Reminders Desk
              </h2>
            </div>
            <p className="text-xs text-emerald-200 mt-1 max-w-xl">
              Dispatch personalized appointment reminders directly to patients from your clinic WhatsApp with 1 click. Zero Meta API fees, zero phone bans.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 bg-emerald-950/60 border border-emerald-700/60 rounded-lg px-3 py-2 text-center text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-300">Pending</div>
              <div className="text-base font-bold text-amber-300">{pendingCount}</div>
            </div>
            <div className="w-px h-6 bg-emerald-800" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-300">Sent</div>
              <div className="text-base font-bold text-emerald-300">{sentCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('tomorrow')}
            className={`py-1.5 px-3 rounded-md transition ${
              filter === 'tomorrow'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tomorrow ({tomorrowDateStr})
          </button>
          <button
            type="button"
            onClick={() => setFilter('today')}
            className={`py-1.5 px-3 rounded-md transition ${
              filter === 'today'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today ({todayDateStr})
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`py-1.5 px-3 rounded-md transition ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Upcoming ({appointments.length})
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Showing {filtered.length} patients
        </div>
      </div>

      {/* Appointment Cards List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-xl">
          <span className="text-2xl">☕</span>
          <p className="text-sm font-semibold text-slate-700 mt-2">
            No scheduled appointments found for this filter.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Appointments scheduled in the calendar will automatically show up here for reminders.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((appt) => {
            const p = appt.patient;
            const isSent = !!appt.reminder_sent_at;
            const typeLabel = TYPE_LABELS[appt.appointment_type] || 'Appointment';

            return (
              <div
                key={appt.id}
                className={`bg-white border rounded-xl p-3.5 transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isSent
                    ? 'border-slate-200 bg-slate-50/50'
                    : 'border-slate-300 shadow-xs hover:border-emerald-400'
                }`}
              >
                {/* Left: Patient and Appointment Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/patients/${p.id}`}
                      className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition"
                    >
                      {p.name}
                    </Link>
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {p.patient_code}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                      {typeLabel}
                    </span>
                    {isSent ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <span>✓ Reminded</span>
                        <span className="font-mono text-[9px] text-emerald-600">
                          ({new Date(appt.reminder_sent_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-800">
                      📅 {appt.scheduled_date}
                    </span>
                    {appt.scheduled_time && (
                      <span className="font-medium text-slate-800">
                        🕒 {appt.scheduled_time}
                      </span>
                    )}
                    {appt.location && (
                      <span className="text-slate-500">
                        📍 {appt.location}
                      </span>
                    )}
                    <span>·</span>
                    <span className="font-mono text-slate-700">
                      📞 {p.phone || 'No phone on file'}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleCopyText(appt)}
                    className="text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg font-medium transition"
                  >
                    {copiedId === appt.id ? '✓ Copied' : 'Copy Text'}
                  </button>

                  <button
                    type="button"
                    disabled={!p.phone}
                    onClick={() => handleSendWhatsApp(appt)}
                    className={`inline-flex items-center gap-1.5 font-semibold text-xs px-3.5 py-1.5 rounded-lg transition shadow-xs ${
                      isSent
                        ? 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                    title={p.phone ? 'Open WhatsApp with pre-filled message' : 'Patient has no phone'}
                  >
                    <span>📲</span>
                    <span>{isSent ? 'Re-send WhatsApp' : 'Send WhatsApp'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
