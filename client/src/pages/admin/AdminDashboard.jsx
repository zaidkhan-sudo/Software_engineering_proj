import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  ClipboardList,
  Play,
  RotateCw,
  ArrowRight,
  AlertCircle,
  Tag
} from 'lucide-react';
import { analyticsApi, grievanceApi, jobApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { STATUSES, STATUS_CONFIG } from '../../utils/constants';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [summary, setSummary] = useState(null);
  const [recentGrievances, setRecentGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runningJob, setRunningJob] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, grvRes] = await Promise.all([
        analyticsApi.getSummary(),
        grievanceApi.getGrievances({ limit: 5 })
      ]);

      if (sumRes.data?.success) {
        setSummary(sumRes.data.data);
      }
      if (grvRes.data?.success) {
        setRecentGrievances(grvRes.data.data.grievances || []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTriggerEscalation = async () => {
    setRunningJob(true);
    try {
      const res = await jobApi.triggerEscalation();
      if (res.data?.success) {
        const count = res.data.data?.escalatedCount || 0;
        toast.success(`Auto-escalation executed. Flagged ${count} overdue grievance(s).`);
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRunningJob(false);
    }
  };

  const byStatus = summary?.byStatus || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Operations Dashboard"
        description={`Logged in as ${user?.name || 'Administrator'}. Centralized oversight of complaints, departmental velocity, and staff performance.`}
        action={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTriggerEscalation}
              iconLeft={Play}
              isLoading={runningJob}
              title="Execute auto-escalation cron routine manually"
            >
              Run Escalation Scan
            </Button>
            <Link to="/admin/analytics">
              <Button variant="primary" size="sm" iconLeft={BarChart3}>
                Analytics Reports
              </Button>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Complaints</p>
              <p className="text-3xl font-semibold text-slate-900 mt-1">
                {loading ? <Skeleton className="h-8 w-12" /> : summary?.total || 0}
              </p>
            </div>
            <div className="w-11 h-11 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-600">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Unresolved / Active</p>
              <p className="text-3xl font-semibold text-slate-900 mt-1">
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  (byStatus.SUBMITTED || 0) +
                  (byStatus.UNDER_REVIEW || 0) +
                  (byStatus.IN_PROGRESS || 0) +
                  (byStatus.REOPENED || 0)
                )}
              </p>
            </div>
            <div className="w-11 h-11 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className={summary?.escalated > 0 ? 'border-rose-300 bg-rose-50/20' : ''}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Escalated (Overdue)</p>
              <p className={`text-3xl font-semibold mt-1 ${summary?.escalated > 0 ? 'text-rose-600 font-bold' : 'text-slate-900'}`}>
                {loading ? <Skeleton className="h-8 w-12" /> : summary?.escalated || 0}
              </p>
            </div>
            <div className="w-11 h-11 rounded-md bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Resolved</p>
              <p className="text-3xl font-semibold text-slate-900 mt-1">
                {loading ? <Skeleton className="h-8 w-12" /> : byStatus.RESOLVED || 0}
              </p>
            </div>
            <div className="w-11 h-11 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Complaint Pipeline Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.keys(STATUSES).map((st) => {
              const count = byStatus[st] || 0;
              const cfg = STATUS_CONFIG[st] || {};
              return (
                <div
                  key={st}
                  className={`p-3 rounded-lg border ${cfg.bg || 'bg-slate-50'} ${cfg.border || 'border-slate-200'} text-center`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                    {cfg.label || st}
                  </span>
                  <span className={`text-xl font-bold ${cfg.text || 'text-slate-800'} mt-1 block`}>
                    {loading ? '—' : count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/grievances" className="group">
          <Card className="hover:border-primary-400 transition-all h-full">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary-700">
                  Grievances Registry
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Search, filter, inspect, and reassign complaints across all departments.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/departments" className="group">
          <Card className="hover:border-primary-400 transition-all h-full">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary-700">
                  Department Config
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Define municipal divisions, route auto-assigned categories, and activate units.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/users" className="group">
          <Card className="hover:border-primary-400 transition-all h-full">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary-700">
                  Staff & User Directory
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Provision officer credentials, administer permissions, and view registered citizens.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Grievances Across All Departments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Municipal Inflow</CardTitle>
          <Link
            to="/admin/grievances"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1"
          >
            <span>View All Grievances</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : recentGrievances.length === 0 ? (
            <EmptyState
              title="No complaints registered in the system"
              description="New grievances lodged by citizens will appear here automatically."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Tracking ID</TableHeader>
                    <TableHeader>Citizen</TableHeader>
                    <TableHeader>Title</TableHeader>
                    <TableHeader>Department</TableHeader>
                    <TableHeader>Priority</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Date</TableHeader>
                    <TableHeader className="text-right">Action</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentGrievances.map((g) => (
                    <TableRow key={g._id} className="hover:bg-slate-50/70">
                      <TableCell className="font-mono text-xs font-semibold text-primary-700">
                        {g.trackingId}
                      </TableCell>
                      <TableCell className="text-xs text-slate-800">
                        {g.citizen?.name || 'Citizen'}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 max-w-xs truncate text-xs sm:text-sm">
                        {g.title}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {g.department?.name || 'Assigned'}
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={g.priority} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={g.status} />
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(g.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/admin/grievances/${g._id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
