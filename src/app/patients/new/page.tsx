'use client';

import Link from 'next/link';
import { useState, useActionState } from 'react';
import { createPatient } from '@/app/patients/actions';

export default function NewPatientPage() {
  const [state, action, pending] = useActionState(createPatient, null);

  const [patientCode, setPatientCode] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [phone, setPhone] = useState('');

  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedImagePreview, setScannedImagePreview] = useState<string | null>(null);

  async function handleOpdCardFile(file: File | undefined | null) {
    if (!file) return;
    setScanError(null);
    setScanMessage('Scanning OPD card with AI… reading CR No, name, age, and sex…');
    setIsScanning(true);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const dataUrl = await base64Promise;
      setScannedImagePreview(dataUrl);

      const base64 = dataUrl.split(',')[1];
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'photo',
          imageBase64: base64,
          mediaType: file.type || 'image/jpeg',
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const demo = data.demographics;
      if (demo) {
        if (demo.cr_no) setPatientCode(demo.cr_no);
        if (demo.name) setName(demo.name);
        if (demo.age !== null && demo.age !== undefined) setAge(String(demo.age));
        if (demo.sex) setSex(demo.sex);
        if (demo.phone) setPhone(demo.phone);

        const summaryParts: string[] = [];
        if (demo.cr_no) summaryParts.push(`CR No: ${demo.cr_no}`);
        if (demo.name) summaryParts.push(`Name: ${demo.name}`);
        if (demo.age || demo.sex) summaryParts.push(`${demo.age || '—'}/${demo.sex || '—'}`);

        setScanMessage(`✓ Extracted from OPD card: ${summaryParts.join(' · ') || 'Details filled below'}`);
      } else {
        setScanMessage('Card scanned. Please verify fields below.');
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setScanError(errorObj?.message || 'Failed to extract demographics from photo. You can fill the fields manually below.');
      setScanMessage(null);
    } finally {
      setIsScanning(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    handleOpdCardFile(file);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 pt-2 w-full">
      <Link href="/patients" className="text-xs text-slate-400 hover:text-slate-600">
        ← Patients
      </Link>
      <div className="flex items-center justify-between mt-2 mb-3">
        <h2 className="text-lg font-semibold text-slate-800">New Patient Registration</h2>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-medium">
          OPD Intake
        </span>
      </div>

      {/* ── AI OPD Card Scanner Card ── */}
      <div className="mb-5 bg-gradient-to-r from-teal-50/70 to-slate-50 border border-teal-200/80 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">📸</span>
            <span className="text-xs font-semibold text-slate-800">Auto-fill from Hospital OPD Card / Slip</span>
          </div>
          <span className="text-[10px] text-teal-800 font-bold uppercase tracking-wider bg-teal-100/70 px-1.5 py-0.5 rounded">
            AI Scan
          </span>
        </div>
        <p className="text-xs text-slate-600 mb-3">
          Snap a photo or upload an image of the hospital OPD ticket (e.g. PGI, AIIMS, civil hospital). AI automatically extracts <strong>CR No, Name, Age, and Sex</strong>.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-teal-400 bg-white hover:bg-teal-50 text-teal-900 font-semibold text-xs cursor-pointer shadow-xs transition">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              disabled={isScanning}
              className="hidden"
            />
            <span>📸</span>
            <span>Take Photo (Camera)</span>
          </label>

          <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs cursor-pointer shadow-xs transition">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isScanning}
              className="hidden"
            />
            <span>🖼️</span>
            <span>Upload Image / Files</span>
          </label>
        </div>

        {isScanning && (
          <div className="mt-3 p-2.5 bg-teal-100/60 rounded-lg flex items-center gap-2 text-xs text-teal-950 font-medium animate-pulse">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-teal-700 border-t-transparent animate-spin"></span>
            <span>{scanMessage}</span>
          </div>
        )}

        {!isScanning && scanMessage && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-1.5 font-medium">
              <span>{scanMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setScanMessage(null);
                setScannedImagePreview(null);
              }}
              className="text-slate-400 hover:text-slate-600 text-[11px]"
            >
              ✕
            </button>
          </div>
        )}

        {scanError && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            {scanError}
          </div>
        )}

        {scannedImagePreview && (
          <div className="mt-3 pt-2 border-t border-teal-200/50 flex items-center gap-3">
            <img src={scannedImagePreview} alt="Scanned OPD Card" className="h-14 w-14 object-cover rounded border border-slate-200 shadow-xs" />
            <div className="text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700 block">Scanned OPD Card preview</span>
              Verify extracted details in the form fields below.
            </div>
          </div>
        )}
      </div>

      {state?.status === 'error' && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-3">
          {state.message}
        </div>
      )}

      <form action={action} className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              CR No. / Hospital Registration UID (optional)
            </label>
            <span className="text-[11px] text-slate-400">Leave blank for auto PT-00000X</span>
          </div>
          <input
            name="patient_code"
            value={patientCode}
            onChange={(e) => setPatientCode(e.target.value)}
            placeholder="e.g. CR-12345, clinic UID, or leave blank"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
            Name <span className="text-rose-500">*</span>
          </label>
          <input
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Age</label>
            <input
              name="age"
              type="number"
              min={0}
              max={130}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 45"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Sex</label>
            <select
              name="sex"
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">— Select Sex —</option>
              <option value="M">M (Male)</option>
              <option value="F">F (Female)</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Phone (optional)</label>
          <input
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="whatsapp_opt_in" defaultChecked className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
            Patient has consented to WhatsApp appointment reminders
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="research_consent" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
            Patient has consented to research use of their data
          </label>
        </div>
        <button
          type="submit"
          disabled={pending || isScanning}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg py-3 text-sm font-semibold mt-2 shadow-sm transition"
        >
          {pending ? 'Saving patient…' : 'Save Patient'}
        </button>
      </form>
    </div>
  );
}
