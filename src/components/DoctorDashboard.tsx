import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Calendar, CalendarPlus, CheckCircle2,
  XCircle, Clock, ChevronRight, RefreshCw, AlertCircle, User
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { appointmentsAPI } from '../api';
import type { Appointment, AppointmentStatus } from '../types';

interface DoctorDashboardProps {
  setActiveTab?: (tab: any) => void;
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700',   icon: <Clock size={12} /> },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700',     icon: <CheckCircle2 size={12} /> },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={12} /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500',     icon: <XCircle size={12} /> },
};

export default function DoctorDashboard({ setActiveTab }: DoctorDashboardProps) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await appointmentsAPI.doctorAppointments();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const pending   = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed');
  const completed = appointments.filter(a => a.status === 'completed');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dr. {user?.full_name?.split(' ')[1] || user?.full_name} 👨‍⚕️
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your patient appointments and reports.</p>
        </div>
        <button onClick={fetchAppointments} className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 transition self-start">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
          <p className="text-2xl font-black text-amber-700">{loading ? '—' : pending.length}</p>
          <p className="text-xs font-semibold text-amber-500 mt-0.5">Pending</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
          <p className="text-2xl font-black text-blue-700">{loading ? '—' : confirmed.length}</p>
          <p className="text-xs font-semibold text-blue-500 mt-0.5">Confirmed</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
          <p className="text-2xl font-black text-emerald-700">{loading ? '—' : completed.length}</p>
          <p className="text-xs font-semibold text-emerald-500 mt-0.5">Completed</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2 text-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Pending Appointments – Action Required */}
      {!loading && pending.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5 mb-6">
          <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2 text-sm">
            <Clock size={16} /> {pending.length} Pending Request{pending.length !== 1 ? 's' : ''} – Action Required
          </h3>
          <div className="space-y-3">
            {pending.map(appt => (
              <div key={appt.id} className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                    {appt.patient_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{appt.patient_name}</p>
                    <p className="text-xs text-gray-400">{appt.patient_email} {appt.patient_gender ? `· ${appt.patient_gender}` : ''}</p>
                    <p className="text-xs text-amber-600 mt-1 font-medium">
                      📅 {new Date(appt.scheduled_at).toLocaleString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                    {appt.reason && <p className="text-xs text-gray-500 mt-1 italic">"{appt.reason}"</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => updateStatus(appt.id, 'confirmed')}
                    disabled={updating === appt.id}
                    className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-1 disabled:opacity-60"
                  >
                    <CheckCircle2 size={12} /> Confirm
                  </button>
                  <button
                    onClick={() => updateStatus(appt.id, 'cancelled')}
                    disabled={updating === appt.id}
                    className="flex-1 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1 disabled:opacity-60"
                  >
                    <XCircle size={12} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Appointments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm">All Appointments</h3>
          <button
            onClick={() => setActiveTab?.('appointments')}
            className="text-xs text-blue-500 font-semibold hover:underline flex items-center gap-1"
          >
            Manage All <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={36} className="text-gray-100 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No appointments yet.</p>
            <p className="text-xs text-gray-300 mt-1">Patients will appear here when they book with you.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {appointments.slice(0, 6).map(appt => {
              const statusCfg = STATUS_CONFIG[appt.status];
              return (
                <div key={appt.id} className="px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                    {appt.patient_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{appt.patient_name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(appt.scheduled_at).toLocaleString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.color}`}>
                    {statusCfg.icon} {statusCfg.label}
                  </span>
                  {appt.status === 'confirmed' && (
                    <button
                      onClick={() => updateStatus(appt.id, 'completed')}
                      disabled={updating === appt.id}
                      className="ml-2 text-xs bg-emerald-600 text-white px-2 py-1 rounded-lg hover:bg-emerald-700 transition disabled:opacity-60"
                    >
                      Done
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
