import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  FileText,
  AlertTriangle,
  RotateCcw,
  Building2,
  Calendar,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { grievanceApi, departmentApi } from '../../services/api';
import { STATUSES, PRIORITIES } from '../../utils/constants';
import { formatDate, getErrorMessage } from '../../utils/helpers';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Card, { CardContent } from '../../components/common/Card';
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';

export const AllGrievances = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [grievances, setGrievances] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [deptFilter, setDeptFilter] = useState(searchParams.get('department') || '');
  const [escalatedOnly, setEscalatedOnly] = useState(searchParams.get('escalated') === 'true');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await departmentApi.getDepartments();
        if (res.data?.success) {
          setDepartments(res.data.data.departments || []);
        }
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };
    loadDepartments();
  }, []);

  const fetchGrievances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (deptFilter) params.department = deptFilter;
      if (escalatedOnly) params.escalated = 'true';
      if (search.trim()) params.search = search.trim();

      const res = await grievanceApi.getGrievances(params);
      if (res.data?.success) {
        setGrievances(res.data.data.grievances || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, deptFilter, escalatedOnly, search]);

  useEffect(() => {
    fetchGrievances();
  }, [fetchGrievances]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGrievances();
  };

  const handleReset = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setDeptFilter('');
    setEscalatedOnly(false);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Grievance Registry"
        description="Comprehensive central registry across all municipal divisions. Inspect tickets, reassign departments, and triage escalations."
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Input
              placeholder="Search ID, title, or citizen..."
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
                { value: STATUSES.SUBMITTED, label: 'Submitted' },
                { value: STATUSES.UNDER_REVIEW, label: 'Under Review' },
                { value: STATUSES.IN_PROGRESS, label: 'In Progress' },
                { value: STATUSES.RESOLVED, label: 'Resolved' },
                { value: STATUSES.REJECTED, label: 'Rejected' },
                { value: STATUSES.REOPENED, label: 'Reopened' }
              ]}
            />

            <Select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Departments' },
                ...departments.map((d) => ({ value: d._id, label: d.name }))
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
                { value: PRIORITIES.LOW, label: 'Low' },
                { value: PRIORITIES.MEDIUM, label: 'Medium' },
                { value: PRIORITIES.HIGH, label: 'High' },
                { value: PRIORITIES.URGENT, label: 'Urgent' }
              ]}
            />

            <div className="flex items-center space-x-2">
              <Button type="submit" variant="secondary" className="flex-1">
                Filter
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                className="text-slate-500"
              >
                Reset
              </Button>
            </div>
          </form>

          {/* Additional Quick Filter Pill: Escalated Only */}
          <div className="flex items-center space-x-4 pt-2 border-t border-slate-100 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer select-none text-slate-700">
              <input
                type="checkbox"
                checked={escalatedOnly}
                onChange={(e) => {
                  setEscalatedOnly(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
              />
              <span className="font-medium flex items-center gap-1 text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5" /> Show Only Overdue / Escalated Complaints
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Grievance Table */}
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
              icon={FileText}
              title="No grievances match your criteria"
              description="Try broadening your filter selections or clearing the search keyword."
              actionText="Reset All Filters"
              onAction={handleReset}
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
                  <TableHeader>Citizen</TableHeader>
                  <TableHeader>Title & Category</TableHeader>
                  <TableHeader>Department & Officer</TableHeader>
                  <TableHeader>Priority</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Date</TableHeader>
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

                    <TableCell className="text-xs text-slate-800">
                      <div className="font-medium">{g.citizen?.name || 'Citizen'}</div>
                      <div className="text-[11px] text-slate-400">{g.citizen?.email || '—'}</div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-slate-900 max-w-xs truncate text-xs sm:text-sm">
                        {g.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{g.category}</div>
                    </TableCell>

                    <TableCell className="text-xs text-slate-700">
                      <div className="font-medium text-slate-900">{g.department?.name || 'Unassigned'}</div>
                      <div className="text-[11px] text-slate-400">
                        {g.assignedOfficer?.name ? `Officer: ${g.assignedOfficer.name}` : 'Dept Pool'}
                      </div>
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
                        <span>Manage & Reassign</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

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

export default AllGrievances;
