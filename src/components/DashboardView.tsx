import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  UploadCloud, 
  Users, 
  AlertTriangle, 
  User as UserIcon, 
  LogOut, 
  ArrowLeft,
  Plus,
  Share2,
  Trash2,
  Activity,
  Download,
  CheckCircle2,
  AlertCircle,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { recordsAPI, familyAPI, emergencyAPI } from '../api';
import type { MedicalRecord, FamilyMember, EmergencyProfile } from '../types';

interface DashboardViewProps {
  onBackToHome: () => void;
}

type TabType = 'overview' | 'records' | 'upload' | 'family' | 'emergency' | 'account';

export default function DashboardView({ onBackToHome }: DashboardViewProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Data States
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [emergencyProfile, setEmergencyProfile] = useState<EmergencyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [recs, fam] = await Promise.all([
          recordsAPI.list().catch(() => []),
          familyAPI.members().catch(() => [])
        ]);
        setRecords(recs);
        setFamily(fam);
        if (user) {
          const profile = await emergencyAPI.getProfile(user.id).catch(() => null);
          setEmergencyProfile(profile);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    onBackToHome();
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'records', label: 'My Records', icon: FileText },
    { id: 'upload', label: 'Upload Document', icon: UploadCloud },
    { id: 'family', label: 'Family Members', icon: Users },
    { id: 'emergency', label: 'Emergency Profile', icon: AlertTriangle },
    { id: 'account', label: 'Account', icon: UserIcon },
  ] as const;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f0ee]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0ee] flex font-sans">
      
      {/* Sidebar - Desktop */}
      <aside className="w-64 hidden md:flex flex-col bg-white/60 backdrop-blur-xl border-r border-white/50 sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
              <Activity size={16} />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-800">MyLife</span>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                  activeTab === item.id 
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50' 
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                }`}
              >
                <item.icon size={18} className={activeTab === item.id ? 'text-blue-600' : 'text-slate-400'} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-2">
          <button
            onClick={onBackToHome}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-white/60 hover:text-slate-900 transition-all"
          >
            <ArrowLeft size={18} className="text-slate-400" />
            Back to Home
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
              <Activity size={16} />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-800">MyLife</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-500 bg-gray-100 rounded-full">
            <LogOut size={16} />
          </button>
        </div>
        
        {/* Mobile Nav */}
        <div className="md:hidden overflow-x-auto whitespace-nowrap p-4 border-b border-gray-200 flex gap-2 hide-scrollbar">
           {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-4 py-2 rounded-full text-[12px] font-semibold transition-all shrink-0 ${
                activeTab === item.id 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-white text-slate-600 border border-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-8 md:p-10 max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab user={user} records={records} family={family} setActiveTab={setActiveTab} />}
              {activeTab === 'records' && <RecordsTab records={records} setRecords={setRecords} />}
              {activeTab === 'upload' && <UploadTab />}
              {activeTab === 'family' && <FamilyTab family={family} setFamily={setFamily} />}
              {activeTab === 'emergency' && <EmergencyTab profile={emergencyProfile} />}
              {activeTab === 'account' && <AccountTab user={user} />}
            </>
          )}
        </div>
      </main>

    </div>
  );
}

import type { User } from '../types';

function OverviewTab({ user, records, family, setActiveTab }: { user: User, records: MedicalRecord[], family: FamilyMember[], setActiveTab: (t: TabType) => void }) {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back, {user.full_name}</h1>
        <p className="text-[14px] text-slate-500 mt-1">Here is the latest overview of your health vault.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveTab('records')}>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <FileText size={20} />
          </div>
          <h3 className="text-3xl font-black text-slate-800">{records.length}</h3>
          <p className="text-[13px] font-semibold text-slate-500">Medical Records</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveTab('family')}>
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <Users size={20} />
          </div>
          <h3 className="text-3xl font-black text-slate-800">{family.length}</h3>
          <p className="text-[13px] font-semibold text-slate-500">Linked Family</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveTab('upload')}>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <UploadCloud size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mt-2 mb-1">Upload New</h3>
          <p className="text-[13px] font-medium text-slate-500">AI extraction supported</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Recent Records</h2>
          <button onClick={() => setActiveTab('records')} className="text-[13px] font-bold text-blue-600 hover:text-blue-700">View All</button>
        </div>
        
        {records.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <FileText size={20} />
            </div>
            <p className="text-sm font-medium text-gray-900">No records found</p>
            <p className="text-xs text-gray-500 mt-1">Upload a document to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.slice(0, 5).map((rec: MedicalRecord) => (
              <div key={rec.id} className="flex items-center justify-between p-3.5 hover:bg-white/60 rounded-xl transition-all border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="text-[13.5px] font-bold text-slate-900">{rec.title}</h4>
                    <p className="text-[12px] text-slate-500 capitalize">{rec.record_type} • {rec.visit_date || 'Date unknown'}</p>
                  </div>
                </div>
                {rec.doctor_name && (
                  <div className="hidden sm:block text-right">
                    <p className="text-[12.5px] font-semibold text-slate-700">Dr. {rec.doctor_name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecordsTab({ records, setRecords }: { records: MedicalRecord[], setRecords: React.Dispatch<React.SetStateAction<MedicalRecord[]>> }) {
  const [shareQR, setShareQR] = useState<{url: string, token: string} | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await recordsAPI.delete(id);
        setRecords(records.filter((r) => r.id !== id));
      } catch (err) {
        alert('Failed to delete record');
      }
    }
  };

  const handleShare = async (id: string) => {
    try {
      const res = await recordsAPI.shareQR(id);
      setShareQR({ url: res.share_url, token: res.qr_token });
    } catch (err) {
      alert('Failed to generate share link');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Records</h1>
          <p className="text-[14px] text-slate-500 mt-1">Manage and share your medical history.</p>
        </div>
      </header>

      {shareQR && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3 relative mb-6">
          <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={18} />
          <div>
            <h4 className="text-sm font-bold text-emerald-900 mb-1">Share Link Generated</h4>
            <p className="text-[12px] text-emerald-800 mb-2">This temporary link is valid for 24 hours.</p>
            <div className="flex items-center gap-2">
              <input type="text" readOnly value={shareQR.url} className="text-xs bg-white border border-emerald-200 rounded p-1.5 w-64 focus:outline-none" />
              <button onClick={() => navigator.clipboard.writeText(shareQR.url)} className="text-xs font-bold bg-emerald-600 text-white px-2 py-1.5 rounded hover:bg-emerald-700">Copy</button>
            </div>
          </div>
          <button onClick={() => setShareQR(null)} className="absolute top-2 right-2 text-emerald-400 hover:text-emerald-600">×</button>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm overflow-hidden">
        {records.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="p-4 text-[11.5px] font-bold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="p-4 text-[11.5px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="p-4 text-[11.5px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-[11.5px] font-bold text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="p-4 text-[11.5px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-[13.5px] font-bold text-slate-800">{rec.title}</td>
                    <td className="p-4 text-[13px] text-slate-600 capitalize">
                      <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md text-[11px] font-bold">
                        {rec.record_type}
                      </span>
                    </td>
                    <td className="p-4 text-[13px] text-slate-600">{rec.visit_date || '-'}</td>
                    <td className="p-4 text-[13px] text-slate-600">{rec.doctor_name ? `Dr. ${rec.doctor_name}` : '-'}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleShare(rec.id)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors" title="Share QR">
                        <Share2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(rec.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function UploadTab() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{message: string, url?: string} | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setResult(null);
    try {
      const res = await recordsAPI.upload(file);
      setResult({ message: res.message || 'File uploaded successfully!', url: res.file_url });
      setFile(null);
    } catch (err: any) {
      setResult({ message: err.message || 'Upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">Upload Document</h1>
        <p className="text-[14px] text-slate-500 mt-1">Upload labs, prescriptions, or discharge summaries for AI extraction.</p>
      </header>

      <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <UploadCloud size={32} />
        </div>
        
        <input 
          type="file" 
          id="file-upload" 
          className="hidden" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          accept="image/*,.pdf"
        />
        
        <label 
          htmlFor="file-upload" 
          className="cursor-pointer inline-block bg-blue-500 text-white font-bold text-[13px] px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-colors mb-4"
        >
          Select File
        </label>
        
        {file && (
          <div className="text-[13px] font-semibold text-slate-700 mb-6 bg-gray-50 py-2 px-4 rounded-lg inline-block mx-auto">
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}

        {file && (
          <button 
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full sm:w-auto block mx-auto bg-slate-900 text-white font-bold text-[13px] px-8 py-2.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-70"
          >
            {isUploading ? 'Uploading & Processing...' : 'Upload & Extract Data'}
          </button>
        )}

        {result && (
          <div className={`mt-6 p-4 rounded-xl text-sm font-semibold ${result.url ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}

