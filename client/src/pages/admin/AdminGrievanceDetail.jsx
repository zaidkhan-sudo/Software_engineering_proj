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
  Lock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Send,
  UserCheck
} from 'lucide-react';
import { grievanceApi, departmentApi, userApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { STATUSES, PRIORITIES, OFFICER_ALLOWED_TRANSITIONS, STATUS_CONFIG } from '../../utils/constants';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Textarea from '../../components/common/Textarea';
import Select from '../../components/common/Select';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import Skeleton from '../../components/common/Skeleton';
import AttachmentViewer from '../../components/grievance/AttachmentViewer';
import StatusTimeline from '../../components/grievance/StatusTimeline';

export const AdminGrievanceDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [grievance, setGrievance] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [allOfficers, setAllOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reassignment State
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState(null);

  // Status Update State
  const [targetStatus, setTargetStatus] = useState('');
  const [remark, setRemark] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [statusError, setStatusError] = useState(null);

  // Comment State
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch departments and officers for reassignment dropdowns
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [deptRes, userRes] = await Promise.all([
          departmentApi.getDepartments(),
          userApi.getUsers({ role: 'officer', limit: 50 })
        ]);

        if (deptRes.data?.success) {
          setDepartments(deptRes.data.data.departments || []);
        }
        if (userRes.data?.success) {
          setAllOfficers(userRes.data.data.users || []);
        }
      } catch (err) {
        console.error('Failed to load assignment metadata', err);
      }
    };
    loadMetadata();
  }, []);

  const fetchGrievance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await grievanceApi.getGrievanceById(id);
      if (res.data?.success && res.data?.data?.grievance) {
        const item = res.data.data.grievance;
        item.statusHistory = res.data.data.statusHistory || item.statusHistory || [];
        item.comments = res.data.data.comments || item.comments || [];
        setGrievance(item);

        const currentDeptId = item.department?._id || item.department || '';
        const currentOfficerId = item.assignedOfficer?._id || item.assignedOfficer || '';
        setSelectedDept(currentDeptId);
        setSelectedOfficer(currentOfficerId);

        const allowed = OFFICER_ALLOWED_TRANSITIONS[item.status] || [];
        if (allowed.length > 0) {
          setTargetStatus(allowed[0]);
        } else {
          setTargetStatus('');
        }
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

  // Filter officers for currently selected department
  const filteredOfficers = allOfficers.filter((off) => {
    const offDeptId = off.department?._id || off.department;
    return offDeptId === selectedDept;
  });

  // Handle Reassignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setAssignError(null);

    if (!selectedDept) {
      setAssignError('Please select a valid municipal department.');
      return;
    }

    setAssigning(true);
    try {
      const payload = {
        department: selectedDept,
        assignedOfficer: selectedOfficer || null
      };

      const res = await grievanceApi.assignGrievance(id, payload);
      if (res.data?.success) {
        toast.success('Department and officer assignment updated successfully.');
        fetchGrievance();
      }
    } catch (err) {
      setAssignError(getErrorMessage(err));
    } finally {
      setAssigning(false);
    }
  };

  // Handle Status Update
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setStatusError(null);

    if (!targetStatus) {
      setStatusError('Please select a valid target status.');
      return;
    }
    if (!remark.trim() || remark.trim().length < 5) {
      setStatusError('An official remark (at least 5 characters) is required for audit logs.');
      return;
    }

    setSubmittingStatus(true);
    try {
      const res = await grievanceApi.updateStatus(id, {
        status: targetStatus,
        remark: remark.trim()
      });
      if (res.data?.success) {
        toast.success(`Status updated to ${targetStatus}`);
        setRemark('');
        fetchGrievance();
      }
    } catch (err) {
      setStatusError(getErrorMessage(err));
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Handle Comment Submission
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await grievanceApi.addComment(id, {
        text: commentText.trim(),
        isInternal
      });
      if (res.data?.success) {
        toast.success(isInternal ? 'Internal note recorded.' : 'Comment posted.');
        setCommentText('');
        setIsInternal(false);
        fetchGrievance();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingComment(false);
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
          to="/admin/grievances"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Grievance Registry
        </Link>
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h2 className="text-base font-semibold text-slate-900">Grievance Not Found</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{error || 'Record does not exist.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allowedNextStatuses = OFFICER_ALLOWED_TRANSITIONS[grievance.status] || [];

  return (
    <div className="space-y-6">
      {/* Top Back Link */}
      <div>
        <Link
          to="/admin/grievances"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Grievances Registry
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
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Escalated (Overdue)
                  </span>
                )}
                {grievance.reopenCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Reopened by Citizen
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                {grievance.title}
              </h1>
            </div>

            <div className="text-right text-xs text-slate-500 space-y-1">
              <div>Filed on {formatDate(grievance.createdAt)}</div>
              <div className="text-slate-400">Department: {grievance.department?.name || 'Assigned'}</div>
            </div>
          </div>

          {/* Citizen & Location Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block font-medium uppercase text-[10px] tracking-wider">
                Complainant Citizen
              </span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {grievance.citizen?.name || 'Citizen'}
              </span>
              <span className="text-slate-400 text-[11px] block">{grievance.citizen?.email || '—'}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium uppercase text-[10px] tracking-wider">
                Assigned Officer
              </span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                {grievance.assignedOfficer?.name || 'Unassigned / Dept Pool'}
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
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Statement, Evidence, Communications */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Citizen Grievance Statement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {grievance.description}
              </p>

              {/* Attachments */}
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

          {/* Feedback Display */}
          {grievance.feedback?.rating && (
            <Card className="border-emerald-200 bg-emerald-50/20">
              <CardHeader>
                <CardTitle className="text-emerald-900 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Citizen Feedback & Rating
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-1.5 text-xs text-slate-700">
                <div className="font-semibold text-slate-900">
                  {grievance.feedback.rating} / 5 Stars
                </div>
                {grievance.feedback.comment && (
                  <p className="italic bg-white p-2.5 rounded border border-slate-200">
                    "{grievance.feedback.comment}"
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Communications & Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary-600" />
                Case Communications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Note Form */}
              <form onSubmit={handleAddComment} className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <Textarea
                  placeholder="Post an administrative directive or internal case note..."
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                    <span className="flex items-center gap-1 font-medium text-amber-900">
                      <Lock className="w-3.5 h-3.5 text-amber-600" /> Internal note (hidden from citizen)
                    </span>
                  </label>

                  <Button
                    type="submit"
                    variant={isInternal ? 'secondary' : 'primary'}
                    size="sm"
                    iconLeft={Send}
                    isLoading={submittingComment}
                    disabled={!commentText.trim()}
                  >
                    {isInternal ? 'Record Internal Note' : 'Send Public Response'}
                  </Button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-3 pt-2">
                {!grievance.comments || grievance.comments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No notes or comments on this case.
                  </p>
                ) : (
                  grievance.comments.map((comment, index) => {
                    const isInternalNote = comment.isInternal;
                    const isStaff = ['officer', 'admin'].includes(comment.author?.role);

                    return (
                      <div
                        key={comment._id || index}
                        className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                          isInternalNote
                            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200'
                            : isStaff
                            ? 'bg-blue-50/40 border-blue-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">
                              {comment.author?.name || 'User'}
                            </span>
                            {isInternalNote ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-200 text-amber-900">
                                <Lock className="w-2.5 h-2.5" /> Internal Staff Note
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 capitalize">
                                {comment.author?.role || 'Citizen'}
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

        {/* Right Column: Reassign Panel, Status Panel, Timeline */}
        <div className="space-y-6">
          {/* Reassignment Panel (Admin Exclusive) */}
          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50/40">
              <CardTitle className="text-blue-900 flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-primary-600" />
                Department & Officer Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {assignError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{assignError}</span>
                </div>
              )}

              <form onSubmit={handleAssignSubmit} className="space-y-4">
                <Select
                  label="Target Department"
                  required
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    setSelectedOfficer(''); // Reset officer when department changes
                  }}
                  options={departments.map((d) => ({
                    value: d._id,
                    label: d.name
                  }))}
                />

                <Select
                  label="Assign Specific Officer (Optional)"
                  value={selectedOfficer}
                  onChange={(e) => setSelectedOfficer(e.target.value)}
                  options={[
                    { value: '', label: 'Unassigned / Department General Pool' },
                    ...filteredOfficers.map((off) => ({
                      value: off._id,
                      label: `${off.name} (${off.email})`
                    }))
                  ]}
                  helperText={
                    filteredOfficers.length === 0
                      ? 'No active officers provisioned for this department.'
                      : `${filteredOfficers.length} officer(s) in this department.`
                  }
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={assigning}
                >
                  Commit Reassignment
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Status Update Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-600" />
                Administrative Status Transition
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {statusError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{statusError}</span>
                </div>
              )}

              {allowedNextStatuses.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 text-center">
                  Grievance is currently <strong>{grievance.status}</strong>.
                </div>
              ) : (
                <form onSubmit={handleStatusUpdate} className="space-y-4">
                  <Select
                    label="Permitted Transition"
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    options={allowedNextStatuses.map((st) => ({
                      value: st,
                      label: `${st} (${STATUS_CONFIG[st]?.label || st})`
                    }))}
                  />

                  <Textarea
                    label="Audit Remark (Mandatory)"
                    required
                    rows={3}
                    placeholder="Provide administrative justification..."
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    helperText="Minimum 5 characters."
                  />

                  <Button
                    type="submit"
                    variant={targetStatus === STATUSES.REJECTED ? 'danger' : 'secondary'}
                    className="w-full"
                    isLoading={submittingStatus}
                  >
                    Update Status: {targetStatus}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Audit Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Audit Trail Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <StatusTimeline history={grievance.statusHistory} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminGrievanceDetail;
