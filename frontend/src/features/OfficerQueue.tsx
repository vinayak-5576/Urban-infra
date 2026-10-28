import React, { useState } from 'react';
import { Issue, Zone, Category } from '../types';
import { api } from '../api';
import { Shield, Info, ArrowUpRight, CheckCircle2, Play, Check, Clock, Filter, AlertTriangle } from 'lucide-react';

interface OfficerQueueProps {
  issues: Issue[];
  zones: Zone[];
  categories: Category[];
  onRefresh: () => void;
}

export const OfficerQueue: React.FC<OfficerQueueProps> = ({
  issues,
  zones,
  categories,
  onRefresh
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [activeBreakdownIssue, setActiveBreakdownIssue] = useState<Issue | null>(null);

  // Transition state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resolveModalIssue, setResolveModalIssue] = useState<Issue | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('');

  const filteredIssues = issues.filter((issue) => {
    if (selectedZone && issue.zone_id !== selectedZone) return false;
    if (selectedCategory && issue.category_id !== selectedCategory) return false;
    if (selectedStatus && issue.status !== selectedStatus) return false;
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
        resolutionNote || 'Repair work completed by field team.'
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
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', marginBottom: '6px' }}>
            Officer Operations & Prioritization Queue
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Ranked by explainable multi-factor priority score. Enforces auditable lifecycle and citizen verification.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.85rem' }}>
          <Filter size={16} /> Filters:
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
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
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved_pending_verification">Resolved (Pending Verification)</option>
          <option value="closed_verified">Closed (Verified)</option>
          <option value="reopened">Reopened</option>
        </select>

        <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#94a3b8' }}>
          Showing <b>{filteredIssues.length}</b> tracked issues
        </div>
      </div>

      {/* Issues Queue Table/List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredIssues.map((issue) => {
          let priorityClass = 'priority-low';
          if (issue.priority_score >= 70) priorityClass = 'priority-high';
          else if (issue.priority_score >= 45) priorityClass = 'priority-mid';

          return (
            <div key={issue.id} className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              {/* Left Details */}
              <div style={{ flex: '1 1 340px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span className={`priority-pill ${priorityClass}`} title="Priority Score out of 100">
                    {issue.priority_score}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '2px 8px', fontSize: '0.75rem', height: 'auto' }}
                    onClick={() => setActiveBreakdownIssue(issue)}
                    title="View mathematical score breakdown"
                  >
                    <Info size={13} color="#38bdf8" /> Why this score?
                  </button>
                  <span className="badge badge-new" style={{ textTransform: 'uppercase' }}>
                    {getCategoryName(issue.category_id)}
                  </span>
                  {issue.is_synthetic && (
                    <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600 }}>DEMO</span>
                  )}
                </div>

                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                  Zone: {getZoneName(issue.zone_id)} &bull; {issue.report_count} Corroborating Reports
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span>Issue ID: <b>{issue.id.slice(0, 8)}</b></span>
                  <span>Reported: {new Date(issue.first_reported_at).toLocaleDateString()}</span>
                  {issue.reopen_count > 0 && (
                    <span style={{ color: '#fb7185', fontWeight: 600 }}>
                      ⚠ Reopened {issue.reopen_count}x
                    </span>
                  )}
                </div>
              </div>

              {/* Status & Operational Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={`badge badge-${issue.status.includes('closed') ? 'verified' : issue.status === 'reopened' ? 'reopened' : issue.status === 'in_progress' ? 'progress' : 'ack'}`}>
                  {issue.status.replace(/_/g, ' ')}
                </span>

                {/* State Machine Transition Actions */}
                {issue.status === 'new' && (
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ color: '#38bdf8', borderColor: '#38bdf8' }}
                    onClick={() => handleStatusTransition(issue.id, 'acknowledged')}
                    disabled={updatingId === issue.id}
                  >
                    <CheckCircle2 size={14} /> Acknowledge
                  </button>
                )}

                {issue.status === 'acknowledged' && (
                  <button
                    className="btn btn-sm"
                    style={{ background: '#a855f7', color: '#fff' }}
                    onClick={() => handleStatusTransition(issue.id, 'in_progress')}
                    disabled={updatingId === issue.id}
                  >
                    <Play size={14} /> Start Work
                  </button>
                )}

                {issue.status === 'in_progress' && (
                  <button
                    className="btn btn-sm"
                    style={{ background: '#10b981', color: '#fff' }}
                    onClick={() => setResolveModalIssue(issue)}
                    disabled={updatingId === issue.id}
                  >
                    <Check size={14} /> Mark Resolved
                  </button>
                )}

                {issue.status === 'reopened' && (
                  <button
                    className="btn btn-sm"
                    style={{ background: '#f59e0b', color: '#000', fontWeight: 700 }}
                    onClick={() => handleStatusTransition(issue.id, 'in_progress', 'Re-assigned to repair crew following dispute.')}
                    disabled={updatingId === issue.id}
                  >
                    <Play size={14} /> Restart Work
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Explainable Priority Breakdown (Core Differentiator 3) */}
      {activeBreakdownIssue && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '24px' }}>
            <h3 style={{ color: '#f8fafc', marginBottom: '6px' }}>Explainable Priority Score Breakdown</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Formula: <code>priority = 100 &times; (0.30&times;S + 0.20&times;E + 0.20&times;C + 0.15&times;R + 0.15&times;A)</code>
            </p>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>Severity (S - 30%):</span>
                  <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                    {activeBreakdownIssue.priority_breakdown?.severity ?? activeBreakdownIssue.severity_score}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Exposure (E - 20%):</span>
                  <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                    {activeBreakdownIssue.priority_breakdown?.exposure ?? 0.5} (Arterial corridor)
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Corroboration (C - 20%):</span>
                  <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                    {activeBreakdownIssue.priority_breakdown?.corroboration ?? 0.3} ({activeBreakdownIssue.report_count} reports)
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Recurrence (R - 15%):</span>
                  <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                    {activeBreakdownIssue.priority_breakdown?.recurrence ?? 0.0} ({activeBreakdownIssue.reopen_count} reopens)
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Age vs SLA (A - 15%):</span>
                  <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                    {activeBreakdownIssue.priority_breakdown?.age_vs_sla ?? 0.1}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#38bdf8' }}>Total Computed Score:</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>
                    {activeBreakdownIssue.priority_score} / 100
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveBreakdownIssue(null)}>
                Close
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
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '24px' }}>
            <h3 style={{ color: '#f8fafc', marginBottom: '8px' }}>Complete Civic Repair</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '14px' }}>
              Provide closure notes. This transitions the issue to <b>Resolved (Pending Citizen Verification)</b>.
            </p>
            <div className="form-group">
              <label className="form-label">Resolution Work Summary</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g. Cold-mix asphalt applied and roller compacted; drain desilted..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
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
