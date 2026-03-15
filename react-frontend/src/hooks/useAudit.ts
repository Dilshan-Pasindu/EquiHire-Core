/**
 * @fileoverview Hook for audit logs and stats; supports refresh and auto-refresh interval.
 */

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/lib/api';
import type { AuditLog } from '@/types';

export interface AuditStats {
  total: number;
  today: number;
  actors: number;
}

export interface UseAuditOptions {
  userId: string | undefined;
  /** Auto-refresh interval in ms; 0 to disable. Default 30000. */
  autoRefreshMs?: number;
}

export interface UseAuditResult {
  logs: AuditLog[];
  stats: AuditStats;
  lastSynced: Date | null;
  isLoading: boolean;
  isSyncing: boolean;
  refresh: () => Promise<void>;
  /** Tailwind classes for action badge by action string. */
  getActionColor: (action: string) => string;
}

/**
 * Loads audit logs for the user's organization and computes basic stats.
 */
export function useAudit({
  userId,
  autoRefreshMs = 30000,
}: UseAuditOptions): UseAuditResult {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({ total: 0, today: 0, actors: 0 });
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshLogs = useCallback(async (id: string) => {
    try {
      const data = await API.getAuditLogs(id);
      const list = data ?? [];
      setLogs(list);
      const today = new Date().toDateString();
      const todayLogs = list.filter((l: AuditLog) => new Date(l.created_at).toDateString() === today);
      const uniqueActors = new Set(list.map((l: AuditLog) => l.actor));
      setStats({ total: list.length, today: todayLogs.length, actors: uniqueActors.size });
      setLastSynced(new Date());
    } catch (err) {
      console.error('Failed to refresh audit logs', err);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!orgId) return;
    setIsSyncing(true);
    await refreshLogs(orgId);
    setIsSyncing(false);
  }, [orgId, refreshLogs]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      try {
        const org = await API.getOrganization(userId);
        if (cancelled) return;
        if (org?.id) {
          setOrgId(org.id);
          await refreshLogs(org.id);
        }
      } catch (err) {
        if (!cancelled) console.error('Failed to load audit', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, refreshLogs]);

  useEffect(() => {
    if (!orgId || autoRefreshMs <= 0) return;
    const interval = setInterval(() => refreshLogs(orgId), autoRefreshMs);
    return () => clearInterval(interval);
  }, [orgId, autoRefreshMs, refreshLogs]);

  const getActionColor = useCallback((action: string) => {
    const a = action.toLowerCase();
    if (a.includes('delete') || a.includes('remove') || a.includes('violation')) return 'text-red-600 bg-red-50';
    if (a.includes('create') || a.includes('add') || a.includes('invite') || a.includes('submit')) return 'text-green-600 bg-green-50';
    if (a.includes('update') || a.includes('edit') || a.includes('send')) return 'text-blue-600 bg-blue-50';
    if (a.includes('login') || a.includes('auth')) return 'text-purple-600 bg-purple-50';
    if (a.includes('lockdown') || a.includes('flag') || a.includes('cheat')) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  }, []);

  return {
    logs,
    stats,
    lastSynced,
    isLoading,
    isSyncing,
    refresh,
    getActionColor,
  };
}
