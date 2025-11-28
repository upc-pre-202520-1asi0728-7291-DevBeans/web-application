// lib/services/sync.service.ts

import { offlineService, OperationType, PendingOperation } from './offline.service';
import { coffeeLotService } from './coffee-lot.service';
import { classificationService } from './classification.service';
import { userService } from './user.service';
import { authService } from './auth.service';

class SyncService {
    private isSyncing = false;
    private syncCallbacks: Array<(status: SyncStatus) => void> = [];

    /**
     * Verifica si hay conexión a internet
     */
    isOnline(): boolean {
        return navigator.onLine;
    }

    /**
     * Registra un callback para notificaciones de sincronización
     */
    onSyncStatusChange(callback: (status: SyncStatus) => void) {
        this.syncCallbacks.push(callback);
    }

    /**
     * Notifica cambios de estado de sincronización
     */
    private notifySyncStatus(status: SyncStatus) {
        this.syncCallbacks.forEach(callback => callback(status));
    }

    /**
     * Sincroniza todos los datos locales con el backend
     */
    async syncAll(): Promise<SyncResult> {
        if (this.isSyncing) {
            return {
                success: false,
                message: 'Ya hay una sincronización en progreso',
                details: []
            };
        }

        if (!this.isOnline()) {
            return {
                success: false,
                message: 'No hay conexión a internet',
                details: []
            };
        }

        this.isSyncing = true;
        this.notifySyncStatus({ syncing: true, progress: 0 });

        const results: SyncResult = {
            success: true,
            message: '',
            details: []
        };

        try {
            // 1. Sincronizar operaciones pendientes
            const pendingOps = await offlineService.getPendingOperations();
            console.log(`[SYNC] ${pendingOps.length} operaciones pendientes`);

            for (let i = 0; i < pendingOps.length; i++) {
                const op = pendingOps[i];
                const progress = ((i + 1) / pendingOps.length) * 100;
                this.notifySyncStatus({ syncing: true, progress });

                try {
                    await this.syncOperation(op);
                    await offlineService.deletePendingOperation(op.id!);

                    results.details.push({
                        type: op.type,
                        success: true,
                        message: `Operación ${op.type} sincronizada`
                    });
                } catch (error: any) {
                    console.error(`[SYNC] Error en operación ${op.type}:`, error);

                    // Incrementar contador de reintentos
                    op.retryCount++;
                    op.error = error.message;

                    // Si ha fallado más de 3 veces, marcar como error permanente
                    if (op.retryCount >= 3) {
                        results.details.push({
                            type: op.type,
                            success: false,
                            message: `Operación ${op.type} falló después de 3 intentos: ${error.message}`
                        });
                        await offlineService.deletePendingOperation(op.id!);
                    } else {
                        await offlineService.updatePendingOperation(op);
                        results.details.push({
                            type: op.type,
                            success: false,
                            message: `Operación ${op.type} reintentará más tarde`
                        });
                    }
                }
            }

            // 2. Sincronizar datos del servidor al local
            await this.syncFromServer();

            this.notifySyncStatus({ syncing: false, progress: 100 });
            results.message = 'Sincronización completada';

        } catch (error: any) {
            console.error('[SYNC] Error general:', error);
            results.success = false;
            results.message = `Error en sincronización: ${error.message}`;
            this.notifySyncStatus({ syncing: false, progress: 0, error: error.message });
        } finally {
            this.isSyncing = false;
        }

        return results;
    }

    /**
     * Sincroniza una operación pendiente específica
     */
    private async syncOperation(op: PendingOperation): Promise<void> {
        switch (op.type) {
            case OperationType.CREATE_LOT:
                const createdLot = await coffeeLotService.registerLot(op.data);
                await offlineService.saveLotLocally(createdLot);
                break;

            case OperationType.UPDATE_LOT:
                const updatedLot = await coffeeLotService.updateLot(op.data.lotId, op.data.updateData);
                await offlineService.saveLotLocally(updatedLot);
                break;

            case OperationType.DELETE_LOT:
                await coffeeLotService.deleteLot(op.data.lotId, op.data.deletionReason);
                await offlineService.deleteLotLocally(op.data.lotId);
                break;

            case OperationType.CREATE_CLASSIFICATION:
                const session = await classificationService.startClassificationSession(
                    op.data.coffeeLotId,
                    op.data.imageFile,
                    op.data.options
                );
                await offlineService.saveSessionLocally(session);
                break;

            default:
                console.warn(`[SYNC] Tipo de operación desconocido: ${op.type}`);
        }
    }

    /**
     * Sincroniza datos del servidor al almacenamiento local
     */
    private async syncFromServer(): Promise<void> {
        try {
            const user = authService.getUser();
            if (!user) return;

            // Sincronizar lotes
            const serverLots = await coffeeLotService.getLotsByProducer(user.id);
            for (const lot of serverLots) {
                await offlineService.saveLotLocally(lot);
            }

            // Sincronizar sesiones de clasificación
            const allSessions = await classificationService.getAllSessions();
            for (const session of allSessions) {
                await offlineService.saveSessionLocally(session);
            }

            console.log('[SYNC] Datos sincronizados desde el servidor');
        } catch (error) {
            console.error('[SYNC] Error al sincronizar desde servidor:', error);
            throw error;
        }
    }

    /**
     * Fuerza una sincronización inmediata
     */
    async forceSyncNow(): Promise<SyncResult> {
        return this.syncAll();
    }

    /**
     * Configura la sincronización automática al detectar conexión
     */
    setupAutoSync() {
        window.addEventListener('online', async () => {
            console.log('[SYNC] Conexión restaurada, iniciando sincronización...');

            // Verificar si hay sincronización automática habilitada
            const settings = localStorage.getItem('systemSettings');
            if (settings) {
                const prefs = JSON.parse(settings);
                if (prefs.autoSync) {
                    await this.syncAll();
                }
            }
        });

        window.addEventListener('offline', () => {
            console.log('[SYNC] Conexión perdida, trabajando en modo offline');
            this.notifySyncStatus({ syncing: false, progress: 0, offline: true });
        });

        // Intentar sincronizar al cargar la página
        if (this.isOnline()) {
            setTimeout(() => {
                const settings = localStorage.getItem('systemSettings');
                if (settings) {
                    const prefs = JSON.parse(settings);
                    if (prefs.autoSync) {
                        this.syncAll();
                    }
                }
            }, 1000);
        }
    }

    /**
     * Obtiene el estado actual de sincronización
     */
    getSyncStatus(): { pending: number; syncing: boolean } {
        return {
            pending: 0, // Se actualizará en tiempo real
            syncing: this.isSyncing
        };
    }
}

export interface SyncStatus {
    syncing: boolean;
    progress: number;
    error?: string;
    offline?: boolean;
}

export interface SyncResult {
    success: boolean;
    message: string;
    details: Array<{
        type: string;
        success: boolean;
        message: string;
    }>;
}

export const syncService = new SyncService();