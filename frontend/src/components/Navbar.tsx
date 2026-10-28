import React from 'react';
import { User } from '../types';
import { MapPin, AlertTriangle, ClipboardList, Shield, BarChart3, UserCheck, LogOut, LogIn } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLoginClick,
  onLogout
}) => {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 1000, width: '100%' }}>
      {/* Persistent Academic & Demo Notice Banner */}
      <div className="demo-banner">
        <AlertTriangle size={14} />
        <span>PILOT EVALUATION DEMO DATA — BENGALURU PILOT ZONES (KORAMANGALA, INDIRANAGAR, HSR)</span>
      </div>

      <nav style={{
        background: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('city_map')}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--grad-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
          }}>
            <MapPin size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', color: '#f8fafc' }}>
              Urban Infra Intelligence
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
              Greater Bengaluru Civic Engine
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
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

        {/* User Account Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>{currentUser.full_name}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                  Role: <span style={{ color: '#38bdf8', fontWeight: 600 }}>{currentUser.role}</span>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={onLogout} title="Log Out">
                <LogOut size={14} /> Logout
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
