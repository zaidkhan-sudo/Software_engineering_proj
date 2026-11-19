import React, { useState, useEffect } from 'react';
import { PlusCircle, FileText, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/common/Table';
import { useAuth } from '../../context/AuthContext';
import { grievanceApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { STATUSES } from '../../utils/constants';

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, escalated: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const res = await grievanceApi.getGrievances({ limit: 5 });
        if (res.data?.success) {
          const list = res.data.data.grievances || [];
          setGrievances(list);

          const total = res.data.pagination?.total || list.length;
          const pending = list.filter((g) =>
            [STATUSES.SUBMITTED, STATUSES.UNDER_REVIEW, STATUSES.IN_PROGRESS, STATUSES.REOPENED].includes(g.status)
          ).length;
          const resolved = list.filter((g) => g.status === STATUSES.RESOLVED).length;
          const escalated = list.filter((g) => g.escalated).length;

          setStats({ total, pending, resolved, escalated });
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name || 'Citizen'}`}
        description="Monitor status updates, lodge new civic issues, and track your active grievances in real time."
        action={
          <Link to="/citizen/file">
            <Button variant="primary" iconLeft={PlusCircle}>
              File New Grievance
            </Button>
          </Link>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Filed</p>
              <p className="text-3xl font-semibold text-slate-900 mt-1">
                {loading ? <Skeleton className="h-8 w-12" /> : stats.total}
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
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Under Redressal</p>
              <p className="text-3xl font-semibold text-slate-900 mt-1">
                {loading ? <Skeleton className="h-8 w-12" /> : stats.pending}
              </p>
            </div>
            <div className="w-11 h-11 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Resolved</p>
              <p className="text-3xl font-semibold text-slate-900 mt-1">
                {loading ? <Skeleton className="h-8 w-12" /> : stats.resolved}
              </p>
            </div>
            <div className="w-11 h-11 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area: Recent Submissions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Grievance Submissions</CardTitle>
          {grievances.length > 0 && (
            <Link
              to="/citizen/grievances"
              className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : grievances.length === 0 ? (
            <EmptyState
              title="You haven't filed any grievances yet"
              description="When you report local civic issues (such as potholes, water supply, or streetlights), they will appear here with live progress tracking."
              actionText="File your first grievance"
              onAction={() => window.location.hash = '#/citizen/file'}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Tracking ID</TableHeader>
                    <TableHeader>Title</TableHeader>
                    <TableHeader>Department</TableHeader>
                    <TableHeader>Priority</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Date</TableHeader>
                    <TableHeader className="text-right">Action</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grievances.map((g) => (
                    <TableRow key={g._id} className="hover:bg-slate-50/70">
                      <TableCell className="font-mono text-xs font-semibold text-primary-700">
                        {g.trackingId}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 max-w-xs truncate">
                        {g.title}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {g.department?.name || 'Department Assigned'}
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
                          to={`/citizen/grievances/${g._id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                        >
                          <span>View</span>
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

export default CitizenDashboard;
