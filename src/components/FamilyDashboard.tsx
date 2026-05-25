import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, HeartPulse, UserPlus, X, AlertCircle,
  FileText, CheckCircle, Stethoscope, FlaskConical, Pill, Scan
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { familyAPI, recordsAPI } from '../api';
import type { FamilyMember, MedicalRecord, RecordType } from '../types';

const TYPE_COLORS: Record<RecordType, string> = {
  diagnosis:    'bg-blue-100 text-blue-700',
  lab:          'bg-purple-100 text-purple-700',
  prescription: 'bg-emerald-100 text-emerald-700',
  imaging:      'bg-orange-100 text-orange-700',
  other:        'bg-gray-100 text-gray-600',
};

export default function FamilyDashboard() {
  const { user } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [relationship, setRelationship] = useState('parent');
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [memberRecords, setMemberRecords] = useState<MedicalRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await familyAPI.members();
      setMembers(data);
    } catch (err: any) {
      console.error('fetchMembers error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newMemberId.trim()) { setError('Please enter a valid Patient ID'); return; }
    setLinking(true);
    try {
      const result = await familyAPI.link(newMemberId.trim(), relationship);
      setSuccess(`✅ ${result.data.full_name || 'Member'} linked successfully!`);
      setNewMemberId('');
      setShowAddForm(false);
      fetchMembers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to link family member. Check the ID.');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (linkedId: string) => {
    if (!confirm('Remove this family member?')) return;
    try {
      await familyAPI.unlink(linkedId);
      if (selectedMember?.linked_user_id === linkedId) {
        setSelectedMember(null);
        setMemberRecords([]);
      }
      setMembers(prev => prev.filter(m => m.linked_user_id !== linkedId));
    } catch (err: any) {
      alert('Could not remove: ' + err.message);
    }
  };

  const handleViewRecords = async (member: FamilyMember) => {
    setSelectedMember(member);
    setLoadingRecords(true);
    setMemberRecords([]);
    try {
      const records = await recordsAPI.familyRecords(member.linked_user_id);
      setMemberRecords(records);
    } catch (err: any) {
      console.error('familyRecords error:', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family Hub</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monitor the health records of your linked family members.
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setError(''); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
        >
          <UserPlus size={16} /> Add Member
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2 text-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center gap-2 text-sm">
          <CheckCircle size={18} /> {success}
        </div>
      )}

      {/* Add Member Form */}
      {showAddForm && (
        <div className="mb-6 bg-white rounded-2xl border border-blue-100 shadow-lg p-6 relative">
          <button
            onClick={() => { setShowAddForm(false); setError(''); }}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X size={18} />
          </button>
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-blue-600" /> Link Family Member
          </h2>
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-xl text-xs leading-relaxed border border-blue-100">
            💡 Ask your family member to go to <strong>Account</strong> in their dashboard and copy their <strong>MyLife User ID</strong>.
          </div>
          <form onSubmit={handleAddMember} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Patient MyLife ID *
              </label>
              <input
                type="text"
                required
                value={newMemberId}
                onChange={e => setNewMemberId(e.target.value)}
                placeholder="e.g. 550e8400-e29b-41d4-a716-..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Relationship
              </label>
              <select
                value={relationship}
                onChange={e => setRelationship(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 transition"
              >
                {['parent', 'child', 'spouse', 'sibling', 'grandparent', 'grandchild', 'other'].map(r => (
                  <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={linking}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {linking ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus size={16} />}
                {linking ? 'Linking...' : 'Link Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Member Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <Users size={40} className="text-gray-100 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">No family members linked yet.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Add First Member
            </button>
          </div>
        ) : (
          members.map(member => (
            <div
              key={member.linked_user_id}
              onClick={() => handleViewRecords(member)}
              className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all relative group ${
                selectedMember?.linked_user_id === member.linked_user_id
                  ? 'border-blue-300 ring-2 ring-blue-100'
                  : 'border-gray-100 hover:border-blue-200'
              }`}
            >
              {/* Remove button */}
              <button
                onClick={e => { e.stopPropagation(); handleUnlink(member.linked_user_id); }}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                title="Remove family member"
              >
                <X size={14} />
              </button>

              <div className="flex items-center gap-3 mb-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {(member.full_name || member.relationship)[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  {/* ✅ Fixed: shows full_name from backend fix */}
                  <p className="font-bold text-gray-900 truncate">
                    {member.full_name || 'Unknown Member'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                      {member.relationship}
                    </span>
                    {member.gender && (
                      <span className="text-xs text-gray-400 capitalize">{member.gender}</span>
                    )}
                  </div>
                </div>
              </div>

              {member.email && (
                <p className="text-xs text-gray-400 mb-3 truncate">{member.email}</p>
              )}

              <div className="flex justify-between items-center text-sm">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <HeartPulse size={12} className="text-rose-400" />
                  {member.role || 'patient'}
                </span>
                <span className="text-xs text-blue-600 font-semibold">
                  {selectedMember?.linked_user_id === member.linked_user_id ? 'Viewing records ↓' : 'View records →'}
                </span>
              </div>
            </div>
          ))
        )}

        {/* Add card */}
        {!isLoading && (
          <div
            onClick={() => setShowAddForm(true)}
            className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-5 flex flex-col justify-center items-center text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
          >
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-2 group-hover:scale-110 transition-transform">
              <UserPlus size={22} />
            </div>
            <p className="font-semibold text-blue-700 text-sm">Add Family Member</p>
            <p className="text-xs text-gray-400 mt-0.5">Link a patient account</p>
          </div>
        )}
      </div>

      {/* Member Records Panel */}
      {selectedMember && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">
              📋 {selectedMember.full_name || 'Member'}'s Medical Records
            </h3>
            <button
              onClick={() => { setSelectedMember(null); setMemberRecords([]); }}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6">
            {loadingRecords ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : memberRecords.length > 0 ? (
              <div className="space-y-3">
                {memberRecords.map(record => (
                  <div key={record.id} className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* ✅ Fixed: uses record.title and record.record_type (not record.type) */}
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{record.title}</h4>
                      {record.diagnosis && (
                        <p className="text-xs text-blue-600 mt-0.5">
                          <span className="font-semibold">Dx:</span> {record.diagnosis}
                        </p>
                      )}
                      {record.doctor_name && (
                        <p className="text-xs text-gray-400 mt-0.5">Dr. {record.doctor_name}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{record.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[record.record_type] || 'bg-gray-100 text-gray-600'}`}>
                        {record.record_type}
                      </span>
                      <p className="text-xs text-gray-300 mt-1">{new Date(record.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <FileText size={36} className="text-gray-100 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No medical records found for this member.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}