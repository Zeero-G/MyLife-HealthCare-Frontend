import React, { useEffect, useState } from 'react';
import { AlertTriangle, Droplets, Pill, Activity, Shield } from 'lucide-react';
import { emergencyAPI } from '../api';
import type { EmergencyPublicProfile } from '../types';

interface EmergencyPublicViewProps {
  token: string;
}

export default function EmergencyPublicView({ token }: EmergencyPublicViewProps) {
  const [profile, setProfile] = useState<EmergencyPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await emergencyAPI.getPublicByToken(token);
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load emergency information.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="w-10 h-10 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 shadow-lg p-8 text-center">
          <AlertTriangle size={40} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">Emergency access unavailable</h1>
          <p className="text-sm text-gray-600">{error || 'Invalid or expired link.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Shield size={22} className="text-red-600" />
          <h1 className="text-xl font-bold text-red-800">Emergency medical summary</h1>
        </div>
        <p className="text-xs text-red-700/80 mb-6 bg-red-100/80 border border-red-200 rounded-xl px-3 py-2">
          For emergency responders only. Contact details are not shown on this public view.
        </p>

        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg mb-4">
          <p className="text-red-100 text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-1">
            <Droplets size={14} /> Blood type
          </p>
          <p className="text-5xl font-black">{profile.blood_type || '—'}</p>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Allergies', icon: <AlertTriangle size={16} className="text-orange-500" />, items: profile.allergies, color: 'bg-orange-100 text-orange-800' },
            { label: 'Chronic conditions', icon: <Activity size={16} className="text-red-500" />, items: profile.chronic_conditions, color: 'bg-red-100 text-red-800' },
            { label: 'Current medications', icon: <Pill size={16} className="text-green-600" />, items: profile.current_medications, color: 'bg-emerald-100 text-emerald-800' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                {card.icon} {card.label}
              </h2>
              {card.items.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {card.items.map((item) => (
                    <span key={item} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${card.color}`}>
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">None recorded.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
