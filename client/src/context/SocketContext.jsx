import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { notificationApi } from '../services/api';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastEvent, setLastEvent] = useState(null);

  // Fetch initial unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await notificationApi.getNotifications({ limit: 50 });
      if (res.data?.success) {
        const list = res.data.data.notifications || res.data.data || [];
        const unread = list.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      // Soft failure (unauthenticated or offline)
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

    const s = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500
    });

    s.on('connect', () => {
      setIsConnected(true);
    });

    s.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    s.on('connect_error', (err) => {
      setIsConnected(false);
    });

    // Handle real-time notifications
    s.on('notification', (data) => {
      setUnreadCount((prev) => prev + 1);
      if (data?.message) {
        toast.info(data.message);
      }
      setLastEvent({
        event: 'notification',
        payload: data,
        timestamp: Date.now()
      });
    });

    // Handle status update broadcasts
    s.on('status-update', (data) => {
      setUnreadCount((prev) => prev + 1);
      const text = data?.message || `Status update for ${data?.trackingId}: ${data?.newStatus}`;
      toast.success(text);
      setLastEvent({
        event: 'status-update',
        payload: data,
        timestamp: Date.now()
      });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [isAuthenticated, token]);

  const value = {
    socket,
    isConnected,
    unreadCount,
    setUnreadCount,
    lastEvent,
    refreshUnreadCount
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
