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
  onOpenPersonaDrawer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLoginClick,
  onLogout,
  onRoleSwitch,
  onOpenPersonaDrawer
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
      <div className="demo-banner" style={{ background: '#78350f', color: '#fef08a', fontWeight: 700, letterSpacing: '0.04em' }}>
        <Radio size={14} color="#fde047" className="spin" style={{ animationDuration: '4s' }} />
        <span>DEMO DATA — SYNTHETIC AND PILOT TEST SCENARIOS ONLY. NOT OFFICIAL GBA CIVIC DATA (APPROXIMATE BOUNDARIES).</span>
      </div>

      <nav style={{
        background: 'rgba(7, 10, 18, 0.88)',
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
                background: 'rgba(234, 179, 8, 0.2)',
                color: '#facc15',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '6px',
                border: '1px solid rgba(234, 179, 8, 0.4)'
              }}>
                DEMO PILOT
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <div className="pulse-dot" />
              <span>Spatial Core Online &bull; GBA Approximate Pilot Sectors (Demo Data)</span>
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

        {/* Action Controls & Persona Hub */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Persona & Zone Hub Trigger */}
          <button
            className="btn btn-sm"
            onClick={onOpenPersonaDrawer}
            style={{
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.18), rgba(99, 102, 241, 0.22))',
              border: '1px solid rgba(0, 240, 255, 0.5)',
              color: '#00f0ff',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 14px rgba(0, 240, 255, 0.25)',
              padding: '6px 14px'
            }}
            title="Open Persona Switcher & Relative Zone Performance"
          >
            <UserCheck size={15} />
            <span>Persona &amp; Zone Hub</span>
          </button>

          {/* Current User Display or Quick Switch */}
          {currentUser ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap' }}>
                  {currentUser.full_name}
                </div>
                <div style={{ fontSize: '0.66rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                  {currentUser.role.replace('_', ' ')}
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onLogout}
                style={{ padding: '4px 8px' }}
                title="Sign Out"
              >
                <LogOut size={13} />
              </button>
            </div>
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
