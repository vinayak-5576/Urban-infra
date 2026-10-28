import React from 'react';
import { AnalyticsSummary } from '../types';
import {
  BarChart3, TrendingUp, CheckCircle, AlertTriangle, Layers, MapPin,
  ShieldAlert, Activity, Sparkles, RefreshCw, Cpu
} from 'lucide-react';

interface AnalyticsDashboardProps {
  analytics: AnalyticsSummary | null;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
        Loading Civic Intelligence Engine Analytics...
      </div>
    );
  }

  const dedupeRatio = analytics.total_reports > 0
    ? (analytics.total_reports / Math.max(1, analytics.total_issues)).toFixed(1)
    : '1.0';

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '28px 20px' }} className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#00f0ff', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
          <Activity size={16} /> Greater Bengaluru Civic Intelligence
        </div>
        <h1 style={{ fontSize: '2.1rem', color: '#f8fafc', marginBottom: '8px' }}>
          Accountability & SLA Analytics
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
          Real-time metrics derived from issue-centric linking, spatial deduplication, and verified closure integrity across pilot zones.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Total Citizen Observations */}
        <div className="glass-panel" style={{ padding: '24px', borderTop: '2px solid #00f0ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#00f0ff', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Citizen Observations
            </span>
            <Layers size={20} />
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'Outfit, sans-serif' }}>
            {analytics.total_reports}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>
            Consolidated into <b>{analytics.total_issues}</b> ground issues (<span style={{ color: '#00f0ff', fontWeight: 700 }}>{dedupeRatio}x reduction</span>)
          </div>
        </div>

        {/* Active Backlog */}
        <div className="glass-panel" style={{ padding: '24px', borderTop: '2px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f59e0b', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Engineering Backlog
            </span>
            <AlertTriangle size={20} />
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'Outfit, sans-serif' }}>
            {analytics.open_issues}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>
            Assigned to BBMP-GBA road, drainage & utility crews
          </div>
        </div>

        {/* Verified Resolutions */}
        <div className="glass-panel" style={{ padding: '24px', borderTop: '2px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#10b981', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Verified Ground Closures
            </span>
            <CheckCircle size={20} />
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'Outfit, sans-serif' }}>
            {analytics.resolved_verified}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>
            Repairs confirmed fixed by citizen ground verification
          </div>
        </div>

        {/* Reopen Dispute Rate */}
        <div className="glass-panel" style={{ padding: '24px', borderTop: '2px solid #f43f5e' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f43f5e', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Reopen Dispute Rate
            </span>
            <TrendingUp size={20} />
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'Outfit, sans-serif' }}>
            {analytics.reopen_rate_percent}%
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>
            Repairs disputed by citizens on post-repair inspection
          </div>
        </div>
      </div>

      {/* Grid: Category & Zone Distributions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px', marginBottom: '28px' }}>
        {/* Category Volumes */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} color="#00f0ff" /> Defect Distribution by Category
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Real-time breakdown</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {analytics.category_breakdown.map((cat, idx) => {
              const pct = Math.round((cat.count / Math.max(1, analytics.total_issues)) * 100);
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>{cat.name}</span>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>{cat.count} issues ({pct}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'var(--grad-cyan-indigo)',
                      borderRadius: '9999px',
                      boxShadow: '0 0 10px rgba(0, 240, 255, 0.4)'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pilot Zone Distributions */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={20} color="#a855f7" /> Pilot Zone Incidents
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Geospatial distribution</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {analytics.zone_breakdown.map((z, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px 18px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>{z.zone}</div>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Study Area Boundary Verified</div>
                </div>
                <div className="priority-dial priority-dial-low" style={{ width: '38px', height: '38px', fontSize: '0.9rem' }}>
                  {z.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engineering Defense Statement */}
      <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid #00f0ff', background: 'rgba(0, 240, 255, 0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f0ff', fontWeight: 800, fontSize: '0.92rem', marginBottom: '6px' }}>
          <Sparkles size={18} /> Phase 2 Project Defense Summary
        </div>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          The engineering novelty of this system lies in <b>spatial report-to-issue deduplication</b> and <b>lifecycle accountability integrity</b>. Rather than generating separate uncoordinated tickets for every citizen submission, multiple observations observing the same defect within a category-specific radius (e.g. 40m for potholes) corroborate a single tracked ticket. Transparent multi-variable priority scoring ensures explainability without opaque black-box scoring. Hardware sensors (ESP32 node) are scheduled for Phase 3.
        </p>
      </div>
    </div>
  );
};
