import { useEffect, useState, useCallback } from 'react';
import { clearSyncQueue, getPendingMutationsCount, subscribeToDBChanges } from '../db/indexedDb';

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
  }, [checkPending]);

  const triggerBackgroundSync = async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    // Simulate background push to Supabase with resolve
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await clearSyncQueue();
      setPendingCount(0);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Error in background sync', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncTime,
    triggerBackgroundSync,
  };
}
