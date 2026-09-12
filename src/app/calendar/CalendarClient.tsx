'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  createAppointment, updateAppointmentStatus, rescheduleAppointment, deleteAppointment,
  createDoctorLeave, deleteDoctorLeave,
} from './actions';
import type { AppointmentStatus, AppointmentType, AppointmentWithPatient, DoctorLeave, LeaveType, Patient } from '@/lib/types';

interface CalendarClientProps {
  initialAppointments: AppointmentWithPatient[];
  initialDoctorLeaves: DoctorLeave[];
  patients: Pick<Patient, 'id' | 'name' | 'patient_code' | 'phone'>[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarClient({
  initialAppointments,
  initialDoctorLeaves,
  patients,
}: CalendarClientProps) {
  const [isPending, startTransition] = useTransition();

  const todayStr = new Date().toISOString().slice(0, 10);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Modals
  const [showBookModal, setShowBookModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentWithPatient | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'followup' | 'procedure' | 'leaves'>('all');

  // Month navigation
  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function goToToday() {
    const d = new Date();
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
    setSelectedDate(todayStr);
  }

  // Generate calendar days for the current month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Day of week: 0 is Sun, 1 is Mon... convert so Mon is 0, Sun is 6
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const calendarCells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Trailing previous month days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const m = currentMonth === 0 ? 12 : currentMonth;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum: day, isCurrentMonth: false });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum: day, isCurrentMonth: true });
  }

  // Leading next month days to complete grid (multiples of 7)
  const remaining = 7 - (calendarCells.length % 7);
  if (remaining < 7) {
    for (let day = 1; day <= remaining; day++) {
      const m = currentMonth === 11 ? 1 : currentMonth + 2;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      calendarCells.push({ dateStr, dayNum: day, isCurrentMonth: false });
    }
  }

  // Filter appointments
  const filteredAppointments = initialAppointments.filter((app) => {
    if (filterType === 'all') return true;
    if (filterType === 'followup') return app.appointment_type === 'followup';
    if (filterType === 'procedure') return app.appointment_type === 'procedure';
    return false;
  });

  // Doctor leaves check
  function getLeavesForDate(dateStr: string): DoctorLeave[] {
    if (filterType === 'followup' || filterType === 'procedure') return [];
    return initialDoctorLeaves.filter((l) => l.start_date <= dateStr && l.end_date >= dateStr);
  }

  function getAppointmentsForDate(dateStr: string): AppointmentWithPatient[] {
    if (filterType === 'leaves') return [];
    return filteredAppointments.filter((app) => app.scheduled_date === dateStr);
  }

  // Details for selected date
  const selectedDayAppointments = getAppointmentsForDate(selectedDate).sort((a, b) =>
    (a.scheduled_time || '00:00').localeCompare(b.scheduled_time || '00:00'),
  );
  const selectedDayLeaves = getLeavesForDate(selectedDate);

  // Status toggle handler
  function handleStatusChange(appointmentId: string, newStatus: AppointmentStatus) {
    startTransition(async () => {
      await updateAppointmentStatus(appointmentId, newStatus);
    });
  }

  // Delete booking handler
  function handleDeleteBooking(appointmentId: string) {
    if (!confirm('Are you sure you want to cancel and remove this booking?')) return;
    startTransition(async () => {
      await deleteAppointment(appointmentId);
    });
  }

  // Delete leave handler
  function handleDeleteLeave(leaveId: string) {
    if (!confirm('Remove this doctor leave / schedule block?')) return;
    startTransition(async () => {
      await deleteDoctorLeave(leaveId);
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-24 pt-3 w-full">
      {/* ── Top Bar: Header & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Clinic Calendar</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              OPD & Procedure CRM
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage patient appointments, procedure slots, and doctor availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLeaveModal(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition flex items-center gap-1.5"
          >
            <span>🏖️</span>
            <span>+ Mark Doctor Leave</span>
          </button>
          <button
            onClick={() => setShowBookModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition flex items-center gap-1.5"
          >
            <span>📅</span>
            <span>+ Book Appointment</span>
          </button>
        </div>
      </div>

      {/* ── Calendar Controls: Month Navigation & Filter Pills ── */}
      <div className="bg-white border border-slate-200 rounded-t-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={prevMonth}
              className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-white rounded hover:shadow-xs transition"
              title="Previous Month"
            >
              ‹
            </button>
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded hover:shadow-xs transition"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-white rounded hover:shadow-xs transition"
              title="Next Month"
            >
              ›
            </button>
          </div>
          <h2 className="text-base font-bold text-slate-800">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium text-slate-400 mr-1">Filter:</span>
          {(['all', 'followup', 'procedure', 'leaves'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-2.5 py-1 text-xs rounded-md transition font-medium capitalize ${
                filterType === f
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {f === 'leaves' ? 'Doctor Leaves' : f === 'all' ? 'All Bookings' : f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Month Grid ── */}
      <div className="bg-white border-x border-b border-slate-200 rounded-b-xl overflow-hidden shadow-sm">
        {/* Day Name Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center">
          {DAY_NAMES.map((name, i) => (
            <div
              key={name}
              className={`py-2 text-[11px] font-semibold tracking-wider uppercase ${
                i >= 5 ? 'text-slate-400 bg-slate-100/40' : 'text-slate-600'
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
          {calendarCells.map((cell) => {
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDate;
            const dayAppointments = getAppointmentsForDate(cell.dateStr);
            const dayLeaves = getLeavesForDate(cell.dateStr);

            return (
              <div
                key={cell.dateStr}
                onClick={() => setSelectedDate(cell.dateStr)}
                className={`min-h-[90px] sm:min-h-[110px] p-1.5 transition cursor-pointer flex flex-col justify-between ${
                  !cell.isCurrentMonth
                    ? 'bg-slate-50/50 text-slate-300'
                    : isSelected
                    ? 'bg-teal-50/40 ring-2 ring-inset ring-teal-500'
                    : isToday
                    ? 'bg-amber-50/30'
                    : 'bg-white hover:bg-slate-50/60'
                }`}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                      isToday
                        ? 'bg-teal-600 text-white shadow-xs'
                        : isSelected
                        ? 'text-teal-900 font-bold'
                        : cell.isCurrentMonth
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {/* Dot counters for small screens */}
                  <div className="flex items-center gap-0.5 sm:hidden">
                    {dayLeaves.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                    {dayAppointments.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />}
                  </div>
                </div>

                {/* Day Content Badges (Desktop & Tablet) */}
                <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                  {/* Doctor Leaves Banner */}
                  {dayLeaves.map((l) => (
                    <div
                      key={l.id}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 truncate flex items-center gap-1"
                      title={`Doctor Leave: ${l.title}`}
                    >
                      <span>🏖️</span>
                      <span className="truncate">{l.title}</span>
                    </div>
                  ))}

                  {/* Appointments */}
                  {dayAppointments.slice(0, 3).map((app) => {
                    const isFollowup = app.appointment_type === 'followup';
                    const isCompleted = app.status === 'completed';
                    const isCancelled = app.status === 'cancelled';

                    return (
                      <div
                        key={app.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded border truncate transition font-medium ${
                          isCancelled
                            ? 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                            : isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isFollowup
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}
                        title={`${app.scheduled_time || ''} ${app.patient?.name} (${app.appointment_type}) - ${app.status}`}
                      >
                        <span className="font-bold mr-1">
                          {app.scheduled_time ? app.scheduled_time.slice(0, 5) : '•'}
                        </span>
                        <span>{app.patient?.name || 'Patient'}</span>
                      </div>
                    );
                  })}

                  {dayAppointments.length > 3 && (
                    <div className="text-[10px] text-slate-400 font-semibold px-1">
                      +{dayAppointments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Day Schedule Agenda (Selected Date Timeline) ── */}
      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Schedule & Agenda for
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBookModal(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition"
            >
              + Book Patient on this Date
            </button>
          </div>
        </div>

        {/* Doctor on Leave Alert Banner if applicable */}
        {selectedDayLeaves.length > 0 && (
          <div className="mt-3 space-y-2">
            {selectedDayLeaves.map((l) => (
              <div
                key={l.id}
                className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🏖️</span>
                  <div>
                    <span className="font-bold uppercase tracking-wide text-[11px] text-amber-700">
                      Doctor Unavailable / Out of Clinic
                    </span>
                    <div className="font-medium text-sm text-amber-950 mt-0.5">{l.title}</div>
                    <div className="text-[11px] text-amber-700">
                      {l.start_date} to {l.end_date} {l.notes ? `· ${l.notes}` : ''}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteLeave(l.id)}
                  className="text-xs text-amber-700 hover:text-amber-950 px-2 py-1 hover:underline"
                >
                  Remove Block
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bookings Agenda List */}
        <div className="mt-4 space-y-2.5">
          {selectedDayAppointments.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No appointments booked for this date. Click <strong>&quot;+ Book Patient on this Date&quot;</strong> above to schedule.
            </div>
          ) : (
            selectedDayAppointments.map((app) => {
              const isFollowup = app.appointment_type === 'followup';

              return (
                <div
                  key={app.id}
                  className="border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white"
                >
                  {/* Left info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-16 text-center shrink-0 pt-0.5">
                      <div className="text-xs font-bold text-slate-800">
                        {app.scheduled_time ? app.scheduled_time.slice(0, 5) : 'Anytime'}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {app.location || 'Clinic'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/patients/${app.patient_id}`}
                          className="font-bold text-sm text-slate-800 hover:text-teal-700 transition"
                        >
                          {app.patient?.name}
                        </Link>
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {app.patient?.patient_code}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                            isFollowup
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {app.appointment_type}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        {[app.patient?.phone, app.notes].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions & Status */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Status Dropdown */}
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value as AppointmentStatus)}
                      disabled={isPending}
                      className={`text-xs px-2 py-1 rounded-md border font-medium focus:outline-none transition ${
                        app.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : app.status === 'cancelled'
                          ? 'bg-slate-100 text-slate-500 border-slate-300'
                          : app.status === 'no_show'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no_show">No Show</option>
                    </select>

                    {/* Start Encounter Action */}
                    <Link
                      href={`/patients/${app.patient_id}/encounters/new?type=${app.appointment_type}`}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition"
                    >
                      Start Encounter →
                    </Link>

                    {/* Reschedule Button */}
                    <button
                      onClick={() => setRescheduleTarget(app)}
                      className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 transition"
                      title="Reschedule appointment"
                    >
                      Edit ✎
                    </button>

                    <button
                      onClick={() => handleDeleteBooking(app.id)}
                      className="text-xs text-rose-500 hover:text-rose-700 px-1 py-1"
                      title="Delete booking"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Modal 1: Book Appointment Modal ── */}
      {showBookModal && (
        <BookAppointmentModal
          patients={patients}
          defaultDate={selectedDate}
          onClose={() => setShowBookModal(false)}
        />
      )}

      {/* ── Modal 2: Mark Doctor Leave Modal ── */}
      {showLeaveModal && (
        <DoctorLeaveModal
          defaultDate={selectedDate}
          onClose={() => setShowLeaveModal(false)}
        />
      )}

      {/* ── Modal 3: Reschedule Appointment Modal ── */}
      {rescheduleTarget && (
        <RescheduleModal
          appointment={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
        />
      )}
    </div>
  );
}

// ── SUB-COMPONENT: Book Appointment Modal ──
function BookAppointmentModal({
  patients,
  defaultDate,
  onClose,
}: {
  patients: Pick<Patient, 'id' | 'name' | 'patient_code' | 'phone'>[];
  defaultDate: string;
  onClose: () => void;
}) {
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.patient_code.toLowerCase().includes(patientSearch.toLowerCase()),
  );

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await createAppointment(formData);
        onClose();
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to book appointment.');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Book Patient Appointment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
        </div>

        {errorMsg && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5 mb-3">
            {errorMsg}
          </div>
        )}

        <form action={handleSubmit} className="space-y-3">
          {/* Patient Selection with search */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Select Patient <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Search by Name or UID..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 mb-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <select
              name="patient_id"
              required
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">— Select Patient —</option>
              {filteredPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.patient_code})
                </option>
              ))}
            </select>
          </div>

          {/* Appointment Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Type
              </label>
              <select
                name="appointment_type"
                defaultValue="followup"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="followup">Follow-up</option>
                <option value="procedure">Procedure</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="scheduled_date"
                required
                defaultValue={defaultDate}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Time & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Time (optional)
              </label>
              <input
                type="time"
                name="scheduled_time"
                defaultValue="10:00"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                placeholder="e.g. OPD-1, OT-2"
                defaultValue="OPD-1"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Clinical Notes (optional)
            </label>
            <input
              type="text"
              name="notes"
              placeholder="e.g. Review MRI & discuss knee RFA"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg transition shadow-sm"
            >
              {isPending ? 'Booking…' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── SUB-COMPONENT: Mark Doctor Leave Modal ──
function DoctorLeaveModal({
  defaultDate,
  onClose,
}: {
  defaultDate: string;
  onClose: () => void;
}) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await createDoctorLeave(formData);
        onClose();
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to record leave.');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-base">🏖️</span>
            <h3 className="text-base font-bold text-slate-800">Mark Doctor Leave / Block Schedule</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
        </div>

        {errorMsg && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5 mb-3">
            {errorMsg}
          </div>
        )}

        <form action={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Title / Reason <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Spine Conference, Annual Leave, Out of Clinic"
              defaultValue="Doctor on Leave"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Leave Type
            </label>
            <select
              name="leave_type"
              defaultValue="leave"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="leave">Leave / Vacation</option>
              <option value="conference">Conference / CME</option>
              <option value="ot_day">Dedicated OT Day</option>
              <option value="holiday">Public Holiday</option>
              <option value="other">Other Out of Clinic</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                required
                defaultValue={defaultDate}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="end_date"
                required
                defaultValue={defaultDate}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Notes (optional)
            </label>
            <input
              type="text"
              name="notes"
              placeholder="e.g. Attending ISSPCON or clinic closed"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition shadow-sm"
            >
              {isPending ? 'Saving…' : 'Save Leave Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── SUB-COMPONENT: Reschedule Appointment Modal ──
function RescheduleModal({
  appointment,
  onClose,
}: {
  appointment: AppointmentWithPatient;
  onClose: () => void;
}) {
  const [date, setDate] = useState(appointment.scheduled_date);
  const [time, setTime] = useState(appointment.scheduled_time || '10:00');
  const [location, setLocation] = useState(appointment.location || '');
  const [isPending, startTransition] = useTransition();

  async function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await rescheduleAppointment(appointment.id, date, time, location);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">
            Reschedule: {appointment.patient?.name}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
        </div>

        <form onSubmit={handleReschedule} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              New Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg transition shadow-sm"
            >
              {isPending ? 'Updating…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
