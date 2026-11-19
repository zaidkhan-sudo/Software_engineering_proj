import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { grievanceApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { STATUSES, PRIORITIES } from '../../utils/constants';
import { formatDate, getErrorMessage } from '../../utils/helpers';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';

export const OfficerDashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [grievances, setGrievances] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, escalated: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const fetchDepartmentGrievances = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: 10
      };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (search.trim()) params.search = search.trim();

      const res = await grievanceApi.getGrievances(params);
      if (res.data?.success) {
        const list = res.data.data.grievances || [];
        setGrievances(list);

        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }

        // Lightweight department counts
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
  }, [page, statusFilter, priorityFilter, search]);

  useEffect(() => {
    fetchDepartmentGrievances();
  }, [fetchDepartmentGrievances]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDepartmentGrievances();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user?.department?.name || 'Department'} Grievance Desk`}
        description={`Active triage station for Officer ${user?.name || ''}. Review citizen evidence, update status, and log resolution remarks.`}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Queue Total</p>
              <p className="text-3xl font-semibold text-slate-900 mt-1">
                {loading ? <Skeleton className="h-8 w-12" /> : pagination.total}
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
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Needs Action</p>
              <p className="text-3xl font-semibold text-slate-900 mt-1">
                {loading ? <Skeleton className="h-8 w-12" /> : stats.pending}
              </p>
            </div>
            <div className="w-11 h-11 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className={stats.escalated > 0 ? 'border-rose-300 bg-rose-50/20' : ''}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Escalated</p>
              <p className={`text-3xl font-semibold mt-1 ${stats.escalated > 0 ? 'text-rose-600 font-bold' : 'text-slate-900'}`}>
                {loading ? <Skeleton className="h-8 w-12" /> : stats.escalated}
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

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Search ID, title, or citizen name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />

            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Statuses' },
                { value: STATUSES.SUBMITTED, label: 'Submitted (New)' },
                { value: STATUSES.UNDER_REVIEW, label: 'Under Review' },
                { value: STATUSES.IN_PROGRESS, label: 'In Progress' },
                { value: STATUSES.RESOLVED, label: 'Resolved' },
                { value: STATUSES.REJECTED, label: 'Rejected' },
                { value: STATUSES.REOPENED, label: 'Reopened' }
              ]}
            />

            <Select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Priorities' },
                { value: PRIORITIES.LOW, label: 'Low Priority' },
                { value: PRIORITIES.MEDIUM, label: 'Medium Priority' },
                { value: PRIORITIES.HIGH, label: 'High Priority' },
                { value: PRIORITIES.URGENT, label: 'Urgent Priority' }
              ]}
            />

            <div className="flex items-center space-x-2">
              <Button type="submit" variant="secondary" className="flex-1">
                Filter Queue
              </Button>
              {(search || statusFilter || priorityFilter) && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResetFilters}
                  className="text-slate-500"
                >
                  Reset
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Triage Queue Table */}
      {loading ? (
        <Card>
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      ) : grievances.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Building2}
              title={
                search || statusFilter || priorityFilter
                  ? 'No department complaints match the filter criteria'
                  : 'Your department queue is completely clear'
              }
              description={
                search || statusFilter || priorityFilter
                  ? 'Try modifying your search keywords or clearing status filters.'
                  : 'All complaints routed to your department have been addressed.'
              }
              actionText={
                search || statusFilter || priorityFilter ? 'Clear All Filters' : undefined
              }
              onAction={
                search || statusFilter || priorityFilter ? handleResetFilters : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Tracking ID</TableHeader>
                  <TableHeader>Citizen Details</TableHeader>
                  <TableHeader>Grievance & Category</TableHeader>
                  <TableHeader>Priority</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Date Filed</TableHeader>
                  <TableHeader className="text-right">Action</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {grievances.map((g) => (
                  <TableRow
                    key={g._id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      g.escalated ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <TableCell className="font-mono text-xs font-semibold text-primary-700">
                      <div>{g.trackingId}</div>
                      {g.escalated && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded mt-1">
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> Overdue
                        </span>
                      )}
                      {g.reopenCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-1">
                          <RotateCcw className="w-2.5 h-2.5 text-amber-600" /> Reopened
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-medium text-slate-800">
                        {g.citizen?.name || 'Citizen'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {g.citizen?.phone || g.citizen?.email || '—'}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-slate-900 max-w-xs truncate text-xs sm:text-sm">
                        {g.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{g.category}</div>
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
                        to={`/officer/grievances/${g._id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        <span>Triage & Update</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pt-2">
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;
