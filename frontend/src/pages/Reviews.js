import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import { reviewsAPI, authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Star, CheckCircle, XCircle, RotateCcw, X, Loader } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const STATUS_BADGES = {
  pending: { label: '⏳ Pending', color: '#38bdf8', bg: 'rgba(14,165,233,0.1)' },
  approved: { label: '✅ Approved', color: '#4ade80', bg: 'rgba(34,197,94,0.1)' },
  rejected: { label: '❌ Rejected', color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  reassigned: { label: '🔁 Reassigned', color: '#c084fc', bg: 'rgba(168,85,247,0.1)' },
};

function ReviewActionModal({ review, onClose, onSave }) {
  const [form, setForm] = useState({ status: 'approved', feedback: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await reviewsAPI.update(review._id, form);
      toast.success(`Review ${form.status}!`);
      onSave();
      onClose();
    } catch (err) { toast.error('Failed to update review'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal animate-slide-up">
        <div className="modal-header">
          <h2 className="modal-title">Submit Review Decision</h2>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ marginBottom: 16, padding: '12px', background: 'var(--bg-3)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Task</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{review.task?.title}</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Decision</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <button type="button" className={`btn btn-sm ${form.status === 'approved' ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => setForm({ ...form, status: 'approved' })}>
                <CheckCircle size={14} /> Approve
              </button>
              <button type="button" className={`btn btn-sm ${form.status === 'rejected' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setForm({ ...form, status: 'rejected' })}>
                <XCircle size={14} /> Reject
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Feedback</label>
            <textarea id="review-feedback" className="form-textarea" value={form.feedback}
              onChange={e => setForm({ ...form, feedback: e.target.value })}
              rows={4} placeholder="Provide detailed feedback for the developer..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="review-submit-btn" type="submit" className={`btn ${form.status === 'approved' ? 'btn-success' : 'btn-danger'}`} disabled={loading}>
              {loading ? <Loader size={14} /> : null} {form.status === 'approved' ? 'Approve' : 'Reject'} Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReassignModal({ review, users, onClose, onSave }) {
  const [newReviewerId, setNewReviewerId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReviewerId) return toast.error('Please select a new reviewer');
    setLoading(true);
    try {
      await reviewsAPI.reassign(review._id, { newReviewerId, reason });
      toast.success('Review reassigned!');
      onSave();
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to reassign'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal animate-slide-up">
        <div className="modal-header">
          <h2 className="modal-title">Reassign Review</h2>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 8, fontSize: 13, color: '#fb923c' }}>
          ⚠️ Business Rule: If a reviewer has been inactive for more than 7 days, the system auto-recommends the fallback reviewer.
          {review.fallbackReviewer && <div style={{ marginTop: 4, color: 'var(--text-secondary)' }}>Fallback: <strong>{review.fallbackReviewer.name}</strong></div>}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Reviewer *</label>
            <select id="reassign-reviewer" className="form-select" value={newReviewerId} onChange={e => setNewReviewerId(e.target.value)} required>
              <option value="">Select reviewer</option>
              {review.fallbackReviewer && (
                <option value={review.fallbackReviewer._id}>⭐ {review.fallbackReviewer.name} (Fallback)</option>
              )}
              {users.filter(u => u._id !== review.reviewer?._id && u._id !== review.fallbackReviewer?._id).map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Reason for Reassignment</label>
            <textarea id="reassign-reason" className="form-textarea" value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="e.g. Reviewer unavailable, out of office..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="reassign-submit-btn" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader size={14} /> : <RotateCcw size={14} />} Reassign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null);
  const [reassignModal, setReassignModal] = useState(null);
  const [filter, setFilter] = useState('');

  const fetchReviews = async () => {
    try {
      const [rRes, uRes] = await Promise.all([reviewsAPI.getAll(), authAPI.getUsers()]);
      setReviews(rRes.data);
      setUsers(uRes.data);
    } catch (err) { toast.error('Failed to load reviews'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, []);

  const pendingReviews = reviews.filter(r => r.status === 'pending' && r.reviewer?._id === user?._id);
  const filtered = filter ? reviews.filter(r => r.status === filter) : reviews;

  return (
    <Layout title="Reviews">
      <div className="page-header">
        <div>
          <h1 className="page-title">Review Workflow</h1>
          <p className="page-subtitle">{reviews.filter(r => r.status === 'pending').length} pending reviews</p>
        </div>
      </div>

      {/* My Pending Reviews Alert */}
      {pendingReviews.length > 0 && (
        <div style={{ padding: '14px 18px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Star size={20} color="var(--primary-light)" />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--primary-light)' }}>You have {pendingReviews.length} pending review{pendingReviews.length > 1 ? 's' : ''}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tasks awaiting your review decision</div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="tabs">
        <button id="filter-all" className={`tab ${!filter ? 'active' : ''}`} onClick={() => setFilter('')}>All ({reviews.length})</button>
        <button id="filter-pending" className={`tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending ({reviews.filter(r => r.status === 'pending').length})</button>
        <button id="filter-approved" className={`tab ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Approved</button>
        <button id="filter-rejected" className={`tab ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Rejected</button>
        <button id="filter-reassigned" className={`tab ${filter === 'reassigned' ? 'active' : ''}`} onClick={() => setFilter('reassigned')}>Reassigned</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(review => {
            const statusCfg = STATUS_BADGES[review.status];
            const isMyReview = review.reviewer?._id === user?._id;
            return (
              <div key={review._id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: statusCfg.bg, color: statusCfg.color }}>
                        {statusCfg.label}
                      </span>
                      {review.task?.priority && <span className={`badge badge-${review.task.priority}`}>{review.task.priority}</span>}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{review.task?.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Reviewer: <strong style={{ color: 'var(--text-secondary)' }}>{review.reviewer?.name}</strong>
                      {review.fallbackReviewer && <> · Fallback: <strong style={{ color: 'var(--text-secondary)' }}>{review.fallbackReviewer.name}</strong></>}
                      {' · '} Requested by {review.requestedBy?.name}
                      {' · '} {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </div>
                    {review.feedback && (
                      <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg-3)', borderRadius: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                        💬 {review.feedback}
                      </div>
                    )}
                    {review.reassignReason && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#fb923c' }}>🔁 {review.reassignReason}</div>
                    )}
                  </div>
                  {/* Actions */}
                  {review.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {isMyReview && (
                        <button id={`review-action-${review._id}`} className="btn btn-primary btn-sm" onClick={() => setActionModal(review)}>
                          <Star size={13} /> Review
                        </button>
                      )}
                      <button id={`reassign-${review._id}`} className="btn btn-secondary btn-sm" onClick={() => setReassignModal(review)}>
                        <RotateCcw size={13} /> Reassign
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="empty-state">
              <Star size={64} style={{ margin: '0 auto 16px', display: 'block' }} />
              <h3>No reviews found</h3>
              <p>Reviews are created when tasks are moved to review status</p>
            </div>
          )}
        </div>
      )}

      {actionModal && <ReviewActionModal review={actionModal} onClose={() => setActionModal(null)} onSave={fetchReviews} />}
      {reassignModal && <ReassignModal review={reassignModal} users={users} onClose={() => setReassignModal(null)} onSave={fetchReviews} />}
    </Layout>
  );
}
