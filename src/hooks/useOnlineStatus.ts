import { useEffect, useState, useCallback } from 'react';
import { getPendingMutationsCount, subscribeToDBChanges } from '../db/indexedDb';
import { syncPendingMutations } from '../db/syncQueue';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const checkPending = useCallback(async () => {
    try {
      const count = await getPendingMutationsCount();
      setPendingCount(count);
    } catch {
      // ignore
    }
  }, []);

  const triggerBackgroundSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncPendingMutations();
      setPendingCount(result.pending);
      if (result.synced > 0 || result.pending === 0) {
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error('Error in background sync', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerBackgroundSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkPending();
    const unsub = subscribeToDBChanges(() => {
      checkPending();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsub();
    };
  }, [checkPending, triggerBackgroundSync]);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      triggerBackgroundSync();
    }
  }, [isOnline, pendingCount, isSyncing, triggerBackgroundSync]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncTime,
    triggerBackgroundSync,
  };
}
