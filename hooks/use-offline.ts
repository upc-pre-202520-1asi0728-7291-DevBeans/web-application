// hooks/use-offline.ts

import { useState, useEffect } from 'react';
import { syncService, SyncStatus } from '@/lib/services/sync.service';
import { offlineService } from '@/lib/services/offline.service';

export function useOffline() {
    const [isOnline, setIsOnline] = useState(true);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>({
        syncing: false,
        progress: 0
    });
    const [pendingOperations, setPendingOperations] = useState(0);

    useEffect(() => {
        // Inicializar IndexedDB
        offlineService.initDB();

        // Configurar listeners de conectividad
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Estado inicial
        setIsOnline(navigator.onLine);

        // Configurar auto-sync
        syncService.setupAutoSync();

        // Registrar callback de sincronización
        syncService.onSyncStatusChange((status) => {
            setSyncStatus(status);
        });

        // Actualizar contador de operaciones pendientes
        const updatePendingCount = async () => {
            const ops = await offlineService.getPendingOperations();
            setPendingOperations(ops.length);
        };

        updatePendingCount();
        const interval = setInterval(updatePendingCount, 5000); // Cada 5 segundos

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const forceSync = async () => {
        const result = await syncService.forceSyncNow();
        const ops = await offlineService.getPendingOperations();
        setPendingOperations(ops.length);
        return result;
    };

    return {
        isOnline,
        syncStatus,
        pendingOperations,
        forceSync
    };
}