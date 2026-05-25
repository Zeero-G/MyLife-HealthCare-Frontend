import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Phone, AlertTriangle, Droplets, Pill,
  Activity, Edit3, Save, X, Plus, Trash2, CheckCircle, AlertCircle
} from 'lucide-react';
import { emergencyAPI } from '../api';
import { useAuth } from '../AuthContext';
import type { EmergencyProfile, EmergencyProfilePayload } from '../types';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function TagInput({
  label, icon, values, onChange, placeholder, color = 'blue'
}: {
  label: string; icon: React.ReactNode; values: string[];
  onChange: (v: string[]) => void; placeholder: string; color?: string;
}) {
  const [input, setInput] = useState('');
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    green: 'bg-emerald-100 text-emerald-700',
  };
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) { onChange([...values, v]); setInput(''); }
  };
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
        {icon} {label}
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map(v => (
          <span key={v} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colorMap[color]}`}>
            {v}
            <button onClick={() => onChange(values.filter(x => x !== v))} className="hover:opacity-70">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition text-sm font-semibold"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

export default function EmergencyView() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState<EmergencyProfilePayload>({
    blood_type: '',
    allergies: [],
    chronic_conditions: [],
    emergency_contact_name: '',
    emergency_contact_phone: '',
    current_medications: [],
  });

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const data = await emergencyAPI.getProfile(user.id);
      setProfile(data);
      setForm({
        blood_type: data.blood_type || '',
        allergies: data.allergies || [],
        chronic_conditions: data.chronic_conditions || [],
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        current_medications: data.current_medications || [],
      });
    } catch {
      // No profile yet – that's fine, show create form
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const saved = await emergencyAPI.upsert(form);
      setProfile(saved);
      setEditing(false);
      setSuccess('Emergency profile saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    if (profile) {
      setForm({
        blood_type: profile.blood_type || '',
        allergies: [...(profile.allergies || [])],
        chronic_conditions: [...(profile.chronic_conditions || [])],
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
        current_medications: [...(profile.current_medications || [])],
      });
    }
    setEditing(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield size={24} className="text-red-500" /> Emergency Profile
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Critical medical info for emergency responders.
            {user && (
              <span className="ml-1 text-xs text-blue-500 font-medium">
                Public QR: /emergency/profile/{user.id.slice(0, 8)}...
              </span>
            )}
          </p>
        </div>
        {profile && !editing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            <Edit3 size={15} /> Edit Profile
          </button>
        )}
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

      {/* Emergency Alert Banner */}
      <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
        <div className="p-2 bg-red-100 rounded-xl text-red-600 flex-shrink-0">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h3 className="font-bold text-red-800 text-sm">Emergency Responder Access</h3>
          <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
            This profile is publicly accessible via your QR code for emergency responders.
            Only include information you are comfortable sharing in an emergency.
          </p>
        </div>
      </div>

      {/* Edit Form or View */}
      {(editing || !profile) ? (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            {/* Blood Type */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <Droplets size={14} className="text-red-500" /> Blood Type
              </label>
              <div className="flex flex-wrap gap-2">
                {BLOOD_TYPES.map(bt => (
                  <button
                    key={bt}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, blood_type: bt }))}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition border ${
                      form.blood_type === bt
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    {bt}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  <Phone size={14} className="text-blue-500" /> Contact Name
                </label>
                <input
                  type="text"
                  value={form.emergency_contact_name || ''}
                  onChange={e => setForm(f => ({ ...f, emergency_contact_name: e.target.value }))}
                  placeholder="e.g. Saman Perera"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  <Phone size={14} className="text-blue-500" /> Contact Phone
                </label>
                <input
                  type="tel"
                  value={form.emergency_contact_phone || ''}
                  onChange={e => setForm(f => ({ ...f, emergency_contact_phone: e.target.value }))}
                  placeholder="+94 71 234 5678"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <TagInput
              label="Known Allergies"
              icon={<AlertTriangle size={14} className="text-orange-500" />}
              values={form.allergies || []}
              onChange={v => setForm(f => ({ ...f, allergies: v }))}
              placeholder="e.g. Penicillin, Peanuts... (press Enter)"
              color="orange"
            />

            <TagInput
              label="Chronic Conditions"
              icon={<Activity size={14} className="text-red-500" />}
              values={form.chronic_conditions || []}
              onChange={v => setForm(f => ({ ...f, chronic_conditions: v }))}
              placeholder="e.g. Diabetes, Hypertension... (press Enter)"
              color="red"
            />

            <TagInput
              label="Current Medications"
              icon={<Pill size={14} className="text-green-500" />}
              values={form.current_medications || []}
              onChange={v => setForm(f => ({ ...f, current_medications: v }))}
              placeholder="e.g. Metformin 500mg... (press Enter)"
              color="green"
            />
          </div>

          <div className="flex gap-3">
            {profile && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : (profile ? 'Save Changes' : 'Create Emergency Profile')}
            </button>
          </div>
        </form>
      ) : (
        /* View Mode */
        <div className="space-y-4">
          {/* Blood Type Hero Card */}
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg shadow-red-100">
            <p className="text-red-100 text-xs font-semibold uppercase tracking-widest mb-1">Blood Type</p>
            <p className="text-5xl font-black">{profile.blood_type || '—'}</p>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Phone size={14} /> Emergency Contact
            </h3>
            {profile.emergency_contact_name || profile.emergency_contact_phone ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {profile.emergency_contact_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{profile.emergency_contact_name || '—'}</p>
                  <p className="text-sm text-blue-600 font-medium">{profile.emergency_contact_phone || '—'}</p>
                </div>
              </div>
            ) : <p className="text-sm text-gray-400">No emergency contact set.</p>}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Allergies', icon: <AlertTriangle size={16} className="text-orange-500" />, items: profile.allergies, color: 'bg-orange-100 text-orange-700' },
              { label: 'Conditions', icon: <Activity size={16} className="text-red-500" />, items: profile.chronic_conditions, color: 'bg-red-100 text-red-700' },
              { label: 'Medications', icon: <Pill size={16} className="text-green-500" />, items: profile.current_medications, color: 'bg-emerald-100 text-emerald-700' },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  {card.icon} {card.label}
                </h3>
                {card.items && card.items.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {card.items.map(item => (
                      <span key={item} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${card.color}`}>{item}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">None recorded.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
