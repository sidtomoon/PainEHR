'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Patient, Appointment, AppointmentType } from '@/lib/types';

type AppointmentWithPatient = Appointment & {
  patient: Patient;
};

interface Props {
  patients: Patient[];
  todayAppointments: AppointmentWithPatient[];
  initialSearch: string;
}

const TYPE_CONFIG: Record<
  AppointmentType,
  { label: string; badgeClass: string }
> = {
  followup: { label: 'Follow-up', badgeClass: 'bg-teal-50 text-teal-700 border-teal-200' },
  procedure: { label: 'Procedure', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export function PatientsDirectoryWithQueue({
  patients,
  todayAppointments,
  initialSearch,
}: Props) {
  // Default to today's queue if there are appointments scheduled today and no active search
  const [activeTab, setActiveTab] = useState<'queue' | 'all'>(
    todayAppointments.length > 0 && !initialSearch ? 'queue' : 'all'
  );
  const [search, setSearch] = useState(initialSearch);

  const filteredPatients = patients.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      p.patient_code.toLowerCase().includes(s) ||
      (p.phone && p.phone.includes(s))
    );
  });

  return (
    <div>
      {/* Top Controls: Search Bar + New Patient Button */}
      <div className="flex items-center gap-2 mb-3 mt-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value.trim() && activeTab !== 'all') {
                setActiveTab('all');
              }
            }}
            placeholder="Search by UID, name, or phone…"
            className="w-full pl-3 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-900"
          />
        </div>
        <Link
          href="/patients/new"
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap shrink-0 shadow-xs transition"
        >
          + New Patient
        </Link>
      </div>

      {/* Segmented Tab Switcher (Eka Care OPD Queue vs All Patients) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-lg border border-slate-200 mb-3 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-1.5 px-3 rounded-md transition flex items-center justify-center gap-1.5 ${
            activeTab === 'queue'
              ? 'bg-white text-teal-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📋 Today&apos;s OPD Queue</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              todayAppointments.length > 0
                ? 'bg-teal-100 text-teal-800 font-bold'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {todayAppointments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-1.5 px-3 rounded-md transition flex items-center justify-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>👥 All Patients</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-600">
            {filteredPatients.length}
          </span>
        </button>
      </div>

      {/* ── TAB 1: TODAY'S OPD QUEUE ── */}
      {activeTab === 'queue' && (
        <div>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white border border-dashed border-slate-200 rounded-xl">
              <span className="text-2xl">☕</span>
              <p className="text-sm font-medium text-slate-700 mt-2">
                No patients scheduled for today.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Patients with appointments scheduled for today will automatically line up here with token numbers.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="mt-3 inline-flex items-center text-xs font-semibold text-teal-700 hover:text-teal-900 underline"
              >
                Browse All Patients Directory →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayAppointments.map((appt, idx) => {
                const conf = TYPE_CONFIG[appt.appointment_type] || {
                  label: 'Visit',
                  badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
                };
                const p = appt.patient;
                const isCompleted = appt.status === 'completed';

                return (
                  <div
                    key={appt.id}
                    className={`bg-white border rounded-xl p-3.5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCompleted
                        ? 'border-slate-200 opacity-60 bg-slate-50/50'
                        : 'border-slate-300 shadow-xs hover:border-teal-400'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Token # */}
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs">
                        #{idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/patients/${p.id}`}
                            className="font-bold text-sm text-slate-900 hover:text-teal-700 transition"
                          >
                            {p.name}
                          </Link>
                          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            {p.patient_code}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${conf.badgeClass}`}
                          >
                            {conf.label}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                          {appt.scheduled_time && (
                            <span className="font-medium text-slate-700">
                              🕒 {appt.scheduled_time}
                            </span>
                          )}
                          <span>·</span>
                          <span>
                            {[p.age && `${p.age}y`, p.sex, p.phone].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {!isCompleted ? (
                        <Link
                          href={`/patients/${p.id}/encounters/new?type=${appt.appointment_type}`}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg px-3 py-1.5 text-xs shadow-xs transition inline-flex items-center gap-1"
                        >
                          <span>Start Visit</span>
                          <span>→</span>
                        </Link>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                          ✓ Completed
                        </span>
                      )}

                      <Link
                        href={`/patients/${p.id}`}
                        className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1"
                      >
                        Chart
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ALL REGISTERED PATIENTS ── */}
      {activeTab === 'all' && (
        <div>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              {search
                ? `No patients matching "${search}".`
                : 'No patients yet. Add your first one to get started.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPatients.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <Link href={`/patients/${p.id}`} className="group flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 group-hover:text-teal-700 transition">
                        {p.name}
                      </span>
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {p.patient_code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {[p.age && `${p.age}y`, p.sex, p.phone].filter(Boolean).join(' · ')}
                    </div>
                  </Link>

                  <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <Link
                      href={`/patients/${p.id}/encounters/new?type=followup`}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition"
                    >
                      + Follow-up
                    </Link>
                    <Link
                      href={`/patients/${p.id}/encounters/new?type=procedure`}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-800 text-white hover:bg-slate-900 shadow-xs transition"
                    >
                      + Procedure
                    </Link>
                    <Link
                      href={`/patients/${p.id}`}
                      className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 font-medium transition"
                    >
                      Chart →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
