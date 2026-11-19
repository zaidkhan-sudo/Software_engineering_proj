import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Tag,
  Calendar,
  AlertCircle,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { analyticsApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import { STATUSES, STATUS_CONFIG } from '../../utils/constants';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [resolutionTimes, setResolutionTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, catRes, resTimeRes] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getByCategory(),
        analyticsApi.getResolutionTime()
      ]);

      if (sumRes.data?.success) setSummary(sumRes.data.data);
      if (catRes.data?.success) setByCategory(catRes.data.data.categories || catRes.data.data || []);
      if (resTimeRes.data?.success) {
        setResolutionTimes(resTimeRes.data.data.departments || resTimeRes.data.data.resolutionTimes || []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalComplaints = summary?.total || 0;
  const maxCategoryCount = Math.max(...byCategory.map((c) => c.count || 0), 1);
  const maxResolutionHours = Math.max(
    ...resolutionTimes.map((r) => r.avgResolutionHours || 0),
    1
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Redressal Analytics"
        description="Data-driven oversight on volume trends, resolution velocity, department workloads, and escalation triggers."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            iconLeft={RefreshCw}
            isLoading={loading}
          >
            Refresh Metrics
          </Button>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Volume</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">
                {loading ? <Skeleton className="h-8 w-12" /> : totalComplaints}
              </p>
            </div>
            <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-600">
              <BarChart3 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Resolved Cases</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">
                {loading ? <Skeleton className="h-8 w-12" /> : summary?.byStatus?.RESOLVED || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={summary?.overdue > 0 ? 'border-amber-300 bg-amber-50/20' : ''}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overdue (&gt;7 Days)</p>
              <p className={`text-2xl font-semibold mt-1 ${summary?.overdue > 0 ? 'text-amber-700 font-bold' : 'text-slate-900'}`}>
                {loading ? <Skeleton className="h-8 w-12" /> : summary?.overdue || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={summary?.escalated > 0 ? 'border-rose-300 bg-rose-50/20' : ''}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Escalated</p>
              <p className={`text-2xl font-semibold mt-1 ${summary?.escalated > 0 ? 'text-rose-600 font-bold' : 'text-slate-900'}`}>
                {loading ? <Skeleton className="h-8 w-12" /> : summary?.escalated || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-md bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary-600" />
              Volume by Municipal Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : byCategory.length === 0 ? (
              <EmptyState title="No category metrics recorded" />
            ) : (
              <div className="space-y-3.5">
                {byCategory.map((item) => {
                  const percent = Math.round((item.count / maxCategoryCount) * 100);
                  const totalPercent = totalComplaints > 0 ? Math.round((item.count / totalComplaints) * 100) : 0;

                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                        <span>{item.category}</span>
                        <span className="text-slate-500">
                          {item.count} complaints ({totalPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resolution Velocity by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-600" />
              Average Resolution Velocity by Department
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : resolutionTimes.length === 0 ? (
              <EmptyState
                title="No resolved cases recorded yet"
                description="Average turnaround time will display once departments transition complaints to RESOLVED."
              />
            ) : (
              <div className="space-y-4">
                {resolutionTimes.map((item) => {
                  const hours = Math.round(item.avgResolutionHours || 0);
                  const days = (hours / 24).toFixed(1);
                  const percent = Math.round((hours / maxResolutionHours) * 100);

                  return (
                    <div key={item.departmentId || item.departmentName || index} className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">
                          {item.departmentName || item.name || 'Department'}
                        </span>
                        <span className="text-primary-700 font-mono font-medium">
                          {hours}h ({days} days avg)
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percent, 8)}%` }}
                        />
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
                        <span>Total Resolved Cases: <strong>{item.resolvedCount || 0}</strong></span>
                        <span>Turnaround SLA Benchmark: <strong>7 Days</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Pipeline Detail */}
      <Card>
        <CardHeader>
          <CardTitle>System Pipeline Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.keys(STATUSES).map((st) => {
              const count = summary?.byStatus?.[st] || 0;
              const cfg = STATUS_CONFIG[st] || {};
              const pct = totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0;

              return (
                <div
                  key={st}
                  className={`p-3.5 rounded-lg border ${cfg.bg || 'bg-slate-50'} ${cfg.border || 'border-slate-200'} text-center`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                    {cfg.label || st}
                  </span>
                  <span className={`text-2xl font-bold ${cfg.text || 'text-slate-800'} mt-1 block`}>
                    {loading ? '—' : count}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    {loading ? '—' : `${pct}% of total`}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
