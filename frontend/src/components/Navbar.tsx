import React from 'react';
import { User } from '../types';
import { api, setAuthToken } from '../api';
import { MapPin, AlertTriangle, ClipboardList, Shield, BarChart3, UserCheck, LogOut, LogIn, Activity, Radio } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onRoleSwitch: (user: User) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLoginClick,
  onLogout,
  onRoleSwitch
}) => {
  const handleQuickSwitch = async (email: string, pass: string) => {
    try {
      const res = await api.login(email, pass);
      setAuthToken(res.access_token, res.user);
      onRoleSwitch(res.user);
    } catch (e) {
      console.error('Quick switch failed', e);
    }
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 1000, width: '100%' }}>
      {/* Top Academic & Demo Banner */}
      <div className="demo-banner">
        <Radio size={14} color="#fde047" className="spin" style={{ animationDuration: '4s' }} />
        <span>PHASE-2 EVALUATION PREVIEW &bull; BENGALURU PILOT STUDY AREA: KORAMANGALA, INDIRANAGAR, HSR</span>
      </div>

      <nav style={{
        background: 'rgba(7, 10, 18, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand & Live Pulse */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => setActiveTab('city_map')}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--grad-cyan-indigo)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow-cyan)'
          }}>
            <MapPin size={22} color="#070a12" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', color: '#f8fafc' }}>
                CivicIntel
              </span>
              <span style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                BENGALURU
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <div className="pulse-dot" />
              <span>Spatial Core Online &bull; GBA 369-Ward Model</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            className={`btn btn-sm ${activeTab === 'city_map' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('city_map')}
          >
            <MapPin size={15} /> City Map
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'report' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('report')}
          >
            <AlertTriangle size={15} /> Report Issue
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'my_reports' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('my_reports')}
          >
            <ClipboardList size={15} /> My Reports
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'officer_queue' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('officer_queue')}
          >
            <Shield size={15} /> Operations Queue
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={15} /> Intelligence Analytics
          </button>
        </div>

        {/* 1-Click Role Switcher for Evaluator Convenience */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '10px',
            padding: '3px 6px',
            border: '1px solid var(--border-subtle)',
            gap: '4px'
          }}>
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, paddingLeft: '4px' }}>Role:</span>
            <button
              className="btn btn-sm"
              style={{
                padding: '3px 8px',
                fontSize: '0.72rem',
                background: currentUser?.role === 'citizen' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: currentUser?.role === 'citizen' ? '#38bdf8' : '#94a3b8',
                border: currentUser?.role === 'citizen' ? '1px solid rgba(56, 189, 248, 0.4)' : 'none'
              }}
              onClick={() => handleQuickSwitch('citizen@demo.org', 'citizen123')}
              title="Switch to Citizen Ramesh"
            >
              Citizen
            </button>
            <button
              className="btn btn-sm"
              style={{
                padding: '3px 8px',
                fontSize: '0.72rem',
                background: currentUser?.role === 'officer' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                color: currentUser?.role === 'officer' ? '#c084fc' : '#94a3b8',
                border: currentUser?.role === 'officer' ? '1px solid rgba(168, 85, 247, 0.4)' : 'none'
              }}
              onClick={() => handleQuickSwitch('officer@gba.civic.in', 'officer123')}
              title="Switch to Road Officer Suresh"
            >
              Officer
            </button>
            <button
              className="btn btn-sm"
              style={{
                padding: '3px 8px',
                fontSize: '0.72rem',
                background: currentUser?.role === 'zone_head' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: currentUser?.role === 'zone_head' ? '#34d399' : '#94a3b8',
                border: currentUser?.role === 'zone_head' ? '1px solid rgba(16, 185, 129, 0.4)' : 'none'
              }}
              onClick={() => handleQuickSwitch('head@gba.civic.in', 'head123')}
              title="Switch to Zone Head Dr. Ananya"
            >
              Zone Head
            </button>
          </div>

          {currentUser ? (
            <button className="btn btn-secondary btn-sm" onClick={onLogout} title="Sign Out">
              <LogOut size={14} />
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onLoginClick}>
              <LogIn size={15} /> Sign In
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};
