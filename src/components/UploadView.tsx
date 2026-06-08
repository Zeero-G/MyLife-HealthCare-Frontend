import React, { useState, useCallback } from 'react';
import {
  UploadCloud, FileText, X, CheckCircle, AlertCircle,
  Image, File, Brain, ChevronDown, ChevronUp, Sparkles,
  Pill, FlaskConical, User, Calendar, Building2, Activity,
  RefreshCw, ShieldAlert,
} from 'lucide-react';
import { recordsAPI, aiAPI } from '../api';
import { useAuth } from '../AuthContext';
import type { AIResult } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <Image size={22} className="text-violet-500" />;
  if (mimeType === 'application/pdf') return <FileText size={22} className="text-rose-500" />;
  return <File size={22} className="text-gray-400" />;
}

// ── AI Result Renderer ─────────────────────────────────────────────────────

interface AIDataCardProps { result: AIResult }

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : pct >= 60 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-rose-600 bg-rose-50 border-rose-200';
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {pct}% confidence
    </span>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-blue-500">{icon}</span>
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{title}</h4>
      </div>
      <div className="pl-5">{children}</div>
    </div>
  );
}

function AIDataCard({ result }: AIDataCardProps) {
  const [expanded, setExpanded] = useState(true);
  const d = result.extracted_data as Record<string, any>;

  const medications: any[] = Array.isArray(d.medications)
    ? d.medications.filter((m: any) => m && (m.name || m.dosage))
    : [];
  const labResults: any[] = Array.isArray(d.lab_results)
    ? d.lab_results.filter((r: any) => r && r.test_name)
    : [];
  const diagnoses: string[] = Array.isArray(d.diagnosis) ? d.diagnosis.filter(Boolean) : [];
  const allergies: string[] = Array.isArray(d.allergies) ? d.allergies.filter(Boolean) : [];

  // Handle raw_response fallback (parse error scenario)
  if (d.parse_error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-3">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert size={16} className="text-amber-500" />
          <span className="text-xs font-semibold text-amber-700">AI returned unstructured response</span>
        </div>
        <p className="text-xs text-amber-800 whitespace-pre-wrap leading-relaxed">{d.raw_response}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-violet-50 border border-blue-100 rounded-2xl mt-3 overflow-hidden shadow-sm">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white"
      >
        <div className="flex items-center gap-2">
          <Brain size={16} />
          <span className="text-sm font-bold">AI Extraction Results</span>
          <ConfidenceBadge score={result.confidence_score} />
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="p-4 text-sm">

          {/* Patient Info */}
          {(d.patient_name || d.patient_dob || d.patient_gender || d.document_type) && (
            <Section icon={<User size={14} />} title="Patient Info">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {d.patient_name && <div><span className="text-[11px] text-gray-400">Name</span><p className="text-xs font-semibold text-gray-800">{d.patient_name}</p></div>}
                {d.patient_dob && <div><span className="text-[11px] text-gray-400">DOB</span><p className="text-xs font-semibold text-gray-800">{d.patient_dob}</p></div>}
                {d.patient_gender && <div><span className="text-[11px] text-gray-400">Gender</span><p className="text-xs font-semibold text-gray-800">{d.patient_gender}</p></div>}
                {d.document_type && <div><span className="text-[11px] text-gray-400">Document</span><p className="text-xs font-semibold text-gray-800">{d.document_type}</p></div>}
              </div>
            </Section>
          )}

          {/* Visit Info */}
          {(d.visit_date || d.doctor_name || d.hospital_clinic) && (
            <Section icon={<Calendar size={14} />} title="Visit Details">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {d.visit_date && <div><span className="text-[11px] text-gray-400">Date</span><p className="text-xs font-semibold text-gray-800">{d.visit_date}</p></div>}
                {d.doctor_name && <div><span className="text-[11px] text-gray-400">Doctor</span><p className="text-xs font-semibold text-gray-800">{d.doctor_name}</p></div>}
                {d.hospital_clinic && <div className="col-span-2"><span className="text-[11px] text-gray-400">Hospital / Clinic</span><p className="text-xs font-semibold text-gray-800">{d.hospital_clinic}</p></div>}
              </div>
            </Section>
          )}

          {/* Diagnoses */}
          {diagnoses.length > 0 && (
            <Section icon={<Activity size={14} />} title="Diagnosis">
              <div className="flex flex-wrap gap-1.5">
                {diagnoses.map((dx, i) => (
                  <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[11px] font-semibold rounded-full border border-rose-100">{dx}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Medications */}
          {medications.length > 0 && (
            <Section icon={<Pill size={14} />} title={`Medications (${medications.length})`}>
              <div className="space-y-2">
                {medications.map((med, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 px-3 py-2">
                    <p className="text-xs font-bold text-gray-800">{med.name}</p>
                    <p className="text-[11px] text-gray-500">{[med.dosage, med.frequency].filter(Boolean).join(' · ')}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Lab Results */}
          {labResults.length > 0 && (
            <Section icon={<FlaskConical size={14} />} title={`Lab Results (${labResults.length})`}>
              <div className="space-y-1.5">
                {labResults.map((lab, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-3 py-2">
                    <div>
                      <p className="text-xs font-bold text-gray-800">{lab.test_name}</p>
                      <p className="text-[11px] text-gray-400">{lab.reference_range ? `Ref: ${lab.reference_range}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${
                        lab.status === 'HIGH' || lab.status === 'high' ? 'text-rose-600'
                        : lab.status === 'LOW' || lab.status === 'low' ? 'text-amber-600'
                        : 'text-gray-800'
                      }`}>{lab.value} {lab.unit}</span>
                      {lab.status && (
                        <p className={`text-[10px] font-semibold ${
                          lab.status === 'HIGH' || lab.status === 'high' ? 'text-rose-400'
                          : lab.status === 'LOW' || lab.status === 'low' ? 'text-amber-400'
                          : 'text-emerald-400'
                        }`}>{lab.status}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Allergies */}
          {allergies.length > 0 && (
            <Section icon={<ShieldAlert size={14} />} title="Allergies">
              <div className="flex flex-wrap gap-1.5">
                {allergies.map((a, i) => (
                  <span key={i} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[11px] font-semibold rounded-full border border-orange-100">{a}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Follow-up */}
          {d.follow_up_instructions && (
            <Section icon={<Building2 size={14} />} title="Follow-up Instructions">
              <p className="text-xs text-gray-700 leading-relaxed bg-white rounded-xl border border-gray-100 px-3 py-2">{d.follow_up_instructions}</p>
            </Section>
          )}

        </div>
      )}
    </div>
  );
}

// ── Main Upload View ───────────────────────────────────────────────────────

type ScanStatus = 'idle' | 'uploading' | 'scanning' | 'done' | 'error';

interface FileEntry {
  file: File;
  name: string;
  size: number;
  type: string;
  uploadStatus: 'idle' | 'uploading' | 'done' | 'error';
  file_url?: string;
  uploadError?: string;
  scanStatus: ScanStatus;
  aiResult?: AIResult;
  scanError?: string;
}

export default function UploadView() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const updateEntry = (name: string, patch: Partial<FileEntry>) => {
    setEntries(prev => prev.map(e => e.name === name ? { ...e, ...patch } : e));
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    for (const file of Array.from(files)) {
      if (!allowed.includes(file.type)) {
        setEntries(prev => [...prev, {
          file, name: file.name, size: file.size, type: file.type,
          uploadStatus: 'error', uploadError: 'Unsupported type. Use PDF, JPG, PNG, or WebP.',
          scanStatus: 'idle',
        }]);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        setEntries(prev => [...prev, {
          file, name: file.name, size: file.size, type: file.type,
          uploadStatus: 'error', uploadError: 'File too large. Maximum 20MB.',
          scanStatus: 'idle',
        }]);
        continue;
      }
      // Add entry
      setEntries(prev => [...prev, {
        file, name: file.name, size: file.size, type: file.type,
        uploadStatus: 'uploading', scanStatus: 'idle',
      }]);
      // Upload to records storage
      try {
        const result = await recordsAPI.upload(file);
        setEntries(prev => prev.map(e =>
          e.name === file.name && e.uploadStatus === 'uploading'
            ? { ...e, uploadStatus: 'done', file_url: result.file_url }
            : e
        ));
      } catch (err: any) {
        setEntries(prev => prev.map(e =>
          e.name === file.name && e.uploadStatus === 'uploading'
            ? { ...e, uploadStatus: 'error', uploadError: err.message || 'Upload failed' }
            : e
        ));
      }
    }
  }, []);

  const scanWithAI = useCallback(async (entry: FileEntry) => {
    if (!user) return;
    updateEntry(entry.name, { scanStatus: 'scanning', scanError: undefined, aiResult: undefined });
    try {
      // Prefer direct upload scan (sends file bytes → better vision quality)
      const result = await aiAPI.processUpload(user.id, entry.file);
      updateEntry(entry.name, { scanStatus: 'done', aiResult: result });
    } catch (err: any) {
      // Fallback: try by URL if file_url is available
      if (entry.file_url) {
        try {
          const result = await aiAPI.processByUrl(user.id, entry.file_url);
          updateEntry(entry.name, { scanStatus: 'done', aiResult: result });
          return;
        } catch {}
      }
      updateEntry(entry.name, { scanStatus: 'error', scanError: err.message || 'AI scan failed' });
    }
  }, [user]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = '';
  }, [handleFiles]);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white">
            <Brain size={18} />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900">AI Document Scanner</h1>
        </div>
        <p className="text-sm text-gray-500">
          Upload medical documents (PDFs, photos of reports) — Gemini AI will extract diagnoses, medications, lab results and more.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('doc-scan-input')?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer select-none ${
          isDragging
            ? 'border-violet-400 bg-violet-50 scale-[1.01]'
            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 bg-white'
        }`}
      >
        <input
          id="doc-scan-input"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleInput}
        />
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
          isDragging ? 'bg-violet-100' : 'bg-gray-100'
        }`}>
          <UploadCloud size={32} className={isDragging ? 'text-violet-500' : 'text-gray-400'} />
        </div>
        <h3 className="font-bold text-gray-800 mb-1">
          {isDragging ? 'Drop your document!' : 'Drag & drop medical documents'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition">
          <Sparkles size={15} /> Scan with AI
        </div>
        <p className="text-xs text-gray-400 mt-4">PDF, JPG, PNG, WebP · Max 20 MB per file</p>
      </div>

      {/* File Queue */}
      {entries.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">{entries.length} document{entries.length > 1 ? 's' : ''}</h3>
            <button onClick={() => setEntries([])} className="text-xs text-gray-400 hover:text-gray-600 font-medium">
              Clear all
            </button>
          </div>

          {entries.map((entry, i) => (
            <div key={`${entry.name}-${i}`} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              {/* File row */}
              <div className={`flex items-center gap-3 p-4 ${
                entry.uploadStatus === 'done' ? '' : ''
              }`}>
                <FileIcon mimeType={entry.type} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{entry.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(entry.size)}</p>
                  {entry.uploadError && (
                    <p className="text-xs text-rose-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle size={11} /> {entry.uploadError}
                    </p>
                  )}
                  {entry.scanError && (
                    <p className="text-xs text-rose-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle size={11} /> {entry.scanError}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Upload status */}
                  {entry.uploadStatus === 'uploading' && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
                      <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Uploading…
                    </div>
                  )}
                  {entry.uploadStatus === 'done' && entry.scanStatus === 'idle' && (
                    <button
                      onClick={() => scanWithAI(entry)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-bold rounded-lg hover:opacity-90 transition shadow-sm"
                    >
                      <Brain size={12} /> Scan with AI
                    </button>
                  )}
                  {entry.scanStatus === 'scanning' && (
                    <div className="flex items-center gap-1.5 text-xs text-violet-500 font-medium">
                      <div className="w-3.5 h-3.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      Scanning…
                    </div>
                  )}
                  {entry.scanStatus === 'done' && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={16} className="text-emerald-500" />
                      <button
                        onClick={() => scanWithAI(entry)}
                        title="Re-scan"
                        className="p-1 rounded-lg text-gray-300 hover:text-violet-500 transition"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  )}
                  {entry.scanStatus === 'error' && entry.uploadStatus === 'done' && (
                    <button
                      onClick={() => scanWithAI(entry)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-100 transition border border-rose-100"
                    >
                      <RefreshCw size={12} /> Retry
                    </button>
                  )}
                  {/* Remove */}
                  <button
                    onClick={() => setEntries(prev => prev.filter(e => e.name !== entry.name || e !== entry))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* AI Result */}
              {entry.aiResult && (
                <div className="px-4 pb-4">
                  <AIDataCard result={entry.aiResult} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Cards */}
      {entries.length === 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🔒', title: 'End-to-End Encrypted', desc: 'Files are encrypted in transit and at rest in Supabase Storage.' },
            { icon: '🤖', title: 'Gemini AI Vision', desc: 'Google Gemini reads your document and extracts diagnoses, meds, and lab data.' },
            { icon: '📋', title: 'Structured Output', desc: 'Results are saved as structured data you can link to your medical records.' },
          ].map(card => (
            <div key={card.title} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <span className="text-2xl mb-2 block">{card.icon}</span>
              <h4 className="text-xs font-bold text-gray-800 mb-1">{card.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
