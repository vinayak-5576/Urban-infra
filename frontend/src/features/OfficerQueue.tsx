import React, { useState } from 'react';
import { Issue, Zone, Category, User } from '../types';
import { api } from '../api';
import {
  Shield, Info, ArrowUpRight, CheckCircle2, Play, Check, Clock, Filter,
  AlertTriangle, RotateCcw, X, Calculator, Eye, Sliders
} from 'lucide-react';

interface OfficerQueueProps {
  issues: Issue[];
  zones: Zone[];
  categories: Category[];
  currentUser?: User | null;
  onRefresh: () => void;
  selectedZoneId?: string;
}

export const OfficerQueue: React.FC<OfficerQueueProps> = ({
  issues,
  zones,
  categories,
  currentUser,
  onRefresh,
  selectedZoneId
}) => {
  const isStaff = currentUser && ['officer', 'zone_head', 'dept_head', 'admin'].includes(currentUser.role);
  const [selectedZone, setSelectedZone] = useState<string>(selectedZoneId || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'high_priority' | 'action_needed' | 'in_progress'>('all');
  const [activeBreakdownIssue, setActiveBreakdownIssue] = useState<Issue | null>(null);

  React.useEffect(() => {
    if (selectedZoneId) {
      setSelectedZone(selectedZoneId);
    }
  }, [selectedZoneId]);

  // Transition state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resolveModalIssue, setResolveModalIssue] = useState<Issue | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('');

  const filteredIssues = issues.filter((issue) => {
    if (selectedZone && issue.zone_id !== selectedZone) return false;
    if (selectedCategory && issue.category_id !== selectedCategory) return false;
    if (activeTabFilter === 'high_priority' && issue.priority_score < 65) return false;
    if (activeTabFilter === 'action_needed' && !['new', 'reopened'].includes(issue.status)) return false;
    if (activeTabFilter === 'in_progress' && issue.status !== 'in_progress') return false;
    return true;
  });

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : catId;
  };

  const getZoneName = (zoneId: string) => {
    const z = zones.find((zone) => zone.id === zoneId);
    return z ? z.name : zoneId;
  };

  const handleStatusTransition = async (issueId: string, newStatus: string, reason?: string) => {
    setUpdatingId(issueId);
    try {
      await api.updateIssueStatus(issueId, newStatus, reason);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Status transition failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResolveSubmit = async () => {
    if (!resolveModalIssue) return;
    setUpdatingId(resolveModalIssue.id);
    try {
      await api.updateIssueStatus(
        resolveModalIssue.id,
        'resolved_pending_verification',
        resolutionNote || 'Repair work completed by field engineering crew.'
      );
      setResolveModalIssue(null);
      setResolutionNote('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Resolution failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '28px 20px' }} className="animate-fade-in">
      {/* Top Banner Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            <Shield size={16} /> Operational Dispatch & Prioritization
          </div>
          <h1 style={{ fontSize: '2.1rem', color: '#f8fafc', marginBottom: '8px' }}>
            Engineering Operations Queue
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
            Sorted dynamically by multi-variable priority formula. Enforces auditable lifecycle transitions and prevents unverified closures.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Selectors */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Quick Tab Filters */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={`btn btn-sm ${activeTabFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTabFilter('all')}
          >
            All Issues ({issues.length})
          </button>
          <button
            className={`btn btn-sm ${activeTabFilter === 'high_priority' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTabFilter('high_priority')}
            style={activeTabFilter === 'high_priority' ? { background: '#f43f5e', borderColor: '#f43f5e' } : {}}
          >
            🔥 High Priority ({issues.filter((i) => i.priority_score >= 65).length})
          </button>
          <button
            className={`btn btn-sm ${activeTabFilter === 'action_needed' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTabFilter('action_needed')}
          >
            Action Needed ({issues.filter((i) => ['new', 'reopened'].includes(i.status)).length})
          </button>
          <button
            className={`btn btn-sm ${activeTabFilter === 'in_progress' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTabFilter('in_progress')}
          >
            In Progress ({issues.filter((i) => i.status === 'in_progress').length})
          </button>
        </div>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 4px' }} />

        {/* Dropdown Filters */}
        <select
          className="form-select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
        >
          <option value="">All Pilot Zones</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Defect Types</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Queue List Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredIssues.map((issue) => {
          let dialClass = 'priority-dial-low';
          let priorityGlow = 'rgba(16, 185, 129, 0.2)';
          if (issue.priority_score >= 70) {
            dialClass = 'priority-dial-high';
            priorityGlow = 'rgba(244, 63, 94, 0.3)';
          } else if (issue.priority_score >= 45) {
            dialClass = 'priority-dial-mid';
            priorityGlow = 'rgba(245, 158, 11, 0.3)';
          }

          return (
            <div
              key={issue.id}
              className="glass-panel"
              style={{
                padding: '20px 24px',
                display: 'grid',
                gridTemplateColumns: '80px 1.5fr 1fr auto',
                alignItems: 'center',
                gap: '20px',
                boxShadow: `0 4px 20px -2px ${priorityGlow}`
              }}
            >
              {/* Score Dial */}
              <div style={{ textAlign: 'center' }}>
                <div className={`priority-dial ${dialClass}`} style={{ width: '56px', height: '56px', fontSize: '1.2rem', margin: '0 auto' }}>
                  {Math.round(issue.priority_score)}
                </div>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    width: '100%'
                  }}
                  onClick={() => setActiveBreakdownIssue(issue)}
                >
                  <Calculator size={11} /> Explain
                </button>
              </div>

              {/* Main Defect Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {getCategoryName(issue.category_id)}
                  </span>
                  <span style={{ color: '#475569' }}>&bull;</span>
                  <span style={{ fontSize: '0.8rem', color: '#f8fafc', fontWeight: 600 }}>
                    {getZoneName(issue.zone_id)}
                  </span>
                  {issue.is_synthetic && (
                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontWeight: 700 }}>
                      DEMO
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '8px' }}>
                  Corroborated by <b>{issue.report_count}</b> linked citizen reports
                </div>

                <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>ID: <code>{issue.id.slice(0, 8)}</code></span>
                  <span>First Reported: {new Date(issue.first_reported_at).toLocaleDateString()}</span>
                  {issue.reopen_count > 0 && (
                    <span style={{ color: '#fb7185', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <RotateCcw size={12} /> Disputed & Reopened {issue.reopen_count}x
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge & SLA */}
              <div>
                <div style={{ marginBottom: '6px' }}>
                  <span className={`badge badge-${issue.status.includes('closed') ? 'verified' : issue.status === 'reopened' ? 'reopened' : issue.status === 'in_progress' ? 'progress' : 'ack'}`} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                    {issue.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} color="#38bdf8" />
                  <span>SLA Due: {issue.resolve_due_at ? new Date(issue.resolve_due_at).toLocaleDateString() : '72 hours'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!isStaff ? (
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic' }}>
                    {issue.status === 'resolved_pending_verification'
                      ? 'Awaiting Citizen Sign-off (See My Reports)'
                      : 'Municipal Staff Oversight Only'}
                  </span>
                ) : (
                  <>
                    {issue.status === 'new' && (
                      <button
                        className="btn btn-sm btn-secondary"
                        style={{ borderColor: '#38bdf8', color: '#38bdf8' }}
                        onClick={() => handleStatusTransition(issue.id, 'acknowledged')}
                        disabled={updatingId === issue.id}
                      >
                        <CheckCircle2 size={15} /> Acknowledge
                      </button>
                    )}

                    {issue.status === 'acknowledged' && (
                      <button
                        className="btn btn-sm"
                        style={{ background: '#8b5cf6', color: '#fff' }}
                        onClick={() => handleStatusTransition(issue.id, 'in_progress')}
                        disabled={updatingId === issue.id}
                      >
                        <Play size={15} /> Dispatch Crew
                      </button>
                    )}

                    {issue.status === 'in_progress' && (
                      <button
                        className="btn btn-sm"
                        style={{ background: '#10b981', color: '#fff' }}
                        onClick={() => setResolveModalIssue(issue)}
                        disabled={updatingId === issue.id}
                      >
                        <Check size={15} /> Mark Resolved
                      </button>
                    )}

                    {issue.status === 'reopened' && (
                      <button
                        className="btn btn-sm"
                        style={{ background: '#f59e0b', color: '#070a12', fontWeight: 800 }}
                        onClick={() => handleStatusTransition(issue.id, 'in_progress', 'Re-assigned to asphalt contractor following citizen dispute.')}
                        disabled={updatingId === issue.id}
                      >
                        <Play size={15} /> Restart Repair
                      </button>
                    )}

                    {issue.status === 'resolved_pending_verification' && (
                      <span style={{ fontSize: '0.75rem', color: '#fde047', fontWeight: 600, padding: '6px 10px', background: 'rgba(234, 179, 8, 0.12)', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                        Awaiting Citizen Sign-off
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Formula Modal Breakdown */}
      {activeBreakdownIssue && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '560px', width: '100%', padding: '28px', border: '1px solid rgba(0, 240, 255, 0.3)', boxShadow: 'var(--shadow-glow-cyan)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={20} color="#00f0ff" />
                <h3 style={{ color: '#f8fafc', fontSize: '1.25rem' }}>Explainable Priority Breakdown</h3>
              </div>
              <button
                onClick={() => setActiveBreakdownIssue(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'rgba(7, 10, 18, 0.7)', borderRadius: '12px', padding: '14px', marginBottom: '18px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', fontFamily: 'monospace', color: '#38bdf8' }}>
              priority = 100 &times; (0.30&middot;S + 0.20&middot;E + 0.20&middot;C + 0.15&middot;R + 0.15&middot;A)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {/* Severity */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>Severity ($S$ &bull; 30% Weight)</span>
                  <span style={{ color: '#00f0ff', fontWeight: 700 }}>
                    {activeBreakdownIssue.priority_breakdown?.severity ?? activeBreakdownIssue.severity_score}
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${(activeBreakdownIssue.priority_breakdown?.severity ?? 0.5) * 100}%`, height: '100%', background: '#00f0ff' }} />
                </div>
              </div>

              {/* Exposure */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>Arterial Exposure ($E$ &bull; 20% Weight)</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                    {activeBreakdownIssue.priority_breakdown?.exposure ?? 0.5} (Main Corridor)
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${(activeBreakdownIssue.priority_breakdown?.exposure ?? 0.5) * 100}%`, height: '100%', background: '#38bdf8' }} />
                </div>
              </div>

              {/* Corroboration */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>Citizen Corroboration ($C$ &bull; 20% Weight)</span>
                  <span style={{ color: '#a855f7', fontWeight: 700 }}>
                    {activeBreakdownIssue.report_count} Linked Observations
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, activeBreakdownIssue.report_count * 20)}%`, height: '100%', background: '#a855f7' }} />
                </div>
              </div>

              {/* Recurrence */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>Prior Recurrence ($R$ &bull; 15% Weight)</span>
                  <span style={{ color: '#f43f5e', fontWeight: 700 }}>
                    {activeBreakdownIssue.reopen_count} Prior Failures
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, activeBreakdownIssue.reopen_count * 33)}%`, height: '100%', background: '#f43f5e' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Computed Score</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'Outfit, sans-serif' }}>
                  {activeBreakdownIssue.priority_score} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ 100</span>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveBreakdownIssue(null)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mark Resolved with Evidence Note */}
      {resolveModalIssue && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '26px' }}>
            <h3 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '8px' }}>Log Completion of Work</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '16px' }}>
              Submitting closure details transitions the issue to <b>Resolved (Pending Citizen Verification)</b>. The ticket is only sealed when the citizen confirms the repair on the ground.
            </p>
            <div className="form-group">
              <label className="form-label">Work Completion Notes</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g. 50mm cold mix asphalt applied with vibratory roller. Rainwater drain desilted."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setResolveModalIssue(null)}>
                Cancel
              </button>
              <button
                className="btn btn-sm"
                style={{ background: '#10b981', color: '#fff' }}
                onClick={handleResolveSubmit}
                disabled={updatingId === resolveModalIssue.id}
              >
                Submit Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
