import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Trash2, Share2, Eye, X, CheckCircle,
  AlertCircle, Search, Filter, Download, Copy, ExternalLink,
  Calendar, User, Stethoscope, FlaskConical, Pill, Scan, MoreVertical
} from 'lucide-react';
import { recordsAPI, SIGNED_URL_HINT } from '../api';
import type { MedicalRecord, CreateRecordPayload, RecordType, ShareQRResponse } from '../types';

const RECORD_TYPE_LABELS: Record<RecordType, { label: string; color: string; icon: React.ReactNode }> = {
  diagnosis:    { label: 'Diagnosis',    color: 'blue',   icon: <Stethoscope size={14} /> },
  lab:          { label: 'Lab Report',   color: 'purple', icon: <FlaskConical size={14} /> },
  prescription: { label: 'Prescription', color: 'green',  icon: <Pill size={14} /> },
  imaging:      { label: 'Imaging',      color: 'orange', icon: <Scan size={14} /> },
  other:        { label: 'Other',        color: 'gray',   icon: <FileText size={14} /> },
};

const colorMap: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  green:  'bg-emerald-100 text-emerald-700',
  orange: 'bg-orange-100 text-orange-700',
  gray:   'bg-gray-100 text-gray-600',
};

// ── Add Record Modal ─────────────────────────────────────────
function AddRecordModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<CreateRecordPayload>({
    title: '', record_type: 'diagnosis',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await recordsAPI.create(form);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plus size={20} className="text-blue-600" /> Add Medical Record
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 border border-red-100">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Title *</label>
            <input
              required
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Annual Blood Test Results"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Record Type *</label>
            <select
              value={form.record_type}
              onChange={e => setForm(f => ({ ...f, record_type: e.target.value as RecordType }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white transition"
            >
              {Object.entries(RECORD_TYPE_LABELS).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Doctor Name</label>
              <input
                type="text"
                value={form.doctor_name || ''}
                onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))}
                placeholder="Dr. Perera"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Visit Date</label>
              <input
                type="date"
                value={form.visit_date || ''}
                onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Diagnosis</label>
            <input
              type="text"
              value={form.diagnosis || ''}
              onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
              placeholder="e.g. Type 2 Diabetes, Hypertension..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description / Notes</label>
            <textarea
              rows={3}
              value={form.description || ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Additional notes or observations..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">File URL (optional)</label>
            <input
              type="url"
              value={form.file_url || ''}
              onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))}
              placeholder="Paste from upload — link is temporary"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
            />
            <p className="text-[11px] text-gray-400 mt-1">{SIGNED_URL_HINT}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : <Plus size={16} />}
              {loading ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── View Record Modal ────────────────────────────────────────
function ViewRecordModal({ record, onClose }: { record: MedicalRecord; onClose: () => void }) {
  const [current, setCurrent] = useState<MedicalRecord>(record);
  const [refreshing, setRefreshing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    recordsAPI.get(record.id)
      .then((fresh) => { if (!cancelled) setCurrent(fresh); })
      .catch(() => { if (!cancelled) setCurrent(record); })
      .finally(() => { if (!cancelled) setRefreshing(false); });
    return () => { cancelled = true; };
  }, [record.id, record]);

  const type = RECORD_TYPE_LABELS[current.record_type] || RECORD_TYPE_LABELS.other;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{current.title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colorMap[type.color]}`}>
            {type.icon} {type.label}
          </div>
          {current.diagnosis && (
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Diagnosis</p>
              <p className="text-sm text-blue-900 font-medium">{current.diagnosis}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {current.doctor_name && (
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Doctor</p>
                <p className="font-semibold text-gray-800">{current.doctor_name}</p>
              </div>
            )}
            {current.visit_date && (
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Visit Date</p>
                <p className="font-semibold text-gray-800">{new Date(current.visit_date).toLocaleDateString()}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Created</p>
              <p className="font-semibold text-gray-800">{new Date(current.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          {current.description && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl">{current.description}</p>
            </div>
          )}
          {refreshing && (
            <p className="text-xs text-gray-400">Refreshing file link…</p>
          )}
          {current.file_url && (
            <div>
              <a
                href={current.file_url}
                target="_blank"
                rel="noopener noreferrer"
                title={SIGNED_URL_HINT}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                <ExternalLink size={16} /> View Attached File
              </a>
              <p className="text-[11px] text-gray-400 mt-1.5">{SIGNED_URL_HINT}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Share QR Modal ───────────────────────────────────────────
function ShareModal({ record, onClose }: { record: MedicalRecord; onClose: () => void }) {
  const [shareData, setShareData] = useState<ShareQRResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [hours, setHours] = useState(24);

  const generate = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await recordsAPI.shareQR(record.id, hours);
      setShareData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  }, [record.id, hours]);

  useEffect(() => { generate(); }, []);

  const copyLink = () => {
    if (shareData) {
      navigator.clipboard.writeText(shareData.share_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Share2 size={20} className="text-blue-600" /> Share Record
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition"><X size={20} /></button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Generate a temporary secure link for <strong>"{record.title}"</strong>.
          </p>

          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Link expires after</label>
            <select
              value={hours}
              onChange={e => setHours(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500"
            >
              <option value={1}>1 hour</option>
              <option value={6}>6 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
              <option value={168}>7 days</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 mb-4">
              {error}
            </div>
          ) : shareData ? (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 mb-1.5 font-medium">Share URL</p>
                <p className="text-xs text-gray-800 break-all font-mono">{shareData.share_url}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                <AlertCircle size={14} />
                Expires: {new Date(shareData.expires_at).toLocaleString()}
              </div>
              <button
                onClick={copyLink}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                {copied ? <><CheckCircle size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
              </button>
            </div>
          ) : null}

          <button
            onClick={generate}
            disabled={loading}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Generate New Link
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main RecordsView ─────────────────────────────────────────
export default function RecordsView() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<RecordType | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewRecord, setViewRecord] = useState<MedicalRecord | null>(null);
  const [shareRecord, setShareRecord] = useState<MedicalRecord | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await recordsAPI.list();
      setRecords(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleDelete = async (recordId: string) => {
    if (!confirm('Delete this record permanently? This cannot be undone.')) return;
    setDeleting(recordId);
    try {
      await recordsAPI.delete(recordId);
      setRecords(prev => prev.filter(r => r.id !== recordId));
    } catch (err: any) {
      alert('Could not delete: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = records.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.doctor_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.diagnosis?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || r.record_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Medical Records</h1>
          <p className="text-sm text-gray-500 mt-0.5">{records.length} total records</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm shadow-blue-200"
        >
          <Plus size={16} /> Add Record
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, doctor, diagnosis..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white transition"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="pl-8 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500 transition"
          >
            <option value="all">All Types</option>
            {Object.entries(RECORD_TYPE_LABELS).map(([val, { label }]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2 text-sm">
          <AlertCircle size={18} /> {error}
          <button onClick={fetchRecords} className="ml-auto font-semibold underline">Retry</button>
        </div>
      )}

      {/* Records List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <FileText size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">No records found</h3>
          <p className="text-sm text-gray-400 mb-6">
            {records.length === 0 ? 'Start by adding your first medical record.' : 'Try adjusting your search or filter.'}
          </p>
          {records.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
            >
              Add First Record
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(record => {
            const type = RECORD_TYPE_LABELS[record.record_type] || RECORD_TYPE_LABELS.other;
            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all p-5 flex items-start gap-4 group"
              >
                {/* Type Icon */}
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${colorMap[type.color]}`}>
                  {type.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{record.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        {record.doctor_name && (
                          <span className="flex items-center gap-1">
                            <User size={11} /> {record.doctor_name}
                          </span>
                        )}
                        {record.visit_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} /> {new Date(record.visit_date).toLocaleDateString()}
                          </span>
                        )}
                        <span>{new Date(record.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${colorMap[type.color]}`}>
                      {type.icon} {type.label}
                    </span>
                  </div>
                  {record.diagnosis && (
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">
                      <span className="font-semibold text-gray-600">Dx:</span> {record.diagnosis}
                    </p>
                  )}
                  {record.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{record.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => setViewRecord(record)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => setShareRecord(record)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition"
                    title="Share QR Link"
                  >
                    <Share2 size={16} />
                  </button>
                  {record.file_url && (
                    <a
                      href={record.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                      title="Download File"
                    >
                      <Download size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(record.id)}
                    disabled={deleting === record.id}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                    title="Delete Record"
                  >
                    {deleting === record.id
                      ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                      : <Trash2 size={16} />
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddRecordModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchRecords}
        />
      )}
      {viewRecord && <ViewRecordModal record={viewRecord} onClose={() => setViewRecord(null)} />}
      {shareRecord && <ShareModal record={shareRecord} onClose={() => setShareRecord(null)} />}
    </div>
  );
}
