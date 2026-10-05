import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOnline, pendingCount, isSyncing, lastSyncTime, triggerBackgroundSync } = useOnlineStatus();

  return (
    <div className="flex items-center gap-2 text-xs">
      {isOnline ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span className="font-medium hidden sm:inline">En línea</span>
          {pendingCount > 0 && (
            <button
              onClick={triggerBackgroundSync}
              disabled={isSyncing}
              className="flex items-center gap-1 ml-1 text-[11px] bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 px-1.5 py-0.5 rounded transition"
              title="Sincronizar mutaciones locales con la nube"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{pendingCount} pendientes</span>
            </button>
          )}
          {lastSyncTime && pendingCount === 0 && (
            <span className="text-[10px] text-emerald-400/70 hidden md:inline">
              · Sync {lastSyncTime}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/70 border border-amber-800/80 text-amber-300 shadow-sm animate-pulse">
          <WifiOff className="w-3 h-3 text-amber-400" />
          <span className="font-semibold">Modo Offline</span>
          <span className="text-[10px] text-amber-200 hidden sm:inline">· Guardado en dispositivo</span>
          {pendingCount > 0 && (
            <span className="text-[10px] bg-amber-900/90 text-amber-200 px-1.5 py-0.5 rounded font-mono">
              +{pendingCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
