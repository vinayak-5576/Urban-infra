import React, { useState } from 'react';
import { Report, Issue, Category } from '../types';
import { api } from '../api';
import { CheckCircle2, RotateCcw, AlertTriangle, Clock, Calendar, Check, X } from 'lucide-react';

interface CitizenReportsProps {
  reports: Report[];
  issues: Issue[];
  categories: Category[];
  onRefresh: () => void;
}

export const CitizenReports: React.FC<CitizenReportsProps> = ({
  reports,
  issues,
  categories,
  onRefresh
}) => {
  const [actingIssueId, setActingIssueId] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [showReopenModal, setShowReopenModal] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const getIssueForReport = (issueId?: string) => {
    if (!issueId) return null;
    return issues.find((i) => i.id === issueId);
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : catId;
  };

  const handleConfirmFixed = async (issueId: string) => {
    setActingIssueId(issueId);
    try {
      await api.submitFeedback(issueId, 'fixed', 5, 'Verified fixed by reporting citizen.');
      setFeedbackSuccess('Thank you! Issue closed as verified.');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to verify');
    } finally {
      setActingIssueId(null);
    }
  };

  const handleReopen = async (issueId: string) => {
    setActingIssueId(issueId);
    try {
      await api.submitFeedback(issueId, 'not_fixed', 1, reopenReason || 'Work inadequate or issue recurring.');
      setShowReopenModal(null);
      setReopenReason('');
      setFeedbackSuccess('Issue disputed and marked Reopened for officer re-inspection.');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to reopen');
    } finally {
      setActingIssueId(null);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px' }} className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', marginBottom: '6px' }}>My Submitted Observations</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Track lifecycle progress and exercise citizen oversight: verify completed civic repairs or dispute premature closures.
        </p>
      </div>

      {feedbackSuccess && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <Clock size={40} color="#64748b" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ color: '#f8fafc', marginBottom: '6px' }}>No Reports Submitted Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            When you report civic defects, they will appear here linked with real-time municipal tracking.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reports.map((report) => {
            const linkedIssue = getIssueForReport(report.issue_id);
            const status = linkedIssue ? linkedIssue.status : report.status;
            const isResolvedPending = status === 'resolved_pending_verification';

            return (
              <div key={report.id} className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {getCategoryName(report.category_user_id)}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginTop: '2px' }}>
                      {report.description}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge badge-${status.includes('closed') ? 'verified' : status === 'reopened' ? 'reopened' : status === 'in_progress' ? 'progress' : 'new'}`}>
                      {status.replace(/_/g, ' ')}
                    </span>
                    {linkedIssue && (
                      <span className="priority-pill priority-mid">
                        Priority: {linkedIssue.priority_score}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> {new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>Observation ID: <b>{report.id.slice(0, 8)}</b></span>
                  {report.issue_id && (
                    <span>Tracked Issue: <b style={{ color: '#38bdf8' }}>{report.issue_id.slice(0, 8)}</b></span>
                  )}
                  {report.is_synthetic && (
                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>DEMO DATA</span>
                  )}
                </div>

                {/* Citizen Verification Prompt (Core Differentiator 2) */}
                {isResolvedPending && linkedIssue && (
                  <div style={{
                    marginTop: '14px',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(234, 179, 8, 0.12)',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fef08a', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={16} /> Officer marked this repair complete. Has it been fixed?
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Your verification seals this ticket or triggers an auditable reopen.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#10b981', color: '#fff' }}
                        onClick={() => handleConfirmFixed(linkedIssue.id)}
                        disabled={actingIssueId === linkedIssue.id}
                      >
                        <Check size={14} /> Yes, Confirmed Fixed
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#f43f5e', color: '#fff' }}
                        onClick={() => setShowReopenModal(linkedIssue.id)}
                        disabled={actingIssueId === linkedIssue.id}
                      >
                        <RotateCcw size={14} /> Not Fixed (Dispute)
                      </button>
                    </div>
                  </div>
                )}

                {/* Reopened dispute alert */}
                {status === 'reopened' && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    fontSize: '0.825rem',
                    color: '#fda4af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <RotateCcw size={15} />
                    <span>Disputed & Reopened by citizen. Escalated back to department queue.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Reopening / Disputing */}
      {showReopenModal && (
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
            <h3 style={{ color: '#f8fafc', marginBottom: '8px' }}>Dispute Resolution & Reopen</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Explain why the repair was inadequate. This creates a transparent recurrence audit in the municipal record.
            </p>
            <div className="form-group">
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g. Patch washed away after 2 days of rain; hole still active..."
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowReopenModal(null)}>
                Cancel
              </button>
              <button
                className="btn btn-sm"
                style={{ background: '#f43f5e', color: '#fff' }}
                onClick={() => handleReopen(showReopenModal)}
                disabled={actingIssueId === showReopenModal}
              >
                Submit Reopen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
