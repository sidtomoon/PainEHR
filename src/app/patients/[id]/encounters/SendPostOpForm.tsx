'use client';

import { useState } from 'react';
import type { Patient, Encounter } from '@/lib/types';

interface Props {
  patient: Patient;
  encounter?: Encounter;
  patientId?: string;
  encounterId?: string;
}

export function SendPostOpForm({ patient, encounter }: Props) {
  const [open, setOpen] = useState(false);
  const [instructions, setInstructions] = useState(
    '1. Rest for 24 hours. Keep injection site dressing clean and dry.\n2. Avoid heavy lifting, twisting, or vigorous exercise for 3 days.\n3. Mild injection site soreness is normal — apply cold ice pack 15 mins as needed.\n4. Contact clinic immediately if: high fever (>100.4°F), new lower limb numbness, weakness, or severe headache occurs.\n\nहिंदी निर्देश (Hindi Care Instructions):\n१. २४ घंटे पूरा आराम करें। सुई वाली पट्टी को साफ और सूखा रखें।\n२. अगले ३ दिनों तक भारी सामान उठाना या आगे झुकना बंद रखें।\n३. सुई वाली जगह पर दर्द होने पर १५ मिनट बर्फ की सिकाई करें।\n४. यदि तेज बुखार, पैरों में कमजोरी, सुन्नपन या तेज सिरदर्द हो, तो तुरंत क्लिनिक संपर्क करें।'
  );

  const phone = patient.phone;
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const phoneParam = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const handleSendWhatsApp = () => {
    if (!phoneParam) {
      alert('This patient does not have a phone number on file.');
      return;
    }

    const procedureName = encounter?.procedure || 'your procedure';
    const date = encounter?.encounter_date || 'today';

    const text = `*POST-PROCEDURE CARE INSTRUCTIONS — DR. VARUN'S PAIN CLINIC*\n\nDear *${patient.name}*,\nFollowing your *${procedureName}* on *${date}*:\n\n${instructions}\n\nPlease take prescribed medications on time. If you have any sudden concerns, reply here or contact the clinic emergency line.`;

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
        <span>Send Post-Op Instructions (WhatsApp)</span>
      </button>
    );
  }

  return (
    <div className="mt-2 p-3 bg-teal-50/60 border border-teal-200 rounded-lg space-y-2 text-xs">
      <div className="font-bold text-teal-950 flex items-center justify-between">
        <span>📲 Post-Procedure WhatsApp Instructions</span>
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
          Care Instructions & Warning Signs
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
