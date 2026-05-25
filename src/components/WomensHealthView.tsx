import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart, Calendar, Plus, X, CheckCircle, AlertCircle,
  TrendingUp, Baby, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import { healthAPI } from '../api';
import type { MenstrualCycle, MenstrualCyclePayload, PregnancyRecord, PregnancyPayload } from '../types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

function calcNextPeriod(cycles: MenstrualCycle[]): string | null {
  if (cycles.length < 1) return null;
  const latest = cycles[0];
  const avgLength = cycles.slice(0, 3).reduce((sum, c) => sum + (c.cycle_length || 28), 0) / Math.min(cycles.length, 3);
  const nextDate = new Date(latest.start_date);
  nextDate.setDate(nextDate.getDate() + Math.round(avgLength));
  return nextDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function calcDaysPregnant(lmpDate: string): number {
  const now = new Date();
  const lmp = new Date(lmpDate);
  return Math.floor((now.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
}

export default function WomensHealthView() {
  const [cycles, setCycles] = useState<MenstrualCycle[]>([]);
  const [pregnancies, setPregnancies] = useState<PregnancyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cycle' | 'pregnancy'>('cycle');
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [showPregnancyForm, setShowPregnancyForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cycle form
  const [cycleForm, setCycleForm] = useState<MenstrualCyclePayload>({ start_date: '' });
  const [cycleLoading, setCycleLoading] = useState(false);

  // Pregnancy form
  const [pregnancyForm, setPregnancyForm] = useState<PregnancyPayload>({ lmp_date: '' });
  const [pregnancyLoading, setPregnancyLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        healthAPI.getCycles().catch(() => [] as MenstrualCycle[]),
        healthAPI.getPregnancy().catch(() => [] as PregnancyRecord[]),
      ]);
      setCycles(c);
      setPregnancies(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setCycleLoading(true);
    setError('');
    try {
      await healthAPI.logCycle(cycleForm);
      setSuccess('Cycle logged successfully!');
      setShowCycleForm(false);
      setCycleForm({ start_date: '' });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to log cycle');
    } finally {
      setCycleLoading(false);
    }
  };

  const handleLogPregnancy = async (e: React.FormEvent) => {
    e.preventDefault();
    setPregnancyLoading(true);
    setError('');
    try {
      await healthAPI.logPregnancy(pregnancyForm);
      setSuccess('Pregnancy record added!');
      setShowPregnancyForm(false);
      setPregnancyForm({ lmp_date: '' });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to log pregnancy');
    } finally {
      setPregnancyLoading(false);
    }
  };

  const nextPeriod = calcNextPeriod(cycles);
  const avgCycleLength = cycles.length > 0
    ? Math.round(cycles.slice(0, 6).reduce((s, c) => s + (c.cycle_length || 28), 0) / Math.min(cycles.length, 6))
    : null;

  const chartData = cycles.slice(0, 6).reverse().map((c, i) => ({
    cycle: `Cycle ${i + 1}`,
    length: c.cycle_length || 28,
    start: new Date(c.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-rose-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Heart size={24} className="text-rose-500" /> Women's Health
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Track your menstrual cycle, fertility window, and pregnancy journey.</p>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-2 text-sm">
          <CheckCircle size={18} /> {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2 text-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
        {(['cycle', 'pregnancy'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'cycle' ? '🌙 Cycle' : '🤰 Pregnancy'}
          </button>
        ))}
      </div>

      {activeTab === 'cycle' && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-lg shadow-rose-100">
              <p className="text-rose-100 text-xs font-semibold uppercase tracking-widest mb-1">Next Period</p>
              <p className="text-xl font-bold">{nextPeriod || '—'}</p>
              {nextPeriod && (
                <p className="text-rose-200 text-xs mt-1">
                  {daysUntil(nextPeriod) > 0
                    ? `in ${daysUntil(nextPeriod)} days`
                    : daysUntil(nextPeriod) === 0 ? 'Today!' : `${Math.abs(daysUntil(nextPeriod))} days ago`}
                </p>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Avg Cycle Length</p>
              <p className="text-3xl font-black text-rose-600">{avgCycleLength ?? '—'}<span className="text-sm font-normal text-gray-400 ml-1">days</span></p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Cycles Logged</p>
              <p className="text-3xl font-black text-gray-800">{cycles.length}</p>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Cycle Length History</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="cycleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="start" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} domain={[20, 40]} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="length" stroke="#F43F5E" strokeWidth={3} fill="url(#cycleGrad)" name="Cycle Length (days)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Log Cycle Button */}
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Cycle History</h3>
            <button
              onClick={() => setShowCycleForm(!showCycleForm)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition"
            >
              <Plus size={16} /> Log Cycle
            </button>
          </div>

          {/* Cycle Form */}
          {showCycleForm && (
            <form onSubmit={handleLogCycle} className="bg-rose-50 border border-rose-100 rounded-2xl p-5 space-y-4">
              <h4 className="font-bold text-rose-800 text-sm">New Cycle Entry</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-rose-600 mb-1.5 uppercase tracking-wider">Start Date *</label>
                  <input
                    type="date" required
                    value={cycleForm.start_date}
                    onChange={e => setCycleForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full border border-rose-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400 bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-rose-600 mb-1.5 uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    value={cycleForm.end_date || ''}
                    onChange={e => setCycleForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full border border-rose-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400 bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-rose-600 mb-1.5 uppercase tracking-wider">Cycle Length (days)</label>
                  <input
                    type="number" min={15} max={60}
                    value={cycleForm.cycle_length || ''}
                    onChange={e => setCycleForm(f => ({ ...f, cycle_length: Number(e.target.value) }))}
                    placeholder="e.g. 28"
                    className="w-full border border-rose-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400 bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-rose-600 mb-1.5 uppercase tracking-wider">Notes</label>
                  <input
                    type="text"
                    value={cycleForm.notes || ''}
                    onChange={e => setCycleForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="e.g. Light flow, cramping..."
                    className="w-full border border-rose-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400 bg-white transition"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCycleForm(false)}
                  className="flex-1 py-2 border border-rose-200 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-100 transition">
                  Cancel
                </button>
                <button type="submit" disabled={cycleLoading}
                  className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {cycleLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  {cycleLoading ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          )}

          {/* Cycle History List */}
          <div className="space-y-3">
            {cycles.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-rose-200">
                <Heart size={36} className="text-rose-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No cycles logged yet. Start tracking today!</p>
              </div>
            ) : (
              cycles.map(cycle => (
                <div key={cycle.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">
                      Started {new Date(cycle.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      {cycle.end_date && <span>Ended {new Date(cycle.end_date).toLocaleDateString()}</span>}
                      {cycle.cycle_length && <span className="font-medium text-rose-500">{cycle.cycle_length}-day cycle</span>}
                      {cycle.notes && <span>{cycle.notes}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'pregnancy' && (
        <div className="space-y-6">
          {/* Active Pregnancy Card */}
          {pregnancies.length > 0 && (
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg shadow-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <Baby size={20} />
                <p className="font-bold text-sm uppercase tracking-widest text-purple-100">Latest Pregnancy Record</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-purple-200 text-xs mb-1">LMP Date</p>
                  <p className="text-xl font-bold">{new Date(pregnancies[0].lmp_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-xs mb-1">Days Pregnant</p>
                  <p className="text-xl font-bold">{calcDaysPregnant(pregnancies[0].lmp_date)} days</p>
                  <p className="text-purple-200 text-xs">{Math.floor(calcDaysPregnant(pregnancies[0].lmp_date) / 7)} weeks</p>
                </div>
                {pregnancies[0].due_date && (
                  <div className="col-span-2">
                    <p className="text-purple-200 text-xs mb-1">Due Date</p>
                    <p className="text-lg font-bold">{new Date(pregnancies[0].due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add Record */}
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Pregnancy Records</h3>
            <button
              onClick={() => setShowPregnancyForm(!showPregnancyForm)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition"
            >
              <Plus size={16} /> Add Record
            </button>
          </div>

          {showPregnancyForm && (
            <form onSubmit={handleLogPregnancy} className="bg-purple-50 border border-purple-100 rounded-2xl p-5 space-y-4">
              <h4 className="font-bold text-purple-800 text-sm">New Pregnancy Record</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-purple-600 mb-1.5 uppercase tracking-wider">LMP Date (Last Period) *</label>
                  <input type="date" required
                    value={pregnancyForm.lmp_date}
                    onChange={e => setPregnancyForm(f => ({ ...f, lmp_date: e.target.value }))}
                    className="w-full border border-purple-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-600 mb-1.5 uppercase tracking-wider">Expected Due Date</label>
                  <input type="date"
                    value={pregnancyForm.due_date || ''}
                    onChange={e => setPregnancyForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full border border-purple-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white transition"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-purple-600 mb-1.5 uppercase tracking-wider">Notes</label>
                  <input type="text"
                    value={pregnancyForm.notes || ''}
                    onChange={e => setPregnancyForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="e.g. Confirmed by ultrasound..."
                    className="w-full border border-purple-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white transition"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPregnancyForm(false)}
                  className="flex-1 py-2 border border-purple-200 rounded-xl text-sm font-semibold text-purple-600 hover:bg-purple-100 transition">
                  Cancel
                </button>
                <button type="submit" disabled={pregnancyLoading}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {pregnancyLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Baby size={15} />}
                  {pregnancyLoading ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          )}

          {pregnancies.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-purple-200">
              <Baby size={36} className="text-purple-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No pregnancy records yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pregnancies.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                    <Baby size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">LMP: {new Date(p.lmp_date).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.due_date ? `Due: ${new Date(p.due_date).toLocaleDateString()}` : 'No due date set'}
                      {p.notes && ` · ${p.notes}`}
                    </p>
                  </div>
                  <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-semibold flex-shrink-0">
                    {calcDaysPregnant(p.lmp_date)}d
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
