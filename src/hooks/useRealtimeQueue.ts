import { useState, useEffect, useRef, useCallback } from 'react';
import { QueueItem, QueueStats } from '../types';
import { api } from '../services/api';

const DEFAULT_STATS: QueueStats = {
  total: 0,
  waiting: 0,
  called: 0,
  completed: 0,
  skipped: 0,
  cancelled: 0,
};

export function useRealtimeQueue() {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats>(DEFAULT_STATS);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastAction, setLastAction] = useState<{ action: string; item: QueueItem | null } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Full reload from API
  const refreshQueues = useCallback(async () => {
    try {
      const data = await api.getQueues();
      setQueues(data.queues);
      setStats(data.stats);
      setIsOnline(true);
      setLastSyncTime(Date.now());
      setIsLoading(false);
    } catch (err) {
      console.warn('Sync failed:', err);
      setIsOnline(false);
      setIsLoading(false);
    }
  }, []);

  // Connect SSE
  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const es = new EventSource('/api/queues/events');
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsOnline(true);
        // Clean any retry timeout
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
          }, 3000);
        }
      };
    } catch (err) {
      console.warn('EventSource initialization failed:', err);
      setIsOnline(false);
    }
  }, [refreshQueues]);

  // Network online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      connectSSE();
      refreshQueues();
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

    // Initial load & connect
    refreshQueues();
    connectSSE();

    // Fallback & multi-device sync polling (3s) for seamless Vercel serverless sync
    pollingIntervalRef.current = setInterval(() => {
      refreshQueues();
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [connectSSE, refreshQueues]);

  return {
    queues,
    stats,
    isOnline,
    lastAction,
    lastSyncTime,
    isLoading,
    refreshQueues,
  };
}
