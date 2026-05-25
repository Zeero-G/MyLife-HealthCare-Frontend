import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  Users,
  AlertTriangle,
  User as UserIcon,
  LogOut,
  ArrowLeft,
  Calendar,
  Heart,
} from 'lucide-react';
import { useAuth } from '../AuthContext';

import AdminDashboard from './AdminDashboard';
import DoctorDashboard from './DoctorDashboard';
import FamilyDashboard from './FamilyDashboard';
import PatientDashboard from './PatientDashboard';
import AccountView from './AccountView';
import RecordsView from './RecordsView';
import UploadView from './UploadView';
import EmergencyView from './EmergencyView';
import WomensHealthView from './WomensHealthView';
import AppointmentView from './AppointmentView';

interface DashboardViewProps {
  onBackToHome: () => void;
}

type TabType =
  | 'overview'
  | 'records'
  | 'upload'
  | 'family'
  | 'emergency'
  | 'account'
  | 'appointments'
  | 'womens-health'
  | 'patients'
  | 'verify';

export default function DashboardView({ onBackToHome }: DashboardViewProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const handleLogout = () => {
    logout();
    onBackToHome();
  };

  const getNavItems = () => {
    const role = user?.role || 'patient';
    const common = [{ id: 'account' as TabType, label: 'Account', icon: UserIcon }];

    if (role === 'admin') {
      return [
        { id: 'overview' as TabType, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'records' as TabType, label: 'All Records', icon: FileText },
        ...common,
      ];
    }

    if (role === 'doctor') {
      return [
        { id: 'overview' as TabType, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'appointments' as TabType, label: 'Appointments', icon: Calendar },
        { id: 'upload' as TabType, label: 'Upload Report', icon: UploadCloud },
        ...common,
      ];
    }

    if (role === 'family_member') {
      return [
        { id: 'overview' as TabType, label: 'Family Hub', icon: LayoutDashboard },
        { id: 'family' as TabType, label: 'Manage Members', icon: Users },
        ...common,
      ];
    }

    // patient
    const items: { id: TabType; label: string; icon: any }[] = [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'records', label: 'My Records', icon: FileText },
      { id: 'upload', label: 'Upload Document', icon: UploadCloud },
      { id: 'appointments', label: 'Appointments', icon: Calendar },
      { id: 'family', label: 'Family Members', icon: Users },
      { id: 'emergency', label: 'Emergency Profile', icon: AlertTriangle },
    ];

    // Only show Women's Health for female patients
    if (user?.gender === 'female') {
      items.push({ id: 'womens-health', label: "Women's Health", icon: Heart });
    }

    return [...items, ...common];
  };

  const navItems = getNavItems();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f0ee]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'account':       return <AccountView />;
      case 'records':       return <RecordsView />;
      case 'upload':        return <UploadView />;
      case 'emergency':     return <EmergencyView />;
      case 'womens-health': return <WomensHealthView />;
      case 'appointments':  return <AppointmentView />;
      case 'family':        return <FamilyDashboard />;
      case 'overview':
        switch (user.role) {
          case 'admin':        return <AdminDashboard />;
          case 'doctor':       return <DoctorDashboard setActiveTab={(t: TabType) => setActiveTab(t)} />;
          case 'family_member': return <FamilyDashboard />;
          default:             return <PatientDashboard setActiveTab={(t: TabType) => setActiveTab(t)} />;
        }
      default:
        return (
          <div className="p-6 h-full flex items-center justify-center text-gray-400 font-medium">
            Page not found.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0ee] flex font-sans">

      {/* Sidebar – Desktop */}
      <aside className="w-64 hidden md:flex flex-col bg-white/60 backdrop-blur-xl border-r border-white/50 sticky top-0 h-screen">
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 mb-8">
            <span className="font-extrabold text-xl tracking-tight flex items-center">
              <span className="bg-gradient-to-r from-lime-500 via-emerald-400 to-cyan-500 bg-clip-text text-transparent">My</span>
              <span className="text-[#0ea5e9]">Life</span>
            </span>
          </div>

          <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">
            {user.role.replace('_', ' ')}
          </p>

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
                <item.icon
                  size={18}
                  className={activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}
                />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 space-y-2 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
              {user.full_name[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-800 truncate">{user.full_name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
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

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-gray-100 px-2 py-2 flex justify-around">
        {navItems.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              activeTab === item.id ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <item.icon size={20} />
            <span className="text-[9px] font-semibold leading-none">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 flex items-center justify-between">
          <span className="font-extrabold text-xl tracking-tight flex items-center">
            <span className="bg-gradient-to-r from-lime-500 via-emerald-400 to-cyan-500 bg-clip-text text-transparent">My</span>
            <span className="text-[#0ea5e9]">Life</span>
          </span>
          <button onClick={handleLogout} className="p-2 rounded-xl text-red-400 hover:bg-red-50 transition">
            <LogOut size={18} />
          </button>
        </div>

        {renderContent()}
      </main>
    </div>
  );
}
