import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  Filter,
  ArrowRight,
  Calendar,
  User,
  AlertCircle,
  FileText
} from 'lucide-react';
import { auditLogApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card, { CardContent } from '../../components/common/Card';
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';

export const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();

      const res = await auditLogApi.getAuditLogs(params);
      if (res.data?.success) {
        setLogs(res.data.data.auditLogs || res.data.data.logs || res.data.data.statusHistory || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
  };

  const handleReset = () => {
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal System Audit Log"
        description="Immutable, timestamped ledger of all grievance status transitions, department reassignments, and administrative interventions."
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Card */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="max-w-md flex items-center space-x-2">
            <Input
              placeholder="Search by tracking ID or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
            {search && (
              <Button type="button" variant="ghost" onClick={handleReset} className="text-slate-500">
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Logs Table */}
      {loading ? (
        <Card>
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={ClipboardList}
              title="No audit entries found"
              description={search ? 'No audit history matches your query.' : 'Audit events will appear here as grievances change status.'}
              actionText={search ? 'Clear Search' : undefined}
              onAction={search ? handleReset : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Timestamp</TableHeader>
                  <TableHeader>Tracking Reference</TableHeader>
                  <TableHeader>Status Transition</TableHeader>
                  <TableHeader>Executed By</TableHeader>
                  <TableHeader>Official Audit Remark</TableHeader>
                  <TableHeader className="text-right">Case Link</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => {
                  const grv = log.grievance || {};
                  const user = log.changedBy || {};
                  const isSameStatus = log.fromStatus === log.toStatus;

                  return (
                    <TableRow key={log._id} className="hover:bg-slate-50/70">
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap font-mono">
                        {formatDate(log.createdAt || log.timestamp)}
                      </TableCell>

                      <TableCell className="font-mono text-xs font-semibold text-primary-700">
                        {grv.trackingId || '—'}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isSameStatus ? (
                            <span className="text-xs text-slate-600 font-medium">
                              Reassignment / Update
                            </span>
                          ) : (
                            <>
                              {log.fromStatus && (
                                <>
                                  <StatusBadge status={log.fromStatus} />
                                  <ArrowRight className="w-3 h-3 text-slate-400" />
                                </>
                              )}
                              <StatusBadge status={log.toStatus} />
                            </>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-slate-800">
                        <div className="font-medium">{user.name || 'System / Staff'}</div>
                        {user.role && (
                          <span className="text-[10px] text-slate-400 capitalize">{user.role}</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-slate-700 max-w-sm">
                        <span className="line-clamp-2" title={log.remark}>
                          {log.remark || '—'}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        {grv._id ? (
                          <Link
                            to={`/admin/grievances/${grv._id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
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

export default AuditLog;
