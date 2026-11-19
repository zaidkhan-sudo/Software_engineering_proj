import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  PlusCircle,
  FileText,
  AlertCircle,
  RefreshCw,
  Building2,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { grievanceApi, categoryApi } from '../../services/api';
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
import GrievanceCard from '../../components/grievance/GrievanceCard';

export const MyGrievances = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [grievances, setGrievances] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Load category options once
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryApi.getCategories();
        if (res.data?.success) {
          setCategories(res.data.data.categories || []);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadCategories();
  }, []);

  const fetchGrievances = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: 10
      };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
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
  }, [page, statusFilter, categoryFilter, search]);

  useEffect(() => {
    fetchGrievances();
  }, [fetchGrievances]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGrievances();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Filed Grievances"
        description="Comprehensive log of all complaints submitted by your account and their resolution status."
        action={
          <Link to="/citizen/file">
            <Button variant="primary" iconLeft={PlusCircle}>
              Lodge New Grievance
            </Button>
          </Link>
        }
      />

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Search tracking ID or title..."
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
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map((c) => ({ value: c, label: c }))
              ]}
            />

            <div className="flex items-center space-x-2">
              <Button type="submit" variant="secondary" className="flex-1">
                Filter
              </Button>
              {(search || statusFilter || categoryFilter) && (
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

      {/* Content Area */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

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
              title={
                search || statusFilter || categoryFilter
                  ? 'No grievances match your filter criteria'
                  : "You haven't filed any grievances yet"
              }
              description={
                search || statusFilter || categoryFilter
                  ? 'Try clearing the search query or changing your status selection to see more results.'
                  : 'Report municipal issues such as potholes, leaking water pipes, sanitation, or power failures.'
              }
              actionText={
                search || statusFilter || categoryFilter ? 'Clear All Filters' : 'File your first grievance'
              }
              onAction={
                search || statusFilter || categoryFilter
                  ? handleResetFilters
                  : () => window.location.hash = '#/citizen/file'
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card className="overflow-hidden">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Tracking ID</TableHeader>
                    <TableHeader>Title & Category</TableHeader>
                    <TableHeader>Department</TableHeader>
                    <TableHeader>Priority</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Filed Date</TableHeader>
                    <TableHeader className="text-right">Action</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grievances.map((g) => (
                    <TableRow key={g._id} className="hover:bg-slate-50/70">
                      <TableCell className="font-mono text-xs font-semibold text-primary-700">
                        {g.trackingId}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900 max-w-xs truncate">
                          {g.title}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{g.category}</div>
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
            </Card>
          </div>

          {/* Mobile Card List View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {grievances.map((g) => (
              <GrievanceCard key={g._id} grievance={g} />
            ))}
          </div>

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

export default MyGrievances;
