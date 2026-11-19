import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  Tag,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  Star,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck
} from 'lucide-react';
import { grievanceApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { STATUSES, PRIORITIES } from '../../utils/constants';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Textarea from '../../components/common/Textarea';
import Modal from '../../components/common/Modal';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import Skeleton from '../../components/common/Skeleton';
import AttachmentViewer from '../../components/grievance/AttachmentViewer';
import StatusTimeline from '../../components/grievance/StatusTimeline';

export const GrievanceDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Comment state
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Reopen Modal state
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [submittingReopen, setSubmittingReopen] = useState(false);

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchGrievance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await grievanceApi.getGrievanceById(id);
      if (res.data?.success && res.data?.data?.grievance) {
        setGrievance(res.data.data.grievance);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGrievance();
  }, [fetchGrievance]);

  // Handle Comment Submission
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await grievanceApi.addComment(id, {
        text: commentText.trim()
      });
      if (res.data?.success) {
        toast.success('Comment added successfully.');
        setCommentText('');
        fetchGrievance();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle Reopen Submission
  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim() || reopenReason.trim().length < 5) {
      toast.error('Please provide a reason for reopening (at least 5 characters).');
      return;
    }

    setSubmittingReopen(true);
    try {
      const res = await grievanceApi.reopenGrievance(id, {
        reason: reopenReason.trim()
      });
      if (res.data?.success) {
        toast.success('Grievance has been reopened and queued for review.');
        setShowReopenModal(false);
        setReopenReason('');
        fetchGrievance();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingReopen(false);
    }
  };

  // Handle Feedback Submission
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackRating) return;

    setSubmittingFeedback(true);
    try {
      const res = await grievanceApi.addFeedback(id, {
        rating: feedbackRating,
        comment: feedbackComment.trim() || undefined
      });
      if (res.data?.success) {
        toast.success('Thank you for rating our resolution!');
        fetchGrievance();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
      </div>
    );
  }

  if (error || !grievance) {
    return (
      <div className="space-y-6">
        <Link
          to="/citizen/grievances"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Grievances
        </Link>
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h2 className="text-base font-semibold text-slate-900">Unable to load grievance</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{error || 'Grievance not found or inaccessible.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canReopen =
    (grievance.status === STATUSES.RESOLVED || grievance.status === STATUSES.REJECTED) &&
    (grievance.reopenCount || 0) < 1;

  const isResolved = grievance.status === STATUSES.RESOLVED;
  const hasFeedback = Boolean(grievance.feedback?.rating);

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          to="/citizen/grievances"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Grievances
        </Link>
      </div>

      {/* Main Header Card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-base font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded border border-primary-200">
                  {grievance.trackingId}
                </span>
                <StatusBadge status={grievance.status} />
                <PriorityBadge priority={grievance.priority} />
                {grievance.escalated && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Escalated
                  </span>
                )}
                {grievance.reopenCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Reopened ({grievance.reopenCount}/1)
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                {grievance.title}
              </h1>
            </div>

            {/* Reopen Action button if applicable */}
            {canReopen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReopenModal(true)}
                iconLeft={RotateCcw}
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                Reopen Grievance
              </Button>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block font-medium uppercase text-[10px] tracking-wider">
                Assigned Department
              </span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {grievance.department?.name || 'Departmental Review'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium uppercase text-[10px] tracking-wider">
                Category
              </span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {grievance.category}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium uppercase text-[10px] tracking-wider">
                Location
              </span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5 truncate" title={grievance.location}>
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{grievance.location || 'Local Jurisdiction'}</span>
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium uppercase text-[10px] tracking-wider">
                Filed Date
              </span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(grievance.createdAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Description, Attachments, Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Statement */}
          <Card>
            <CardHeader>
              <CardTitle>Grievance Statement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {grievance.description}
              </p>

              {/* Attachments Section */}
              {grievance.attachments && grievance.attachments.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Attachments ({grievance.attachments.length})
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    {grievance.attachments.map((att, idx) => (
                      <AttachmentViewer
                        key={idx}
                        grievanceId={grievance._id}
                        attachmentIndex={idx}
                        filename={att.filename}
                        mimeType={att.mimeType}
                        size={att.size}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback Section (if RESOLVED) */}
          {isResolved && (
            <Card className="border-emerald-200">
              <CardHeader className="bg-emerald-50/50">
                <CardTitle className="text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Resolution Feedback & Citizen Rating
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {hasFeedback ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= (grievance.feedback?.rating || 0)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-semibold text-slate-700 ml-2">
                        {grievance.feedback?.rating} / 5 Stars
                      </span>
                    </div>

                    {grievance.feedback?.comment && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded border border-slate-200">
                        "{grievance.feedback.comment}"
                      </p>
                    )}

                    <p className="text-[11px] text-slate-400">
                      Feedback submitted on {formatDate(grievance.feedback?.createdAt)}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    <p className="text-xs text-slate-600">
                      This grievance was resolved. Please take a moment to rate the municipal resolution quality.
                    </p>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Your Rating
                      </label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setFeedbackRating(star)}
                            className="p-1 hover:scale-110 transition-transform focus:outline-none"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= feedbackRating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-medium text-slate-600 ml-2">
                          {feedbackRating} / 5
                        </span>
                      </div>
                    </div>

                    <Textarea
                      label="Optional Review Remark"
                      placeholder="Share your thoughts on the resolution speed, quality of repair, or officer responsiveness..."
                      rows={3}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={submittingFeedback}
                    >
                      Submit Feedback
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* Follow-up Comments Thread */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary-600" />
                Follow-up Communications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="space-y-3">
                <Textarea
                  placeholder="Ask a clarification or submit additional details to the municipal officer..."
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    iconLeft={Send}
                    isLoading={submittingComment}
                    disabled={!commentText.trim()}
                  >
                    Post Comment
                  </Button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                {!grievance.comments || grievance.comments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No follow-up comments posted yet.
                  </p>
                ) : (
                  grievance.comments.map((comment, index) => {
                    const isStaff = ['officer', 'admin'].includes(comment.author?.role);

                    return (
                      <div
                        key={comment._id || index}
                        className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                          isStaff
                            ? 'bg-blue-50/40 border-blue-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">
                              {comment.author?.name || 'Citizen'}
                            </span>
                            {isStaff ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-primary-700 capitalize">
                                {comment.author?.role}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                Citizen
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {comment.text}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Status Timeline & Protocol Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-600" />
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <StatusTimeline history={grievance.statusHistory} />
            </CardContent>
          </Card>

          {/* Reopen Warning / Note */}
          {grievance.reopenCount >= 1 && (
            <Card className="bg-amber-50/50 border-amber-200">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 space-y-1">
                  <p className="font-semibold">Reopen Limit Reached</p>
                  <p className="leading-relaxed">
                    Under municipal regulations, this grievance has already utilized its one allowed reopen cycle.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* REOPEN MODAL */}
      {showReopenModal && (
        <Modal
          isOpen={showReopenModal}
          onClose={() => setShowReopenModal(false)}
          title={`Reopen Grievance ${grievance.trackingId}`}
        >
          <form onSubmit={handleReopenSubmit} className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              If the reported issue has recurred or was improperly addressed, you may reopen it once. It will be returned to <strong>UNDER_REVIEW</strong> status for reassessment.
            </p>

            <Textarea
              label="Reason for Reopening"
              required
              rows={4}
              placeholder="Explain why the resolution was insufficient or what remains unresolved..."
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              helperText="Minimum 5 characters."
            />

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowReopenModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={submittingReopen}
              >
                Confirm & Reopen
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default GrievanceDetail;
