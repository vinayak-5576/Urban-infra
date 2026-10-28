import React, { useState } from 'react';
import { DemoPersona, ZonePerformance, User } from '../types';
import { api, setAuthToken } from '../api';
import {
  Users, MapPin, Shield, UserCheck, TrendingUp, Trophy, ArrowRight,
  Sparkles, CheckCircle2, AlertTriangle, Building2, ChevronRight, X
} from 'lucide-react';

interface PersonaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  personas: DemoPersona[];
  performances: ZonePerformance[];
  onSelectPersona: (user: User, navigateTab: string, selectedZoneId?: string) => void;
}

export const PersonaDrawer: React.FC<PersonaDrawerProps> = ({
  isOpen,
  onClose,
  personas,
  performances,
  onSelectPersona
}) => {
  const [selectedZoneTab, setSelectedZoneTab] = useState<string>('all');
  const [activeViewMode, setActiveViewMode] = useState<'personas' | 'leaderboard'>('personas');

  if (!isOpen) return null;

  const handleLoginAs = async (email: string, role: string, zoneId?: string) => {
    try {
      const password = role === 'citizen' ? 'citizen123' : role === 'officer' ? 'officer123' : 'head123';
      const res = await api.login(email, password);
      setAuthToken(res.access_token, res.user);

      let targetTab = 'city_map';
      if (role === 'citizen') targetTab = 'my_reports';
      else if (role === 'officer') targetTab = 'officer_queue';
      else if (role === 'zone_head') targetTab = 'analytics';

      onSelectPersona(res.user, targetTab, zoneId);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Login as persona failed');
    }
  };

  // Unique zones
  const zonesList = performances.map((p) => ({
    id: p.zone_id,
    name: p.zone_name.replace(' Pilot Zone', ''),
    rank: p.rank,
    score: p.performance_score
  }));

  const filteredPersonas = selectedZoneTab === 'all'
    ? personas
    : personas.filter((p) => p.zone_id === selectedZoneTab);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2600,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '960px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(0, 240, 255, 0.35)',
        boxShadow: '0 0 35px rgba(0, 240, 255, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(11, 15, 25, 0.95)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f0ff', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <Users size={16} /> Bengaluru Civic Intelligence &bull; Persona Hub
            </div>
            <h2 style={{ fontSize: '1.4rem', color: '#f8fafc', marginTop: '2px' }}>
              Switch User Persona or Inspect Zone Performance
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* View Mode Toggle & Zone Bar */}
        <div style={{
          padding: '12px 24px',
          background: 'rgba(7, 10, 18, 0.7)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn btn-sm ${activeViewMode === 'personas' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveViewMode('personas')}
            >
              <Users size={14} /> Zone Personas
            </button>
            <button
              className={`btn btn-sm ${activeViewMode === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveViewMode('leaderboard')}
              style={activeViewMode === 'leaderboard' ? { background: '#a855f7', borderColor: '#a855f7' } : {}}
            >
              <Trophy size={14} /> Relative Zone Leaderboard
            </button>
          </div>

          {activeViewMode === 'personas' && (
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
              <button
                className={`btn btn-sm ${selectedZoneTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                onClick={() => setSelectedZoneTab('all')}
              >
                All Zones
              </button>
              {zonesList.map((z) => (
                <button
                  key={z.id}
                  className={`btn btn-sm ${selectedZoneTab === z.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                  onClick={() => setSelectedZoneTab(z.id)}
                >
                  #{z.rank} {z.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {activeViewMode === 'personas' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {filteredPersonas.map((persona) => {
                const zonePerf = performances.find((p) => p.zone_id === persona.zone_id);

                let roleColor = '#38bdf8';
                let roleIcon = <UserCheck size={18} color="#38bdf8" />;
                let actionText = 'Login as Citizen';

                if (persona.role === 'zone_head') {
                  roleColor = '#10b981';
                  roleIcon = <Building2 size={18} color="#10b981" />;
                  actionText = 'View Relative Zone Performance';
                } else if (persona.role === 'officer') {
                  roleColor = '#a855f7';
                  roleIcon = <Shield size={18} color="#a855f7" />;
                  actionText = 'Open Operations Queue';
                }

                return (
                  <div
                    key={persona.id}
                    className="glass-card-interactive"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '14px',
                      padding: '18px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                    onClick={() => handleLoginAs(persona.email, persona.role, persona.zone_id)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: `rgba(${persona.role === 'zone_head' ? '16, 185, 129' : persona.role === 'officer' ? '168, 85, 247' : '56, 189, 248'}, 0.15)`,
                          color: roleColor,
                          border: `1px solid ${roleColor}40`
                        }}>
                          {persona.role.replace('_', ' ')}
                        </span>

                        {zonePerf && (
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            Zone Rank: <b style={{ color: '#00f0ff' }}>#{zonePerf.rank}</b>
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '2px' }}>
                        {persona.full_name}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="#00f0ff" />
                        <span>{persona.zone_name} &bull; {persona.corporation}</span>
                      </div>
                    </div>

                    <div style={{
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.82rem',
                      color: roleColor,
                      fontWeight: 600
                    }}>
                      <span>{actionText}</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Relative Performance Leaderboard Table */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '4px' }}>
                Relative zone performance benchmark across all 6 pilot zones, calculated from verified resolution rate vs citizen reopen disputes:
              </div>

              {performances.map((perf) => (
                <div
                  key={perf.zone_id}
                  className="glass-card-interactive"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '14px',
                    padding: '18px 22px',
                    border: '1px solid var(--border-subtle)',
                    display: 'grid',
                    gridTemplateColumns: '60px 1.5fr 1fr 1fr auto',
                    alignItems: 'center',
                    gap: '20px'
                  }}
                  onClick={() => {
                    if (perf.zone_head_email) {
                      handleLoginAs(perf.zone_head_email, 'zone_head', perf.zone_id);
                    }
                  }}
                >
                  {/* Rank Badge */}
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: perf.rank === 1 ? 'rgba(250, 204, 21, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                    border: perf.rank === 1 ? '1px solid #facc15' : '1px solid rgba(56, 189, 248, 0.3)',
                    color: perf.rank === 1 ? '#facc15' : '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    fontFamily: 'Outfit, sans-serif'
                  }}>
                    #{perf.rank}
                  </div>

                  {/* Zone Name & Zone Head */}
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                      {perf.zone_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Head: <b>{perf.zone_head_name}</b> &bull; Ward {perf.ward_number || 'Pilot'}
                    </div>
                  </div>

                  {/* Resolution & Reopen Rates */}
                  <div>
                    <div style={{ fontSize: '0.84rem', color: '#10b981', fontWeight: 700 }}>
                      {perf.resolution_rate_pct}% Resolved Verified
                    </div>
                    <div style={{ fontSize: '0.76rem', color: perf.reopen_rate_pct > 0 ? '#fb7185' : '#94a3b8' }}>
                      {perf.reopen_rate_pct}% Reopen Dispute Rate
                    </div>
                  </div>

                  {/* Linking / Dedupe stats */}
                  <div>
                    <div style={{ fontSize: '0.84rem', color: '#38bdf8', fontWeight: 700 }}>
                      {perf.total_reports} Observations
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                      {perf.dedupe_ratio}x deduplication ratio
                    </div>
                  </div>

                  {/* Performance Index Score */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#00f0ff', fontFamily: 'Outfit, sans-serif' }}>
                      {perf.performance_score}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Index Score</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
