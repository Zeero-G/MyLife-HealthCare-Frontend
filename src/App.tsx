import React, { useState, FormEvent, useEffect } from 'react';
import { 
  Shield, 
  Clock, 
  Activity, 
  UserCheck, 
  CheckCircle2, 
  PhoneCall, 
  Lock, 
  ArrowRight,
  Sparkles,
  Database,
  Building,
  Heart,
  FileText
} from 'lucide-react';
import DashboardView from './components/DashboardView';
import { useAuth } from './AuthContext';

export default function App() {
  const { user, isAuthenticated, login, register, error: authError, clearError, isLoading: isContextLoading } = useAuth();

  // Navigation active indicators
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Auth States
  const [emailInput, setEmailInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && currentView === 'landing' && isSubmitted) {
      // Auto redirect to dashboard after successful registration
      const timer = setTimeout(() => {
        setCurrentView('dashboard');
        setActiveSection(null);
        resetForm();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, currentView, isSubmitted]);

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    if (emailInput && usernameInput && passwordInput) {
      setIsAuthLoading(true);
      try {
        await register(usernameInput, emailInput, passwordInput, 'patient');
        setIsSubmitted(true);
      } catch (err) {
        console.error('Registration error', err);
      } finally {
        setIsAuthLoading(false);
      }
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    if (emailInput && passwordInput) {
      setIsAuthLoading(true);
      try {
        await login(emailInput, passwordInput);
        setCurrentView('dashboard');
        setActiveSection(null);
        resetForm();
      } catch (err) {
        console.error('Login error', err);
      } finally {
        setIsAuthLoading(false);
      }
    }
  };

  const resetForm = () => {
    setEmailInput('');
    setUsernameInput('');
    setPasswordInput('');
    setIsSubmitted(false);
    clearError();
  };

  // Nav Links List
  const navLinks = ['Features', 'How It Works', 'For Doctors', 'Emergency'];

  // Switch to dashboard view
  if (currentView === 'dashboard') {
    return <DashboardView onBackToHome={() => setCurrentView('landing')} />;
  }

  if (isContextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f0ee]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div id="app-root" className="relative min-h-screen overflow-hidden bg-[#f0f0ee] font-sans antialiased">
      {/* Background Autoplaying, Muted, Looping Video */}
      <video
        id="bg-video"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Overlay to ensure readability and professional medical studio depth */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-[1]"></div>

      {/* Foreground Container */}
      <div className="relative z-10 flex flex-col min-h-screen justify-between">
        
        {/* Navbar */}
        <header className="w-full z-20">
          <nav className="flex items-center justify-between md:justify-center pt-6 px-4 sm:px-8 gap-3 w-full max-w-full">
            
            {/* Left circular logo container with liquid crystal design */}
            <button 
              id="logo-btn"
              onClick={() => {
                setActiveSection(null);
                resetForm();
              }}
              className="flex items-center justify-center rounded-full w-10 h-10 sm:w-11 sm:h-11 shrink-0 liquid-crystal shadow-md cursor-pointer focus:outline-none"
              title="Home"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                  fill="rgb(59, 130, 246)"
                />
              </svg>
            </button>

            {/* Right pill container using Liquid Crystal Panels style */}
            <div 
              id="nav-pill"
              className="flex items-center gap-3 sm:gap-6 lg:gap-8 rounded-2xl px-4 sm:px-6 py-2 sm:py-2.5 liquid-crystal border border-white/60 overflow-x-auto whitespace-nowrap scrollbar-none max-w-[calc(100%-3rem)] md:max-w-none shadow-md"
            >
              <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
                {navLinks.map((link) => (
                  <button
                    key={link}
                    id={`nav-link-${link.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => {
                      setActiveSection(activeSection === link ? null : link);
                      resetForm();
                    }}
                    className={`text-[12.5px] sm:text-[13.5px] font-bold tracking-wide transition-all duration-200 px-3 py-1.5 rounded-xl cursor-pointer focus:outline-none shrink-0 ${
                      activeSection === link 
                        ? 'text-blue-700 bg-white/70 shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1.5px_0_rgba(255,255,255,0.85)] border border-white/60 font-extrabold' 
                        : 'text-slate-800 hover:text-slate-950 hover:bg-white/40'
                    }`}
                  >
                    {link}
                  </button>
                ))}

                {/* Vertical Separator */}
                <span className="w-[1px] h-4 bg-gray-400/35 block shrink-0" />

                {/* Desk Entrance Button */}
                <button
                  onClick={() => {
                    if (isAuthenticated) {
                      setCurrentView('dashboard');
                      setActiveSection(null);
                    } else {
                      setActiveSection(activeSection === 'Login' ? null : 'Login');
                      resetForm();
                    }
                  }}
                  className={`text-[12.5px] sm:text-[13.5px] font-bold tracking-wide transition-all duration-200 px-3 py-1.5 rounded-xl cursor-pointer focus:outline-none shrink-0 ${
                    currentView === 'dashboard' || activeSection === 'Login'
                      ? 'text-blue-700 bg-white/70 shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1.5px_0_rgba(255,255,255,0.85)] border border-white/60 font-extrabold' 
                      : 'text-slate-800 hover:text-slate-950 hover:bg-white/40'
                  }`}
                  title="Enter Portal Dashboard"
                >
                  {isAuthenticated ? 'Desk' : 'Login'}
                </button>
              </div>
            </div>
          </nav>
        </header>

        {/* Hero Content Area */}
        <main className="flex-1 flex items-center md:items-end pb-12 sm:pb-20 pt-6 px-4 sm:px-12 md:px-20 lg:px-28 z-10">
          
          <div className="w-full flex flex-col md:flex-row md:items-end md:justify-between gap-8 items-start">
            
            {/* Left Column: Core Hero Information */}
            <div id="hero-left-col" className="w-full max-w-md md:max-w-[340px] text-left">
              
              {/* Badge Link with user logo text styling */}
              <button 
                id="badge-link"
                onClick={() => {
                  setActiveSection('Features');
                  resetForm();
                }}
                className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-blue-500 hover:text-blue-600 transition-colors mb-4 group text-left cursor-pointer focus:outline-none"
              >
                <span>Privacy-first healthcare by </span>
                <span className="font-extrabold flex items-center scale-95 origin-left">
                  <span className="bg-gradient-to-r from-lime-500 via-emerald-400 to-cyan-500 bg-clip-text text-transparent">My</span>
                  <span className="text-[#0ea5e9]">Life</span>
                </span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              </button>

              {/* Headline */}
              <h1 id="hero-headline" className="text-[1.55rem] sm:text-[1.750rem] leading-[1.15] font-extrabold text-slate-900 tracking-tight mb-4">
                Your medical records. Owned by you. Shared on your terms.
              </h1>

              {/* Subtext */}
              <p id="hero-subtext" className="text-[13px] text-slate-700 font-semibold mb-6 leading-relaxed bg-white/30 backdrop-blur-xs p-1 px-2 rounded-lg inline-block">
                Store, manage and share your health history across any hospital or clinic in Sri Lanka.
              </p>

              {/* Two CTA Buttons styled with liquid-glass way */}
              <div id="hero-ctas" className="flex gap-2.5 sm:gap-3 flex-wrap pt-1">
                {/* Primary CTA */}
                <button
                  id="cta-get-started"
                  onClick={() => {
                    if (isAuthenticated) {
                      setCurrentView('dashboard');
                    } else {
                      setActiveSection('Register');
                      resetForm();
                    }
                  }}
                  className="inline-flex items-center gap-2 text-[13.5px] font-bold px-6 py-2.5 sm:py-3 rounded-full liquid-crystal-blue cursor-pointer focus:outline-none transition-all active:scale-95 shadow-lg"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Get started free'}
                  <span className="inline-block transition-transform duration-200">
                    →
                  </span>
                </button>

                {/* Secondary CTA */}
                {!isAuthenticated && (
                  <button
                    id="cta-see-how"
                    onClick={() => {
                      setActiveSection('How It Works');
                      resetForm();
                    }}
                    className="inline-flex items-center gap-2 text-[13.5px] font-bold text-blue-700 px-6 py-2.5 sm:py-3 rounded-full liquid-crystal cursor-pointer focus:outline-none transition-all active:scale-95 shadow-md border border-white/70"
                  >
                    See how it works{' '}
                    <span className="inline-block transition-transform duration-200">
                      →
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Middle Module: Interactive Glass Panels for Active Navbar Tabs */}
            <div id="interactive-overlay" className="w-full mt-6 md:mt-0 md:max-w-md lg:max-w-lg transition-all duration-300 ml-auto self-end">
              {activeSection && (
                <div 
                  id="section-card-panel"
                  className="relative p-5 sm:p-8 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/40 shadow-xl max-w-md ml-auto text-left transform transition-all duration-300 ease-out"
                >
                  {/* Close button */}
                  <button 
                    id="close-panel-btn"
                    onClick={() => {
                      setActiveSection(null);
                      resetForm();
                    }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1.5 rounded-full hover:bg-gray-100"
                    title="Close Details"
                  >
                    <XIcon size={16} />
                  </button>

                  {/* Dynamic Content based on active state */}
                  {activeSection === 'Features' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
                          <Shield size={20} />
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Sri Lanka Unified Health ID</h2>
                      </div>
                      <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">
                        Say goodbye to physical prescription booklets and duplicated laboratory scans. All diagnostics, records, and treatments map directly to your cloud-secured private crypt.
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <div>
                            <h3 className="text-xs font-semibold text-gray-800">Direct Patient Ownership</h3>
                            <p className="text-[12px] text-gray-500">Hospitals write to your history, but only you can share or view it.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <div>
                            <h3 className="text-xs font-semibold text-gray-800">Double-Key Consent</h3>
                            <p className="text-[12px] text-gray-500">Clinical personnel request a temporary SMS token to read your clinical files.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <div>
                            <h3 className="text-xs font-semibold text-gray-800">Instant Laboratory Sync</h3>
                            <p className="text-[12px] text-gray-500">Integrates with Asiri Medical, Lanka Hospitals, Durdans, and Hemas.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === 'How It Works' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                          <Sparkles size={20} />
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">How It Works in 3 Steps</h2>
                      </div>
                      
                      <ul className="space-y-4">
                        <li className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                          <div>
                            <span className="block text-[12.5px] font-semibold text-gray-800">Register with NIC or Passport</span>
                            <span className="block text-[12px] text-gray-500">Verify your identity locally and claim your dedicated `@vault.lk` health secure username.</span>
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                          <div>
                            <span className="block text-[12.5px] font-semibold text-gray-800">Clinicians Sync Historical Scans</span>
                            <span className="block text-[12px] text-gray-500">Hospitals safely stream diagnostics to your containerized vault without storing local duplicates.</span>
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                          <div>
                            <span className="block text-[12.5px] font-semibold text-gray-800">Consent, Share & Terminate</span>
                            <span className="block text-[12px] text-gray-500">Grant temporary 24-hour reading credentials to your specialist and revoke with a single swipe.</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  )}

                  {activeSection === 'For Doctors' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                          <Building size={20} />
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Clinical Integration</h2>
                      </div>
                      <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">
                        A unified web API for clinics, general practitioners, and major hospitals across Colombo, Kandy, Galle, and beyond. Easy HL7 FHIR standards integration.
                      </p>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                          <Database size={15} className="text-indigo-500 mb-1" />
                          <h4 className="text-[11.5px] font-semibold text-gray-800">FHIR API Sync</h4>
                          <p className="text-[10px] text-gray-400">Standardized medical schema.</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                          <UserCheck size={15} className="text-indigo-500 mb-1" />
                          <h4 className="text-[11.5px] font-semibold text-gray-800">Zero Local Cache</h4>
                          <p className="text-[10px] text-gray-400">Zero data trace on clinical computers.</p>
                        </div>
                      </div>

                      <div className="text-[11.5px] text-slate-500 border-t border-gray-100 pt-3 flex items-center gap-1.5 justify-center">
                        <Lock size={12} /> Full sandbox available. No hardware installation necessary.
                      </div>
                    </div>
                  )}

                  {activeSection === 'Emergency' && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-rose-50 text-rose-600 animate-pulse">
                          <PhoneCall size={20} />
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold text-red-600">Emergency Smart Bypass</h2>
                      </div>
                      <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">
                        In severe medical incidents where you are unable to grant permission, registered ambulance responders can override blockades safely.
                      </p>

                      <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-100 mb-4">
                        <div className="flex gap-2 items-center mb-1">
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                          <h4 className="text-xs font-bold text-orange-950">1990 Suwa Seriya Integration</h4>
                        </div>
                        <p className="text-[12px] text-orange-900 leading-normal">
                          Official critical care rescue groups use biometric key validation to securely read allergies and blood profiles in the field under severe emergency criteria.
                        </p>
                      </div>

                      <div className="p-3 bg-red-100/50 border border-red-200 rounded-lg flex items-center gap-3">
                        <div className="text-xs text-red-900 leading-normal">
                          <strong>Need immediate aid?</strong> Dial <a href="tel:1990" className="underline font-bold text-red-600">1990</a> (Free Colombo & Island-wide pre-hospital relief).
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === 'Register' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
                          <Lock size={20} />
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Create Your Health Vault</h2>
                      </div>

                      {authError && (
                        <div className="mb-4 p-2 rounded-lg bg-red-50 text-red-600 text-[12px] font-medium border border-red-100">
                          {authError}
                        </div>
                      )}

                      {!isSubmitted ? (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                              Full Name
                            </label>
                            <input
                              type="text"
                              required
                              value={usernameInput}
                              onChange={(e) => setUsernameInput(e.target.value)}
                              placeholder="Saman Alwis"
                              className="w-full text-[13px] border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                              Email Address
                            </label>
                            <input
                              type="email"
                              required
                              value={emailInput}
                              onChange={(e) => setEmailInput(e.target.value)}
                              placeholder="saman.alwis@example.com"
                              className="w-full text-[13px] border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 bg-white"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                              Password
                            </label>
                            <input
                              type="password"
                              required
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              placeholder="••••••••"
                              className="w-full text-[13px] border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 bg-white"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isAuthLoading}
                            className="w-full inline-flex items-center justify-center gap-2 text-[13px] font-medium text-white bg-blue-500 border border-blue-500 rounded-lg py-2.5 hover:bg-blue-600 hover:border-blue-600 transition-colors cursor-pointer focus:outline-none disabled:opacity-70"
                          >
                            {isAuthLoading ? 'Creating...' : 'Create Vault'} <ArrowRight size={14} />
                          </button>

                          <div className="text-center mt-3">
                            <span className="text-[12px] text-gray-500">Already have an account? </span>
                            <button
                              type="button"
                              onClick={() => { setActiveSection('Login'); resetForm(); }}
                              className="text-[12px] font-semibold text-blue-500 hover:text-blue-600 cursor-pointer"
                            >
                              Log in
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="text-center py-6">
                          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-100 animate-bounce">
                            <span className="text-lg">✓</span>
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 mb-1">Vault Created!</h3>
                          <p className="text-[12px] text-gray-500 mb-4 px-2 leading-relaxed">
                            Welcome to MyLife. Your secure health vault is now ready. Redirecting to your dashboard...
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSection === 'Login' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
                          <Lock size={20} />
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Access Your Vault</h2>
                      </div>

                      {authError && (
                        <div className="mb-4 p-2 rounded-lg bg-red-50 text-red-600 text-[12px] font-medium border border-red-100">
                          {authError}
                        </div>
                      )}

                      <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                            Email Address
                          </label>
                          <input
                            type="email"
                            required
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="saman.alwis@example.com"
                            className="w-full text-[13px] border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 bg-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                            Password
                          </label>
                          <input
                            type="password"
                            required
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="••••••••"
                            className="w-full text-[13px] border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 bg-white"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isAuthLoading}
                          className="w-full inline-flex items-center justify-center gap-2 text-[13px] font-medium text-white bg-blue-500 border border-blue-500 rounded-lg py-2.5 hover:bg-blue-600 hover:border-blue-600 transition-colors cursor-pointer focus:outline-none disabled:opacity-70"
                        >
                          {isAuthLoading ? 'Verifying...' : 'Unlock Vault'} <ArrowRight size={14} />
                        </button>

                        <div className="text-center mt-3">
                          <span className="text-[12px] text-gray-500">Don't have an account? </span>
                          <button
                            type="button"
                            onClick={() => { setActiveSection('Register'); resetForm(); }}
                            className="text-[12px] font-semibold text-blue-500 hover:text-blue-600 cursor-pointer"
                          >
                            Sign up
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </main>

        {/* Bottom trust badge */}
        <div 
          id="trust-badge"
          className="w-full text-center sm:absolute sm:bottom-8 sm:right-8 lg:bottom-12 lg:right-28 sm:w-auto z-10 py-5 sm:py-0"
        >
          <span className="inline-flex items-center gap-2 text-[11px] font-medium text-gray-500 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            End-to-end encrypted · PDPA compliant
          </span>
        </div>

      </div>
    </div>
  );
}

// Compact Close Icon
function XIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
