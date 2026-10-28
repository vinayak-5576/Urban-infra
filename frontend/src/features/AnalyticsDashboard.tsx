import React from 'react';
import { AnalyticsSummary } from '../types';
import { BarChart3, TrendingUp, CheckCircle, AlertTriangle, Layers, MapPin, ShieldAlert } from 'lucide-react';

interface AnalyticsDashboardProps {
  analytics: AnalyticsSummary | null;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 16px', textAlign: 'center', color: '#94a3b8' }}>
        Loading Civic Intelligence Analytics...
      </div>
    );
  }

  const dedupeRatio = analytics.total_reports > 0
    ? (analytics.total_reports / Math.max(1, analytics.total_issues)).toFixed(1)
    : '1.0';

  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto', padding: '24px 16px' }} className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', marginBottom: '6px' }}>
          Civic Intelligence & Accountability Analytics
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Real-time metrics derived from issue-centric linking, SLA performance, and verified closure integrity.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Total Reports */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#38bdf8', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Citizen Observations</span>
            <Layers size={18} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
            {analytics.total_reports}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
            Deduplicated into <b>{analytics.total_issues}</b> tracked issues ({dedupeRatio}x linking ratio)
          </div>
        </div>

        {/* Active Issues */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f59e0b', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Backlog</span>
            <AlertTriangle size={18} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
            {analytics.open_issues}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
            In progress across BBMP/GBA engineering wings
          </div>
        </div>

        {/* Verified Resolutions */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#10b981', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Verified Closures</span>
            <CheckCircle size={18} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
            {analytics.resolved_verified}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
            Citizen-verified completions
          </div>
        </div>

        {/* Reopen Rate */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f43f5e', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Reopen Dispute Rate</span>
            <TrendingUp size={18} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
            {analytics.reopen_rate_percent}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
            Repairs disputed by citizens on re-inspection
          </div>
        </div>
      </div>

      {/* Grid: Categories & Zones */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Categories */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="#38bdf8" /> Category Defect Volume
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {analytics.category_breakdown.map((cat, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ color: '#f8fafc', fontWeight: 500 }}>{cat.name}</span>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>{cat.count} issues</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, (cat.count / Math.max(1, analytics.total_issues)) * 100)}%`,
                    height: '100%',
                    background: 'var(--grad-primary)',
                    borderRadius: '9999px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zones */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="#a855f7" /> Pilot Zone Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {analytics.zone_breakdown.map((z, idx) => (
              <div key={idx} style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>{z.zone}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Bengaluru Pilot Study Polygon</div>
                </div>
                <span className="badge badge-progress" style={{ fontSize: '0.85rem' }}>
                  {z.count} tracked
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Academic Defense / Architecture Highlights Box */}
      <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #38bdf8' }}>
        <h4 style={{ color: '#38bdf8', marginBottom: '6px', fontSize: '0.95rem' }}>
          Phase 2 Engineering Note
        </h4>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          This system models citizen submissions as discrete <b>observations</b> linked to persistent <b>tracked issues</b> via spatial ray-casting Point-in-Polygon and Haversine proximity. Priority scoring is fully explainable (S, E, C, R, A formula), and lifecycle transitions are tamper-auditable with citizen closure verification. Hardware sensors (ESP32 water-level nodes) remain scoped for Phase 3.
        </p>
      </div>
    </div>
  );
};
