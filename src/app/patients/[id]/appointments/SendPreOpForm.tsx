'use client';

import { useState } from 'react';
import type { Patient, Appointment } from '@/lib/types';

interface Props {
  patient: Patient;
  appointment?: Appointment;
  patientId?: string;
  appointmentId?: string;
}

export function SendPreOpForm({ patient, appointment }: Props) {
  const [open, setOpen] = useState(false);
  const [procedureName, setProcedureName] = useState('Procedure');
  const [instructions, setInstructions] = useState(
    '1. Fast for 6 hours prior to the procedure (clear water allowed up to 2 hours before).\n2. Continue routine blood pressure medications with a small sip of water.\n3. Hold blood thinners/aspirin as discussed with doctor.\n4. Bring all recent MRI / CT films.\n5. Please arrange for an adult attendant to accompany you home.\n\nहिंदी निर्देश (Hindi Instructions):\n१. प्रोसीजर से ६ घंटे पहले खाली पेट रहें (सादा पानी २ घंटे पहले तक ले सकते हैं)।\n२. बीपी की दवा सुबह हल्के पानी के साथ समय पर लें।\n३. खून पतला करने वाली दवा (Aspirin आदि) डॉक्टर के कहे अनुसार बंद रखें।\n४. अपनी पुरानी MRI / X-Ray रिपोर्ट और दवाइयां साथ लाएं।\n५. कृपया अपने साथ एक परिजन को जरूर लाएं।'
  );

  const phone = patient.phone;
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const phoneParam = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const handleSendWhatsApp = () => {
    if (!phoneParam) {
      alert('This patient does not have a phone number on file.');
      return;
    }

    const scheduledDate = appointment?.scheduled_date || 'your scheduled date';
    const scheduledTime = appointment?.scheduled_time ? ` at ${appointment.scheduled_time}` : '';
    const location = appointment?.location ? ` (${appointment.location})` : '';

    const text = `*PRE-PROCEDURE INSTRUCTIONS — DR. VARUN'S PAIN CLINIC*\n\nDear *${patient.name}*,\nFor your upcoming *${procedureName}* scheduled on *${scheduledDate}*${scheduledTime}${location}:\n\n${instructions}\n\nFor any questions or clarification before arrival, please reply to this message.`;

    const url = `https://wa.me/${phoneParam}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
      >
        <span>📲</span>
        <span>Send Pre-Op Instructions (WhatsApp)</span>
      </button>
    );
  }

  return (
    <div className="mt-2 p-3 bg-teal-50/60 border border-teal-200 rounded-lg space-y-2 text-xs">
      <div className="font-bold text-teal-950 flex items-center justify-between">
        <span>📲 Pre-Procedure WhatsApp Instructions</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-slate-400 hover:text-slate-600 font-bold"
        >
          ✕
        </button>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-0.5">
          Procedure Name
        </label>
        <input
          type="text"
          value={procedureName}
          onChange={(e) => setProcedureName(e.target.value)}
          placeholder="e.g. L4-L5 Transforaminal Epidural Block"
          className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-0.5">
          Fasting & Medication Instructions
        </label>
        <textarea
          rows={4}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleSendWhatsApp}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-md text-xs shadow-xs transition inline-flex items-center gap-1.5"
        >
          <span>📲 Open in WhatsApp</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-slate-500 hover:text-slate-800 text-xs font-medium px-2 py-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
