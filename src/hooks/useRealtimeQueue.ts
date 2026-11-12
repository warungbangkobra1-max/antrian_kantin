import { useState, useEffect, useRef, useCallback } from 'react';
import { QueueItem, QueueStats } from '../types';
import { api } from '../services/api';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '../lib/supabase/client';

const OFFLINE_QUEUE_KEY = 'antrean_kantin_offline_pending_v1';

const DEFAULT_STATS: QueueStats = {
  total: 0,
  waiting: 0,
  processing: 0,
  ready: 0,
  called: 0,
  completed: 0,
  skipped: 0,
  cancelled: 0,
};

export function useRealtimeQueue() {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats>(DEFAULT_STATS);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isCloudDb, setIsCloudDb] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<{ action: string; item: QueueItem | null } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingOfflineRef = useRef<boolean>(false);

  // Load offline pending items from localStorage
  const getOfflinePending = (): QueueItem[] => {
    try {
      const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  // Sync offline queued items back to server/Supabase
  const syncOfflineQueue = useCallback(async () => {
    if (isSyncingOfflineRef.current) return;
    const pending = getOfflinePending();
    if (pending.length === 0) {
      setOfflinePendingCount(0);
      return;
    }

    try {
      isSyncingOfflineRef.current = true;
      const res = await api.syncOfflineQueues(pending);
      if (res.success) {
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
        setOfflinePendingCount(0);
      }
    } catch (err) {
      console.warn('Gagal sinkronisasi antrean offline:', err);
    } finally {
      isSyncingOfflineRef.current = false;
    }
  }, []);

  // Queue an item locally when offline
  const enqueueOffline = useCallback((item: QueueItem) => {
    const pending = getOfflinePending();
    // Prevent duplicate
    if (!pending.some((p) => p.id === item.id || (item.clientId && p.clientId === item.clientId))) {
      pending.push(item);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(pending));
      setOfflinePendingCount(pending.length);
    }

    // Also update current view state optimistically
    setQueues((prev) => {
      if (prev.some((q) => q.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  // Full reload from API
  const refreshQueues = useCallback(async () => {
    try {
      const data = await api.getQueues();
      setQueues(data.queues);
      setStats(data.stats);
      setIsCloudDb(Boolean(data.cloudDb));
      setIsOnline(true);
      setLastSyncTime(Date.now());
      setIsLoading(false);

      // Check if there are offline pending items to sync
      const pending = getOfflinePending();
      setOfflinePendingCount(pending.length);
      if (pending.length > 0) {
        await syncOfflineQueue();
      }
    } catch (err) {
      console.warn('Sync failed:', err);
      setIsOnline(false);
      setIsLoading(false);
    }
  }, [syncOfflineQueue]);

  // Connect SSE Stream
  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const es = new EventSource('/api/queues/events');
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsOnline(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      es.addEventListener('queue_init', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.queues) setQueues(payload.queues);
          if (payload.stats) setStats(payload.stats);
          setIsOnline(true);
          setLastSyncTime(Date.now());
          setIsLoading(false);
        } catch (e) {
          console.error('Failed to parse queue_init', e);
        }
      });

      es.addEventListener('queue_update', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.queues) setQueues(payload.queues);
          if (payload.stats) setStats(payload.stats);
          setLastAction({
            action: payload.action,
            item: payload.item || null,
          });
          setIsOnline(true);
          setLastSyncTime(Date.now());
        } catch (e) {
          console.error('Failed to parse queue_update', e);
        }
      });

      es.onerror = () => {
        setIsOnline(false);
        es.close();
        eventSourceRef.current = null;

        // Schedule reconnect
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connectSSE();
            refreshQueues();
          }, 3500);
        }
      };
    } catch (err) {
      console.warn('EventSource initialization failed:', err);
      setIsOnline(false);
    }
  }, [refreshQueues]);

  // Supabase Realtime channel subscription
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const channel = supabase
        .channel('antrean-orders-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => {
            refreshQueues();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsCloudDb(true);
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Supabase realtime subscription notice:', err);
    }
  }, [refreshQueues]);

  // Network online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      connectSSE();
      refreshQueues();
      syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load
    refreshQueues();
    connectSSE();

    // Health check on startup
    api.checkHealth().then((h) => {
      setIsCloudDb(h.cloudDb);
    });

    // Polling fallback (every 3.5s) for instant multi-device synchronization
    pollingIntervalRef.current = setInterval(() => {
      refreshQueues();
    }, 3500);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [connectSSE, refreshQueues, syncOfflineQueue]);

  return {
    queues,
    stats,
    isOnline,
    isCloudDb,
    supabaseConfigured: isSupabaseConfigured(),
    lastAction,
    lastSyncTime,
    isLoading,
    offlinePendingCount,
    enqueueOffline,
    syncOfflineQueue,
    refreshQueues,
  };
}
