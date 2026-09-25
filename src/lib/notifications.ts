import { supabase } from './supabase';
import type { Tables } from '../types/database';
import { assertOnline } from './connectivity';

export type NotificationRow = Tables<'notifications'>;

export type NotificationType = 'budget_near_limit' | 'budget_over_limit' | string;

export interface NotificationMetadata {
  budget_id?: string;
  category_id?: string;
  category_name?: string;
  spent?: number;
  limit?: number;
  currency?: string;
  progress?: number;
  period_start?: string;
  [key: string]: unknown;
}

export interface InAppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: NotificationMetadata;
  readAt: string | null;
  createdAt: string;
  dedupeKey: string | null;
}

export function mapNotificationRow(row: NotificationRow): InAppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    metadata: (row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? row.metadata
      : {}) as NotificationMetadata,
    readAt: row.read_at,
    createdAt: row.created_at,
    dedupeKey: row.dedupe_key,
  };
}

async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('You must be signed in to manage notifications.');
  return user;
}

export async function loadNotifications(limit = 30): Promise<InAppNotification[]> {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapNotificationRow);
}

export async function loadUnreadNotificationCount(): Promise<number> {
  const user = await requireUser();
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  assertOnline();
  const user = await requireUser();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<void> {
  assertOnline();
  const user = await requireUser();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null);

  if (error) throw error;
}

export function formatNotificationTime(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'Just now';
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
