"use client"

import { useOffline } from '@/hooks/use-offline';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
    const { isOnline, syncStatus, pendingOperations, forceSync } = useOffline();
    const [showIndicator, setShowIndicator] = useState(false);
    const [autoSyncTriggered, setAutoSyncTriggered] = useState(false);

    // Mostrar indicador cuando estamos offline o hay operaciones pendientes
    useEffect(() => {
        setShowIndicator(!isOnline || pendingOperations > 0 || syncStatus.syncing);
    }, [isOnline, pendingOperations, syncStatus.syncing]);

    // Auto-sync cuando recuperamos conexión
    useEffect(() => {
        if (isOnline && pendingOperations > 0 && !syncStatus.syncing && !autoSyncTriggered) {
            setAutoSyncTriggered(true);

            // Esperar 1 segundo antes de sincronizar automáticamente
            setTimeout(async () => {
                console.log('[AUTO-SYNC] Iniciando sincronización automática...');
                try {
                    const result = await forceSync();
                    if (result.success) {
                        toast.success('✓ Sincronización completada', {
                            description: `${result.details.length} operación${result.details.length !== 1 ? 'es' : ''} sincronizada${result.details.length !== 1 ? 's' : ''}`
                        });
                    }
                } catch (error: any) {
                    console.error('[AUTO-SYNC] Error:', error);
                }
                setAutoSyncTriggered(false);
            }, 1000);
        }
    }, [isOnline, pendingOperations, syncStatus.syncing, autoSyncTriggered, forceSync]);

    // No mostrar nada si estamos online sin operaciones pendientes
    if (!showIndicator) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
            {/* Modo Offline */}
            {!isOnline && (
                <Alert className="bg-amber-50 border-amber-300 shadow-lg backdrop-blur-sm">
                    <WifiOff className="h-4 w-4 text-amber-600" />
                    <AlertDescription>
                        <div>
                            <p className="font-semibold text-amber-900">Modo Sin Conexión</p>
                            <p className="text-xs text-amber-700 mt-1">
                                Los cambios se guardan localmente
                            </p>
                            {pendingOperations > 0 && (
                                <div className="flex items-center gap-2 mt-2 text-xs">
                                    <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-full">
                                        <AlertCircle className="h-3 w-3" />
                                        <span className="font-medium">{pendingOperations}</span>
                                    </div>
                                    <span className="text-amber-600">
                                        pendiente{pendingOperations !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Sincronizando */}
            {syncStatus.syncing && (
                <Alert className="bg-blue-50 border-blue-300 shadow-lg backdrop-blur-sm">
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    <AlertDescription>
                        <div>
                            <p className="font-semibold text-blue-900">Sincronizando...</p>
                            <div className="mt-2">
                                <div className="w-full bg-blue-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${syncStatus.progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-blue-700 mt-1">
                                    {syncStatus.progress.toFixed(0)}%
                                </p>
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Online con operaciones pendientes - Auto sincronización */}
            {isOnline && pendingOperations > 0 && !syncStatus.syncing && (
                <Alert className="bg-blue-50 border-blue-300 shadow-lg backdrop-blur-sm">
                    <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                    <AlertDescription>
                        <div>
                            <p className="font-semibold text-blue-900">Sincronización Automática</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-blue-700">
                                <span>
                                    Sincronizando {pendingOperations} operación{pendingOperations !== 1 ? 'es' : ''}...
                                </span>
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Error de sincronización */}
            {syncStatus.error && (
                <Alert variant="destructive" className="shadow-lg backdrop-blur-sm mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <p className="font-semibold">Error de sincronización</p>
                        <p className="text-xs mt-1">{syncStatus.error}</p>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}