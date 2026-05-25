import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarPlus, User, Clock, CheckCircle, XCircle, AlertCircle,
  Calendar, Plus, X, Stethoscope, ChevronRight, Filter, RefreshCw
} from 'lucide-react';
import { appointmentsAPI, authAPI } from '../api';
import { useAuth } from '../AuthContext';
import type { Appointment, AppointmentCreatePayload, AppointmentStatus, Doctor } from '../types';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700',   icon: <Clock size={12} /> },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700',     icon: <CheckCircle size={12} /> },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={12} /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500',     icon: <XCircle size={12} /> },
};

// ── Book Appointment Modal ─────────────────────────────────
function BookAppointmentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [docLoading, setDocLoading] = useState(true);
  const [form, setForm] = useState<AppointmentCreatePayload>({
    doctor_id: '', scheduled_at: '', reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'pick-doctor' | 'pick-time'>('pick-doctor');

  useEffect(() => {
    authAPI.listDoctors()
      .then(setDoctors)
      .catch(err => setError(err.message || 'Could not load doctors'))
      .finally(() => setDocLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await appointmentsAPI.book(form);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedDoc = doctors.find(d => d.id === form.doctor_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CalendarPlus size={20} className="text-blue-600" /> Book Appointment
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 px-6 pt-4">
          {(['pick-doctor', 'pick-time'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                step === s ? 'bg-blue-600 text-white' : 
                (i === 1 && step === 'pick-time') ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
              }`}>{i + 1}</div>
              <span className="text-xs text-gray-500 capitalize">{s.replace('-', ' ')}</span>
              {i === 0 && <ChevronRight size={14} className="text-gray-300" />}
            </div>
          ))}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 border border-red-100">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {step === 'pick-doctor' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">Select a doctor</p>
              {docLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No doctors registered yet on MyLife.
                </div>
              ) : (
                doctors.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => { setForm(f => ({ ...f, doctor_id: doc.id })); setStep('pick-time'); }}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition hover:border-blue-300 hover:bg-blue-50 ${
                      form.doctor_id === doc.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                      {doc.full_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{doc.full_name}</p>
                      <p className="text-xs text-gray-400">{doc.email}</p>
                    </div>
                    <ChevronRight size={18} className="ml-auto text-gray-300" />
                  </button>
                ))
              )}
            </div>
          )}

          {step === 'pick-time' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {selectedDoc && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                    {selectedDoc.full_name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">{selectedDoc.full_name}</p>
                    <button type="button" onClick={() => setStep('pick-doctor')} className="text-xs text-blue-500 hover:underline">
                      Change doctor
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Date & Time *
                </label>
                <input
                  required
                  type="datetime-local"
                  value={form.scheduled_at}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Reason for Visit
                </label>
                <textarea
                  rows={3}
                  value={form.reason || ''}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Briefly describe your symptoms or reason..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none transition"
                />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('pick-doctor')}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                  Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CalendarPlus size={16} />}
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main AppointmentView ──────────────────────────────────────
export default function AppointmentView() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const isDoctor = user?.role === 'doctor';

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = isDoctor
        ? await appointmentsAPI.doctorAppointments()
        : await appointmentsAPI.myAppointments();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [isDoctor]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    setUpdating(id);
    try {
      const updated = await appointmentsAPI.update(id, { status });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally {
      setUpdating(null);
    }
  };

  const cancelAppointment = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    await updateStatus(id, 'cancelled');
  };

  const filtered = appointments.filter(a => filterStatus === 'all' || a.status === filterStatus);

  const counts = {
    pending:   appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar size={24} className="text-blue-600" />
            {isDoctor ? 'Patient Appointments' : 'My Appointments'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isDoctor ? 'Manage your patient appointment queue.' : 'View and book appointments with doctors.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAppointments} className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
            <RefreshCw size={16} />
          </button>
          {!isDoctor && (
            <button
              onClick={() => setShowBookModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
            >
              <Plus size={16} /> Book Appointment
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending', count: counts.pending, color: 'bg-amber-50 border-amber-100 text-amber-700' },
          { label: 'Confirmed', count: counts.confirmed, color: 'bg-blue-50 border-blue-100 text-blue-700' },
          { label: 'Completed', count: counts.completed, color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.color}`}>
            <p className="text-2xl font-black">{s.count}</p>
            <p className="text-xs font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition ${
              filterStatus === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2 text-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Calendar size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">No appointments found</h3>
          {!isDoctor && (
            <button onClick={() => setShowBookModal(true)}
              className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
              Book Your First Appointment
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(appt => {
            const statusCfg = STATUS_CONFIG[appt.status];
            const isUpcoming = new Date(appt.scheduled_at) > new Date();
            return (
              <div
                key={appt.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md ${
                  appt.status === 'cancelled' ? 'opacity-60 border-gray-100' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                    {isDoctor
                      ? (appt.patient_name?.[0] || '?').toUpperCase()
                      : (appt.doctor_name?.[0] || 'D').toUpperCase()
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {isDoctor
                            ? `Patient: ${appt.patient_name || 'Unknown'}`
                            : `Dr. ${appt.doctor_name || 'Unknown'}`
                          }
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {isDoctor ? appt.patient_email : appt.doctor_email}
                          {isDoctor && appt.patient_gender && ` · ${appt.patient_gender}`}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusCfg.color}`}>
                        {statusCfg.icon} {statusCfg.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(appt.scheduled_at).toLocaleString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      {isUpcoming && appt.status !== 'cancelled' && (
                        <span className="text-blue-500 font-medium">Upcoming</span>
                      )}
                    </div>

                    {appt.reason && (
                      <p className="text-xs text-gray-500 mt-1.5 italic">"{appt.reason}"</p>
                    )}
                    {appt.notes && (
                      <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded-lg px-2.5 py-1">
                        <span className="font-semibold">Note:</span> {appt.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Doctor Actions */}
                {isDoctor && appt.status === 'pending' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => updateStatus(appt.id, 'confirmed')}
                      disabled={updating === appt.id}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <CheckCircle size={14} /> Confirm
                    </button>
                    <button
                      onClick={() => updateStatus(appt.id, 'cancelled')}
                      disabled={updating === appt.id}
                      className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <XCircle size={14} /> Decline
                    </button>
                  </div>
                )}
                {isDoctor && appt.status === 'confirmed' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => updateStatus(appt.id, 'completed')}
                      disabled={updating === appt.id}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <CheckCircle size={14} /> Mark Completed
                    </button>
                  </div>
                )}

                {/* Patient Actions */}
                {!isDoctor && appt.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => cancelAppointment(appt.id)}
                      disabled={updating === appt.id}
                      className="w-full py-2 border border-red-200 text-red-500 rounded-xl text-xs font-semibold hover:bg-red-50 transition"
                    >
                      Cancel Appointment
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showBookModal && (
        <BookAppointmentModal
          onClose={() => setShowBookModal(false)}
          onSuccess={fetchAppointments}
        />
      )}
    </div>
  );
}
