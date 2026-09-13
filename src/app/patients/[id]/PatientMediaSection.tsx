'use client';

import { useState, useTransition } from 'react';
import type { Patient, PatientMedia, MediaType } from '@/lib/types';
import { updateOneDriveFolder, addPatientMedia, deletePatientMedia } from './media/actions';

interface Props {
  patient: Patient;
  initialMedia: PatientMedia[];
}

const MEDIA_TYPE_CONFIG: Record<
  MediaType,
  { label: string; icon: string; badgeClass: string }
> = {
  xray: { label: 'X-Ray', icon: '🩻', badgeClass: 'bg-blue-50 text-blue-800 border-blue-200' },
  mri: { label: 'MRI', icon: '🧠', badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  ct: { label: 'CT Scan', icon: '🔬', badgeClass: 'bg-purple-50 text-purple-800 border-purple-200' },
  ultrasound: { label: 'Ultrasound', icon: '📱', badgeClass: 'bg-teal-50 text-teal-800 border-teal-200' },
  procedure_photo: { label: 'Procedure Photo', icon: '📸', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' },
  procedure_video: { label: 'Procedure Video', icon: '🎥', badgeClass: 'bg-rose-50 text-rose-800 border-rose-200' },
  lab_report: { label: 'Lab Report', icon: '📋', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  other: { label: 'Other File', icon: '📁', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export function PatientMediaSection({ patient, initialMedia }: Props) {
  const [mediaList, setMediaList] = useState<PatientMedia[]>(initialMedia);
  const [folderUrl, setFolderUrl] = useState<string>(patient.onedrive_folder_url || '');
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const [isAddingMedia, setIsAddingMedia] = useState(false);
  const [copiedFolderName, setCopiedFolderName] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const suggestedFolderName = `${patient.patient_code} - ${patient.name}`;

  const copySuggestedFolderName = () => {
    navigator.clipboard.writeText(suggestedFolderName);
    setCopiedFolderName(true);
    setTimeout(() => setCopiedFolderName(false), 2000);
  };

  const handleSaveFolder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    startTransition(async () => {
      const res = await updateOneDriveFolder(patient.id, folderUrl);
      if (res.success) {
        setIsEditingFolder(false);
      } else {
        setErrorMessage(res.error || 'Failed to update folder URL');
      }
    });
  };

  const handleAddMedia = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await addPatientMedia(patient.id, formData);
      if (res.success) {
        setIsAddingMedia(false);
        // Optimistically reload or allow server revalidate to update
        window.location.reload();
      } else {
        setErrorMessage(res.error || 'Failed to add media');
      }
    });
  };

  const handleDeleteMedia = (mediaId: string, title: string) => {
    if (!confirm(`Remove "${title}" from patient media records? (This will not delete the file from OneDrive)`)) {
      return;
    }
    setErrorMessage(null);
    startTransition(async () => {
      const res = await deletePatientMedia(patient.id, mediaId);
      if (res.success) {
        setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
      } else {
        setErrorMessage(res.error || 'Failed to delete media');
      }
    });
  };

  return (
    <div className="mb-6 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🩻</span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
              Imaging & Procedural Media
            </h3>
            <p className="text-xs text-slate-500">
              OneDrive cloud scans, MRI, CT, and fluoroscopy/US videos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsAddingMedia(true)}
            className="inline-flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition"
          >
            <span>+ Attach Scan / Video</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-3 p-2 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* OneDrive Master Folder Vault Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
        {patient.onedrive_folder_url ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">📁</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <span>OneDrive Patient Vault</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Connected" />
                </div>
                <div className="text-[11px] text-slate-500 truncate max-w-xs md:max-w-md">
                  {patient.onedrive_folder_url}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={patient.onedrive_folder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm transition"
              >
                <span>📂 Open OneDrive Vault</span>
                <span className="text-xs">↗</span>
              </a>
              <button
                type="button"
                onClick={() => setIsEditingFolder(true)}
                className="text-xs text-slate-500 hover:text-slate-800 underline px-1"
              >
                Edit
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span>📁 OneDrive Vault not linked yet</span>
              </div>
              <div className="text-slate-600">
                Link this patient’s dedicated cloud folder for instant 1-click access to all their raw DICOMs, scans, and videos.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingFolder(true)}
              className="inline-flex items-center justify-center gap-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg px-3 py-1.5 font-medium shadow-xs shrink-0"
            >
              <span>+ Link OneDrive Folder</span>
            </button>
          </div>
        )}
      </div>

      {/* Media Item List */}
      <div>
        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 flex items-center justify-between">
          <span>Attached Media & Scans ({mediaList.length})</span>
        </div>

        {mediaList.length === 0 ? (
          <div className="text-center py-6 px-4 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
            <p className="text-xs text-slate-500">
              No specific scans or videos logged yet.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click &ldquo;+ Attach Scan / Video&rdquo; above to link individual X-Rays, MRIs, CT scans, or procedure clips.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {mediaList.map((m) => {
              const config = MEDIA_TYPE_CONFIG[m.media_type] || MEDIA_TYPE_CONFIG.other;
              return (
                <div
                  key={m.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-xl shrink-0 mt-0.5">{config.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 truncate">
                          {m.title}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${config.badgeClass}`}
                        >
                          {config.label}
                        </span>
                        {m.scan_date && (
                          <span className="text-xs text-slate-500 font-mono">
                            {m.scan_date}
                          </span>
                        )}
                      </div>
                      {m.notes && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {m.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md px-2.5 py-1 text-xs font-medium shadow-xs transition"
                    >
                      <span>View / Play</span>
                      <span className="text-xs">↗</span>
                    </a>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeleteMedia(m.id, m.title)}
                      className="text-xs text-slate-400 hover:text-rose-600 px-1 py-1 transition"
                      title="Delete entry"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Edit OneDrive Folder URL */}
      {isEditingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 border border-slate-200">
            <h4 className="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <span>📁</span> Link OneDrive Patient Vault
            </h4>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Store large high-res scans, DICOM archives, and fluoroscopy/US videos directly in Microsoft OneDrive, and paste the folder share link here for 1-click access anytime.
            </p>

            {/* Folder Name Helper */}
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
              <div className="font-semibold text-blue-900 mb-1">
                Suggested Folder Name in OneDrive:
              </div>
              <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded border border-blue-200 font-mono text-slate-800 text-xs">
                <span>{suggestedFolderName}</span>
                <button
                  type="button"
                  onClick={copySuggestedFolderName}
                  className="text-blue-700 hover:text-blue-900 font-sans font-medium text-xs underline shrink-0"
                >
                  {copiedFolderName ? '✓ Copied!' : 'Copy Name'}
                </button>
              </div>
              <p className="text-[11px] text-blue-700 mt-1.5">
                Tip: In OneDrive, create this folder, click <strong>Share</strong> → <strong>Copy link</strong>, and paste it below.
              </p>
            </div>

            <form onSubmit={handleSaveFolder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  OneDrive Folder Share Link
                </label>
                <input
                  type="url"
                  required
                  value={folderUrl}
                  onChange={(e) => setFolderUrl(e.target.value)}
                  placeholder="https://1drv.ms/... or https://...my.sharepoint.com/..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsEditingFolder(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Vault Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Patient Media */}
      {isAddingMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span>🩻</span> Attach Scan or Procedural Video
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingMedia(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Link an individual X-Ray, MRI, CT scan, or video from OneDrive for immediate 1-click viewing in the chart.
            </p>

            <form onSubmit={handleAddMedia} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Media Category
                  </label>
                  <select
                    name="media_type"
                    required
                    defaultValue="mri"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="xray">🩻 X-Ray</option>
                    <option value="mri">🧠 MRI Scan</option>
                    <option value="ct">🔬 CT Scan</option>
                    <option value="ultrasound">📱 Ultrasound Image</option>
                    <option value="procedure_photo">📸 Procedure Photo</option>
                    <option value="procedure_video">🎥 Procedure Video</option>
                    <option value="lab_report">📋 Lab Report</option>
                    <option value="other">📁 Other Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Scan / Recording Date
                  </label>
                  <input
                    type="date"
                    name="scan_date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Title / Description
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Lumbar Spine MRI (L4-L5 Disc Herniation)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  OneDrive Direct Link / Share URL
                </label>
                <input
                  type="url"
                  name="url"
                  required
                  placeholder="https://1drv.ms/... or https://...my.sharepoint.com/..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Clinical Notes / Key Findings (Optional)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="e.g. Marked central canal stenosis at L4-L5 with bilateral neuroforaminal narrowing..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsAddingMedia(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Add to Chart'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
