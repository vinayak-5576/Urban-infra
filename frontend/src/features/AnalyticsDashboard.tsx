import React from 'react';
import { AnalyticsSummary, ZonePerformance, User } from '../types';
import {
  BarChart3, TrendingUp, CheckCircle, AlertTriangle, Layers, MapPin,
  ShieldAlert, Activity, Sparkles, RefreshCw, Cpu, Trophy, Building2,
  ArrowRight, UserCheck
} from 'lucide-react';

interface AnalyticsDashboardProps {
  analytics: AnalyticsSummary | null;
  performances?: ZonePerformance[];
  currentUser?: User | null;
  onSelectZoneHead?: (email: string, zoneId: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analytics,
  performances = [],
  currentUser,
  onSelectZoneHead
}) => {
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

      {/* Fair Per-Zone Operational Metrics (Uncertainty-Aware) */}
      {performances.length > 0 && (
        <div className="glass-panel" style={{ padding: '28px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="#00f0ff" />
                <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>
                  Per-Zone Operational Metrics (Uncertainty-Aware)
                </h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '3px' }}>
                Reporting sample size (n), median response times, SLA compliance with Wilson 95% confidence intervals, and reopen rates.
                No composite scores or individual rankings are computed, per Stage 12 guidelines.
              </p>
            </div>
            <div style={{
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              color: '#facc15',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              Minimum Sample Rule: n &ge; 20
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {performances.map((perf) => {
              const isUserZone = currentUser?.zone_id === perf.zone_id;

              return (
                <div
                  key={perf.zone_id}
                  style={{
                    background: isUserZone ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    border: isUserZone ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid var(--border-subtle)',
                    display: 'grid',
                    gridTemplateColumns: '1.6fr 1fr 1.2fr 1.4fr 1fr',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  {/* Zone Name & Scope */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>{perf.zone_name}</span>
                      {isUserZone && (
                        <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: '#00f0ff25', color: '#00f0ff', fontWeight: 700 }}>
                          YOUR JURISDICTION
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                      {perf.corporation} &bull; <span style={{ color: '#cbd5e1' }}>{perf.ward_label || 'Pilot Sector'}</span>
                    </div>
                  </div>

                  {/* Sample Size (n) & Data Quality Status */}
                  <div>
                    <div style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 700 }}>
                      n = {perf.n} issues
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      {perf.total_reports} citizen observations ({perf.dedupe_corroboration_ratio}x dedupe)
                    </div>
                    {perf.insufficient_data && (
                      <span style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        fontSize: '0.68rem',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(234, 179, 8, 0.15)',
                        color: '#facc15',
                        fontWeight: 700
                      }}>
                        insufficient data (n &lt; 20)
                      </span>
                    )}
                  </div>

                  {/* Response Durations */}
                  <div>
                    <div style={{ fontSize: '0.76rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Median Response
                    </div>
                    <div style={{ fontSize: '0.86rem', color: '#cbd5e1', fontWeight: 600, marginTop: '2px' }}>
                      Ack: <span style={{ color: '#38bdf8' }}>{perf.median_ack_hours !== null && perf.median_ack_hours !== undefined ? `${perf.median_ack_hours}h` : 'N/A'}</span> &bull; 
                      Resolve: <span style={{ color: '#38bdf8' }}>{perf.median_resolve_hours !== null && perf.median_resolve_hours !== undefined ? `${perf.median_resolve_hours}h` : 'N/A'}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Backlog: {perf.open_backlog} open
                    </div>
                  </div>

                  {/* SLA Compliance with Wilson 95% Confidence Interval */}
                  <div>
                    <div style={{ fontSize: '0.76rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      SLA Compliance Rate
                    </div>
                    <div style={{ fontSize: '0.92rem', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>
                      {perf.sla_compliance_pct}%
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      95% CI: [{perf.sla_wilson_interval_95 ? `${perf.sla_wilson_interval_95[0]}% – ${perf.sla_wilson_interval_95[1]}%` : 'N/A'}]
                    </div>
                  </div>

                  {/* Reopen / Dispute Rate */}
                  <div>
                    <div style={{ fontSize: '0.76rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Citizen Reopen Rate
                    </div>
                    <div style={{ fontSize: '0.92rem', color: perf.reopen_rate_pct > 0 ? '#fb7185' : '#34d399', fontWeight: 700, marginTop: '2px' }}>
                      {perf.reopen_rate_pct}%
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      {perf.reopened_count} disputed
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


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
