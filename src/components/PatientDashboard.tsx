import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText, Shield, CalendarDays, Plus, ChevronRight,
  Calendar, Heart, TrendingUp, Activity
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { recordsAPI, healthAPI, appointmentsAPI } from '../api';
import type { MedicalRecord, MenstrualCycle, Appointment } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

const mockHealthData = [
  { month: 'Jan', heartRate: 72, bpSys: 120 },
  { month: 'Feb', heartRate: 74, bpSys: 118 },
  { month: 'Mar', heartRate: 70, bpSys: 122 },
  { month: 'Apr', heartRate: 73, bpSys: 119 },
];

interface PatientDashboardProps {
  setActiveTab?: (tab: any) => void;
}

export default function PatientDashboard({ setActiveTab }: PatientDashboardProps) {
  const { user } = useAuth();
  const isFemale = user?.gender === 'female';

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [cycles, setCycles] = useState<MenstrualCycle[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [recs, appts, cycs] = await Promise.all([
      recordsAPI.list().catch(() => [] as MedicalRecord[]),
      appointmentsAPI.myAppointments().catch(() => [] as Appointment[]),
      isFemale ? healthAPI.getCycles().catch(() => [] as MenstrualCycle[]) : Promise.resolve([] as MenstrualCycle[]),
    ]);
    setRecords(recs);
    setAppointments(appts);
    setCycles(cycs);
    setLoading(false);
  }, [isFemale]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const upcomingAppointment = appointments
    .filter(a => a.status !== 'cancelled' && new Date(a.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];

  const latestCycle = cycles[0];
  const daysSinceLastPeriod = latestCycle
    ? Math.floor((Date.now() - new Date(latestCycle.start_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const cycleChartData = cycles.slice(0, 6).reverse().map((c, i) => ({
    label: `C${i + 1}`,
    length: c.cycle_length || 28,
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Patient'}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Here's your health overview for today.</p>
        </div>
        <button
          onClick={() => setActiveTab?.('records')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm shadow-blue-200 flex-shrink-0"
        >
          <Plus size={16} /> Add Record
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Records */}
        <button
          onClick={() => setActiveTab?.('records')}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText size={18} />
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400 transition" />
          </div>
          <p className="text-2xl font-black text-gray-900">{loading ? '—' : records.length}</p>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">Total Records</p>
        </button>

        {/* Appointments */}
        <button
          onClick={() => setActiveTab?.('appointments')}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Calendar size={18} />
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-purple-400 transition" />
          </div>
          <p className="text-2xl font-black text-gray-900">{loading ? '—' : appointments.filter(a => a.status !== 'cancelled').length}</p>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">Appointments</p>
        </button>

        {/* Emergency Profile */}
        <button
          onClick={() => setActiveTab?.('emergency')}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md hover:border-red-200 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-50 text-red-500 rounded-xl">
              <Shield size={18} />
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-red-400 transition" />
          </div>
          <p className="text-xl font-black text-gray-900">Profile</p>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">Emergency Info</p>
        </button>

        {/* Female: Cycle / Male: Activity */}
        {isFemale ? (
          <button
            onClick={() => setActiveTab?.('womens-health')}
            className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 text-left hover:shadow-md hover:border-rose-300 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-50 rounded-full -mr-8 -mt-8" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-rose-100 text-rose-500 rounded-xl">
                  <Heart size={18} />
                </div>
                <ChevronRight size={16} className="text-rose-200 group-hover:text-rose-400 transition" />
              </div>
              <p className="text-2xl font-black text-rose-600">
                {daysSinceLastPeriod !== null ? `Day ${daysSinceLastPeriod}` : '—'}
              </p>
              <p className="text-xs text-rose-400 font-semibold mt-0.5">Cycle Day</p>
            </div>
          </button>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl w-fit mb-3">
              <Activity size={18} />
            </div>
            <p className="text-xl font-black text-emerald-600">Good</p>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">General Health</p>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Vitals Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 text-sm">Vitals Overview</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockHealthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="heartRate" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} name="Heart Rate (bpm)" />
                <Line type="monotone" dataKey="bpSys" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} name="BP Sys (mmHg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Female Cycle / Male Recent Records */}
        {isFemale && cycleChartData.length > 0 ? (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm">Cycle Length History</h3>
              <button onClick={() => setActiveTab?.('womens-health')} className="text-xs text-rose-500 font-semibold hover:underline">
                Track Now →
              </button>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cycleChartData}>
                  <defs>
                    <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FFF1F2" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#FDA4AF', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#FDA4AF', fontSize: 11 }} domain={[20, 40]} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Area type="monotone" dataKey="length" stroke="#F43F5E" strokeWidth={3} fill="url(#roseGrad)" name="Days" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm">Upcoming Appointment</h3>
              <button onClick={() => setActiveTab?.('appointments')} className="text-xs text-blue-500 font-semibold hover:underline">
                View All →
              </button>
            </div>
            {upcomingAppointment ? (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="font-bold text-blue-900 text-sm">Dr. {upcomingAppointment.doctor_name}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {new Date(upcomingAppointment.scheduled_at).toLocaleString('en-GB', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
                {upcomingAppointment.reason && (
                  <p className="text-xs text-blue-500 mt-1 italic">"{upcomingAppointment.reason}"</p>
                )}
                <span className="inline-block mt-2 text-xs bg-blue-600 text-white px-2.5 py-0.5 rounded-full font-semibold capitalize">
                  {upcomingAppointment.status}
                </span>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar size={36} className="text-gray-100 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-3">No upcoming appointments</p>
                <button
                  onClick={() => setActiveTab?.('appointments')}
                  className="text-xs bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Book Now
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Records */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-sm">Recent Medical Records</h3>
          <button onClick={() => setActiveTab?.('records')} className="text-xs text-blue-500 font-semibold hover:underline">
            View All →
          </button>
        </div>
        {records.length > 0 ? (
          <div className="space-y-3">
            {records.slice(0, 4).map(record => (
              <div
                key={record.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100 cursor-pointer"
                onClick={() => setActiveTab?.('records')}
              >
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0">
                  <FileText size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{record.title}</p>
                  <p className="text-xs text-gray-400">
                    {record.doctor_name ? `${record.doctor_name} · ` : ''}
                    {new Date(record.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs text-gray-300 capitalize flex-shrink-0">{record.record_type}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText size={36} className="text-gray-100 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-3">No medical records yet.</p>
            <button
              onClick={() => setActiveTab?.('records')}
              className="text-xs bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Add First Record
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
