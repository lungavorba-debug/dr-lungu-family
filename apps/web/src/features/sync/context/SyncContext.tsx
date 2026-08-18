import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ScreeningSyncQueueItem, SyncProgressState } from '@medscreen/types';
import { useConnectionStatus } from '../../../shared/context/ConnectionStatusContext';
import { listSyncQueueItems, upsertSyncQueueItem } from '../lib/sync-queue-storage';
import {
  enqueueScreeningSync,
  readLastSuccessfulSyncAt,
  syncQueueItems,
  type EnqueueScreeningSyncInput,
} from '../services/sync-service';

interface SyncContextValue {
  items: ScreeningSyncQueueItem[];
  pendingItems: ScreeningSyncQueueItem[];
  syncedItems: ScreeningSyncQueueItem[];
  failedItems: ScreeningSyncQueueItem[];
  conflictItems: ScreeningSyncQueueItem[];
  lastSuccessfulSyncAt: string | null;
  progress: SyncProgressState;
  isLoading: boolean;
  refreshQueue: () => Promise<void>;
  enqueueScreening: (input: EnqueueScreeningSyncInput) => Promise<ScreeningSyncQueueItem>;
  syncNow: () => Promise<SyncRunResult>;
  retryItem: (itemId: string) => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

const idleProgress: SyncProgressState = {
  is_syncing: false,
  current: 0,
  total: 0,
  active_screening_id: null,
};

export interface SyncRunResult {
  processed: number;
  failed: number;
  conflicts: number;
  pending: number;
  synced: number;
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { isOnline } = useConnectionStatus();
  const [items, setItems] = useState<ScreeningSyncQueueItem[]>([]);
  const [lastSuccessfulSyncAt, setLastSuccessfulSyncAt] = useState<string | null>(
    readLastSuccessfulSyncAt(),
  );
  const [progress, setProgress] = useState<SyncProgressState>(idleProgress);
  const [isLoading, setIsLoading] = useState(true);
  const syncInFlightRef = useRef(false);
  const wasOfflineRef = useRef(!isOnline);

  const refreshQueue = useCallback(async () => {
    const nextItems = await listSyncQueueItems();
    setItems(nextItems);
    setLastSuccessfulSyncAt(readLastSuccessfulSyncAt());
  }, []);

  const runSync = useCallback(async (): Promise<SyncRunResult> => {
    if (syncInFlightRef.current || !isOnline) {
      const queue = await listSyncQueueItems();
      return summarizeQueue(queue);
    }

    syncInFlightRef.current = true;
    const queue = await listSyncQueueItems();
    const actionable = queue.filter((item) => item.status === 'pending' || item.status === 'failed');
    if (actionable.length === 0) {
      syncInFlightRef.current = false;
      return summarizeQueue(queue);
    }

    setProgress({
      is_syncing: true,
      current: 0,
      total: actionable.length,
      active_screening_id: null,
    });

    try {
      await syncQueueItems(actionable, (current, total, activeScreeningId) => {
        setProgress({
          is_syncing: true,
          current,
          total,
          active_screening_id: activeScreeningId,
        });
      });
      await refreshQueue();
      setLastSuccessfulSyncAt(readLastSuccessfulSyncAt());
      const updatedQueue = await listSyncQueueItems();
      return {
        ...summarizeQueue(updatedQueue),
        processed: actionable.length,
      };
    } finally {
      syncInFlightRef.current = false;
      setProgress(idleProgress);
    }
  }, [isOnline, refreshQueue]);

  const syncNow = useCallback(async () => runSync(), [runSync]);

  const retryItem = useCallback(
    async (itemId: string) => {
      const queue = await listSyncQueueItems();
      const item = queue.find((entry) => entry.id === itemId);
      if (!item) return;

      const retriable: ScreeningSyncQueueItem = {
        ...item,
        status: 'pending',
        updated_at: new Date().toISOString(),
        last_error: null,
      };
      await upsertSyncQueueItem(retriable);
      await refreshQueue();
      await runSync();
    },
    [refreshQueue, runSync],
  );

  const enqueueScreening = useCallback(
    async (input: EnqueueScreeningSyncInput) => {
      const item = await enqueueScreeningSync(input);
      await refreshQueue();
      if (isOnline) {
        void runSync();
      }
      return item;
    },
    [isOnline, refreshQueue, runSync],
  );

  useEffect(() => {
    void refreshQueue().finally(() => setIsLoading(false));
  }, [refreshQueue]);

  useEffect(() => {
    if (wasOfflineRef.current && isOnline) {
      void runSync();
    }
    wasOfflineRef.current = !isOnline;
  }, [isOnline, runSync]);

  const value = useMemo<SyncContextValue>(() => {
    const pendingItems = items.filter((item) => item.status === 'pending' || item.status === 'syncing');
    const syncedItems = items.filter((item) => item.status === 'synced');
    const failedItems = items.filter((item) => item.status === 'failed');
    const conflictItems = items.filter((item) => item.status === 'conflict');

    return {
      items,
      pendingItems,
      syncedItems,
      failedItems,
      conflictItems,
      lastSuccessfulSyncAt,
      progress,
      isLoading,
      refreshQueue,
      enqueueScreening,
      syncNow,
      retryItem,
    };
  }, [
    items,
    lastSuccessfulSyncAt,
    progress,
    isLoading,
    refreshQueue,
    enqueueScreening,
    syncNow,
    retryItem,
  ]);

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSyncQueue(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncQueue must be used within SyncProvider');
  }
  return context;
}

function summarizeQueue(queue: ScreeningSyncQueueItem[]): SyncRunResult {
  return {
    processed: 0,
    failed: queue.filter((item) => item.status === 'failed').length,
    conflicts: queue.filter((item) => item.status === 'conflict').length,
    pending: queue.filter((item) => item.status === 'pending' || item.status === 'syncing').length,
    synced: queue.filter((item) => item.status === 'synced').length,
  };
}

export { enqueueScreeningSync, type EnqueueScreeningSyncInput };
