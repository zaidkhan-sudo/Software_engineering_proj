import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, CheckCheck, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';

export const NotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount, setUnreadCount, lastEvent } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLatestNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getNotifications({ limit: 6 });
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || res.data.data || []);
      }
    } catch (err) {
      // Soft fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLatestNotifications();
    }
  }, [isOpen, lastEvent]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

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

    setIsOpen(false);

    if (notif.grievance) {
      const gId = notif.grievance._id || notif.grievance;
      if (user?.role === ROLES.ADMIN) {
        navigate(`/admin/grievances/${gId}`);
      } else if (user?.role === ROLES.OFFICER) {
        navigate(`/officer/grievances/${gId}`);
      } else {
        navigate(`/citizen/grievances/${gId}`);
      }
    } else {
      navigate('/notifications');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        title="View Notifications"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-700">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Loading notifications…
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3 text-xs cursor-pointer transition-colors flex items-start gap-2.5 ${
                    !n.isRead
                      ? 'bg-blue-50/40 hover:bg-blue-50/70 font-medium'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="mt-1 flex-shrink-0">
                    {!n.isRead ? (
                      <span className="w-2 h-2 rounded-full bg-primary-600 block ring-2 ring-primary-100" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <p className={`leading-relaxed ${!n.isRead ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
              <span>View All Notifications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
