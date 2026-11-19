import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  Filter,
  Check
} from 'lucide-react';
import { notificationApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Card, { CardContent } from '../../components/common/Card';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';

export const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setUnreadCount, lastEvent } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 15 };
      if (unreadOnly) params.unreadOnly = 'true';

      const res = await notificationApi.getNotifications(params);
      if (res.data?.success) {
        let list = res.data.data.notifications || res.data.data || [];
        if (unreadOnly) {
          list = list.filter((n) => !n.isRead);
        }
        setNotifications(list);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, lastEvent]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationApi.markAsRead(notif._id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    }

    if (notif.grievance) {
      const gId = notif.grievance._id || notif.grievance;
      if (user?.role === ROLES.ADMIN) {
        navigate(`/admin/grievances/${gId}`);
      } else if (user?.role === ROLES.OFFICER) {
        navigate(`/officer/grievances/${gId}`);
      } else {
        navigate(`/citizen/grievances/${gId}`);
      }
    }
  };

  const handleSingleMarkRead = async (e, notifId) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(notifId);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const unreadCountInList = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Center"
        description="Persistent alert history for status transitions, departmental remarks, and administrative escalations."
        action={
          unreadCountInList > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              iconLeft={CheckCheck}
            >
              Mark All as Read
            </Button>
          )
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => {
            setUnreadOnly(false);
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            !unreadOnly
              ? 'bg-primary-50 text-primary-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          All Notifications
        </button>
        <button
          type="button"
          onClick={() => {
            setUnreadOnly(true);
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            unreadOnly
              ? 'bg-primary-50 text-primary-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span>Unread Only</span>
          {unreadCountInList > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary-600 text-white font-bold">
              {unreadCountInList}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <Card>
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Bell}
              title={unreadOnly ? 'No unread notifications' : 'Your notification log is clear'}
              description={
                unreadOnly
                  ? 'All notifications have been reviewed.'
                  : 'You will receive updates here whenever grievance progress or remarks are logged.'
              }
              actionText={unreadOnly ? 'View All Notifications' : undefined}
              onAction={unreadOnly ? () => setUnreadOnly(false) : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n._id}
              onClick={() => handleItemClick(n)}
              className={`cursor-pointer transition-all hover:border-slate-300 ${
                !n.isRead
                  ? 'bg-blue-50/30 border-blue-200 shadow-xs'
                  : 'bg-white border-slate-200'
              }`}
            >
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {!n.isRead ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary-600 block ring-4 ring-primary-100" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-slate-300" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className={`text-sm leading-relaxed ${!n.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{formatDate(n.createdAt)}</span>
                      {n.grievance && (
                        <span className="text-primary-600 font-medium inline-flex items-center gap-1 hover:underline">
                          <span>Open Grievance</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleSingleMarkRead(e, n._id)}
                    iconLeft={Check}
                    className="text-slate-400 hover:text-slate-700 flex-shrink-0"
                    title="Mark as read"
                  >
                    Read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

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

export default Notifications;
