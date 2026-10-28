import React, { useState } from 'react';
import { Report, Issue, Category } from '../types';
import { api } from '../api';
import {
  CheckCircle2, RotateCcw, AlertTriangle, Clock, Calendar, Check, X,
  ShieldCheck, ArrowRight, UserCheck, MessageSquare
} from 'lucide-react';

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
      await api.submitFeedback(issueId, 'fixed', 5, 'Verified ground resolution by citizen.');
      setFeedbackSuccess('Verification logged! Ground resolution confirmed and issue sealed as Verified.');
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
      await api.submitFeedback(issueId, 'not_fixed', 1, reopenReason || 'Defect still active or repair was poor.');
      setShowReopenModal(null);
      setReopenReason('');
      setFeedbackSuccess('Resolution disputed by citizen. Issue automatically escalated & marked Reopened in municipal queue.');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to dispute');
    } finally {
      setActingIssueId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '28px 20px' }} className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
          <UserCheck size={16} /> Citizen Accountability Oversight
        </div>
        <h1 style={{ fontSize: '2.1rem', color: '#f8fafc', marginBottom: '8px' }}>
          My Submitted Observations
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
          Exercise citizen verification power: municipal repairs cannot be sealed without your sign-off or an auditable dispute.
        </p>
      </div>

      {feedbackSuccess && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '14px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#34d399',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
        }}>
          <CheckCircle2 size={22} />
          <span style={{ fontWeight: 600 }}>{feedbackSuccess}</span>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center' }}>
          <Clock size={48} color="#64748b" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '8px' }}>No Observations Logged</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            When you submit a civic defect, your observation timeline and verification powers will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {reports.map((report) => {
            const linkedIssue = getIssueForReport(report.issue_id);
            const status = linkedIssue ? linkedIssue.status : report.status;
            const isResolvedPending = status === 'resolved_pending_verification';

            return (
              <div key={report.id} className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {getCategoryName(report.category_user_id)}
                    </span>
                    <h3 style={{ fontSize: '1.2rem', color: '#f8fafc', marginTop: '4px' }}>
                      {report.description}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge badge-${status.includes('closed') ? 'verified' : status === 'reopened' ? 'reopened' : status === 'in_progress' ? 'progress' : 'ack'}`} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                      {status.replace(/_/g, ' ')}
                    </span>
                    {linkedIssue && (
                      <div className="priority-dial priority-dial-mid" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                        {Math.round(linkedIssue.priority_score)}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '18px', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} /> {new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>Observation ID: <code>{report.id.slice(0, 8)}</code></span>
                  {report.issue_id && (
                    <span>Linked Ground Issue: <b style={{ color: '#00f0ff' }}>#{report.issue_id.slice(0, 8)}</b></span>
                  )}
                  {report.is_synthetic && (
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>DEMO DATA</span>
                  )}
                </div>

                {/* Visual Lifecycle Stepper */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(7, 10, 18, 0.5)',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  marginBottom: isResolvedPending ? '16px' : '0',
                  gap: '12px',
                  fontSize: '0.78rem',
                  color: '#94a3b8',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>1. Observation Logged</span>
                  <ArrowRight size={14} color="#64748b" />
                  <span style={{ color: linkedIssue ? '#10b981' : '#94a3b8', fontWeight: 700 }}>2. Linked to Ticket</span>
                  <ArrowRight size={14} color="#64748b" />
                  <span style={{ color: ['in_progress', 'resolved_pending_verification', 'closed_verified'].includes(status) ? '#10b981' : '#94a3b8', fontWeight: 700 }}>3. Field Work</span>
                  <ArrowRight size={14} color="#64748b" />
                  <span style={{ color: isResolvedPending ? '#f59e0b' : status === 'closed_verified' ? '#10b981' : '#94a3b8', fontWeight: 700 }}>
                    4. Citizen Verification
                  </span>
                </div>

                {/* Citizen Verification Prompt (Core Differentiator 2) */}
                {isResolvedPending && linkedIssue && (
                  <div style={{
                    padding: '18px 20px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.14), rgba(245, 158, 11, 0.08))',
                    border: '1px solid rgba(234, 179, 8, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    boxShadow: '0 4px 20px rgba(234, 179, 8, 0.15)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#fef08a', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={18} /> Field crew logged work complete. Can you verify?
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '3px' }}>
                        Confirming seals this issue as Verified. If inadequate, dispute it to immediately reopen in the municipal queue.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#10b981', color: '#fff', padding: '8px 16px' }}
                        onClick={() => handleConfirmFixed(linkedIssue.id)}
                        disabled={actingIssueId === linkedIssue.id}
                      >
                        <Check size={16} /> Yes, Confirmed Fixed
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#f43f5e', color: '#fff', padding: '8px 16px' }}
                        onClick={() => setShowReopenModal(linkedIssue.id)}
                        disabled={actingIssueId === linkedIssue.id}
                      >
                        <RotateCcw size={16} /> Not Fixed (Dispute)
                      </button>
                    </div>
                  </div>
                )}

                {/* Reopened dispute alert */}
                {status === 'reopened' && (
                  <div style={{
                    marginTop: '14px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    fontSize: '0.85rem',
                    color: '#fda4af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <RotateCcw size={16} />
                    <span>Disputed & Reopened by citizen. Escalated back to field officer queue for re-repair.</span>
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
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '28px', border: '1px solid rgba(244, 63, 94, 0.4)' }}>
            <h3 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '8px' }}>Dispute Repair & Escalate</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '18px' }}>
              Why was the resolution inadequate? This creates a permanent recurrence record in municipal analytics.
            </p>
            <div className="form-group">
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g. Patch broke after one day of traffic; pothole crater is still open and filling with rain..."
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowReopenModal(null)}>
                Cancel
              </button>
              <button
                className="btn btn-sm"
                style={{ background: '#f43f5e', color: '#fff', padding: '8px 16px' }}
                onClick={() => handleReopen(showReopenModal)}
                disabled={actingIssueId === showReopenModal}
              >
                Submit Dispute & Reopen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
