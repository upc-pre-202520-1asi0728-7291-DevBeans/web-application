"use client"

import { useOffline } from '@/hooks/use-offline';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function OfflineIndicator() {
    const { isOnline, syncStatus, pendingOperations, forceSync } = useOffline();

    const handleForceSync = async () => {
        try {
            const result = await forceSync();

            if (result.success) {
                toast.success('Sincronización completada', {
                    description: `${result.details.length} operaciones sincronizadas`
                });
            } else {
                toast.error('Error en sincronización', {
                    description: result.message
                });
            }
        } catch (error: any) {
            toast.error('Error al sincronizar', {
                description: error.message
            });
        }
    };

    // Si estamos online y no hay operaciones pendientes, no mostrar nada
    if (isOnline && pendingOperations === 0 && !syncStatus.syncing) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
            {/* Modo Offline */}
            {!isOnline && (
                <Alert className="bg-amber-50 border-amber-300 shadow-lg">
                    <WifiOff className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-amber-900">Modo Sin Conexión</p>
                            <p className="text-xs text-amber-700 mt-1">
                                Los cambios se sincronizarán automáticamente al recuperar la conexión
                            </p>
                            {pendingOperations > 0 && (
                                <p className="text-xs text-amber-600 mt-1">
                                    {pendingOperations} operación{pendingOperations !== 1 ? 'es' : ''} pendiente{pendingOperations !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Sincronizando */}
            {syncStatus.syncing && (
                <Alert className="bg-blue-50 border-blue-300 shadow-lg">
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    <AlertDescription>
                        <div>
                            <p className="font-medium text-blue-900">Sincronizando...</p>
                            <p className="text-xs text-blue-700 mt-1">
                                Progreso: {syncStatus.progress.toFixed(0)}%
                            </p>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Online con operaciones pendientes */}
            {isOnline && pendingOperations > 0 && !syncStatus.syncing && (
                <Alert className="bg-green-50 border-green-300 shadow-lg">
                    <Wifi className="h-4 w-4 text-green-600" />
                    <AlertDescription className="flex items-center justify-between gap-4">
                        <div>
                            <p className="font-medium text-green-900">Conexión Restaurada</p>
                            <p className="text-xs text-green-700 mt-1">
                                {pendingOperations} operación{pendingOperations !== 1 ? 'es' : ''} pendiente{pendingOperations !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleForceSync}
                            className="text-green-700 border-green-300 hover:bg-green-100"
                        >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Sincronizar
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Error de sincronización */}
            {syncStatus.error && (
                <Alert variant="destructive" className="shadow-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <p className="font-medium">Error de sincronización</p>
                        <p className="text-xs mt-1">{syncStatus.error}</p>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}