import { useCallback, useEffect, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabase';
import {
  loadNotifications,
  loadUnreadNotificationCount,
  mapNotificationRow,
  markAllNotificationsRead,
  markNotificationRead,
  type InAppNotification,
  type NotificationRow,
} from '../lib/notifications';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchLatest = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      setLoading(true);
      const [list, count] = await Promise.all([
        loadNotifications(30),
        loadUnreadNotificationCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch {
      // Ignore background fetch error
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchLatest();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchLatest]);

  useEffect(() => {
    if (!user) return undefined;

    const channel: RealtimeChannel = supabase.channel(`user-notifications:${user.id}`);

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = mapNotificationRow(payload.new as NotificationRow);
          setNotifications((current) => {
            if (current.some((n) => n.id === newNotif.id)) return current;
            return [newNotif, ...current];
          });
          if (!newNotif.readAt) {
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = mapNotificationRow(payload.new as NotificationRow);
          setNotifications((current) => {
            const next = current.map((n) => (n.id === updated.id ? updated : n));
            setUnreadCount(next.filter((n) => !n.readAt).length);
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id?: string })?.id;
          if (!deletedId) return;
          setNotifications((current) => {
            const next = current.filter((n) => n.id !== deletedId);
            setUnreadCount(next.filter((n) => !n.readAt).length);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = useCallback(
    async (id: string) => {
      setNotifications((current) =>
        current.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await markNotificationRead(id);
      } catch {
        void fetchLatest();
      }
    },
    [fetchLatest]
  );

  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications((current) => current.map((n) => ({ ...n, readAt: n.readAt ?? now })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      void fetchLatest();
    }
  }, [fetchLatest]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchLatest,
  };
}