function FamilyTab({ family, setFamily }: { family: FamilyMember[], setFamily: React.Dispatch<React.SetStateAction<FamilyMember[]>> }) {
  const [linkId, setLinkId] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkId || !relationship) return;
    setIsLinking(true);
    try {
      const res = await familyAPI.link(linkId, relationship);
      setFamily([...family, res.data]);
      setLinkId('');
      setRelationship('');
      alert('Family member linked successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to link family member');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async (id: string) => {
    if (confirm('Unlink this family member?')) {
      try {
        await familyAPI.unlink(id);
        setFamily(family.filter((f: FamilyMember) => f.linked_user_id !== id));
      } catch (err) {
        alert('Failed to unlink');
      }
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Family Members</h1>
        <p className="text-[14px] text-slate-500 mt-1">Manage linked accounts for dependents or guardians.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Linked Accounts</h2>
          {family.length === 0 ? (
            <div className="bg-white/60 border border-white/60 p-6 rounded-2xl text-center shadow-sm">
              <p className="text-sm text-gray-500">No family members linked.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {family.map((f, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm border border-white/60 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-900">User ID: {f.linked_user_id.slice(0, 8)}...</h4>
                    <p className="text-[12px] text-slate-500 uppercase tracking-wide font-semibold mt-0.5">{f.relationship}</p>
                  </div>
                  <button onClick={() => handleUnlink(f.linked_user_id)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded transition-colors">
                    Unlink
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="bg-white/80 backdrop-blur-sm border border-white/60 p-5 rounded-2xl shadow-sm sticky top-6">
            <h3 className="text-[15px] font-bold text-slate-900 mb-4">Link New Member</h3>
            <form onSubmit={handleLink} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">User ID</label>
                <input type="text" required value={linkId} onChange={(e) => setLinkId(e.target.value)} className="w-full text-[13px] border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500" placeholder="UUID of family member" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Relationship</label>
                <select required value={relationship} onChange={(e) => setRelationship(e.target.value)} className="w-full text-[13px] border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 bg-white">
                  <option value="">Select relationship...</option>
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="spouse">Spouse</option>
                  <option value="sibling">Sibling</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button type="submit" disabled={isLinking} className="w-full bg-blue-500 text-white font-bold text-[13px] px-4 py-2.5 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-70">
                {isLinking ? 'Linking...' : 'Link Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmergencyTab({ profile }: { profile: EmergencyProfile | null }) {
  if (!profile) {
    return (
      <div className="text-center py-12">
        <AlertTriangle size={32} className="mx-auto text-yellow-500 mb-4" />
        <h2 className="text-lg font-bold text-slate-900">Emergency Profile Not Setup</h2>
        <p className="text-sm text-gray-500 mt-2">Please create an emergency profile to allow responders to bypass locks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header className="mb-6 flex items-center gap-3">
        <div className="p-2.5 bg-red-100 text-red-600 rounded-full animate-pulse">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-red-600">Emergency Smart Bypass</h1>
          <p className="text-[14px] text-slate-500 mt-1">This information is accessible to 1990 responders in critical situations.</p>
        </div>
      </header>

      <div className="bg-white/80 backdrop-blur-sm border border-red-100 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Decorator line */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <h3 className="text-[11px] font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Activity size={12} /> Blood Type
            </h3>
            <p className="text-2xl font-black text-slate-800">{profile.blood_type || 'Unknown'}</p>
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <PhoneCall size={12} /> Emergency Contact
            </h3>
            <p className="text-[15px] font-bold text-slate-800">{profile.emergency_contact_name || 'Not provided'}</p>
            <p className="text-[13px] text-slate-500 font-medium">{profile.emergency_contact_phone || ''}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Allergies</h3>
          {profile.allergies && profile.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.allergies.map((a, i) => (
                <span key={i} className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-[13px] font-semibold border border-orange-100">{a}</span>
              ))}
            </div>
          ) : <p className="text-sm text-gray-500 font-medium">None recorded</p>}
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Chronic Conditions</h3>
          {profile.chronic_conditions && profile.chronic_conditions.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {profile.chronic_conditions.map((c, i) => (
                <li key={i} className="text-[13.5px] font-semibold text-slate-800">{c}</li>
              ))}
            </ul>
          ) : <p className="text-sm text-gray-500 font-medium">None recorded</p>}
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Current Medications</h3>
          {profile.current_medications && profile.current_medications.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {profile.current_medications.map((m, i) => (
                <li key={i} className="text-[13.5px] font-semibold text-slate-800">{m}</li>
              ))}
            </ul>
          ) : <p className="text-sm text-gray-500 font-medium">None recorded</p>}
        </div>
      </div>
    </div>
  );
}

function AccountTab({ user }: { user: User }) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Account Details</h1>
      </header>

      <div className="bg-white/80 backdrop-blur-sm border border-white/60 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-400 text-2xl font-bold uppercase">
            {user.full_name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user.full_name}</h2>
            <p className="text-[13px] font-medium text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">User ID (UUID)</label>
            <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg text-[13px] font-mono text-slate-600 select-all">
              {user.id}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Share this ID with family members to link accounts.</p>
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role</label>
            <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-[12px] font-bold capitalize">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
