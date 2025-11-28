// lib/services/coffee-lot.service.ts (MEJORADO)

import { BaseService, API_BASE_URL } from './base.service';
import { offlineService, OperationType } from './offline.service';
import { toast } from 'sonner';

const COFFEE_LOT_BASE_URL = `${API_BASE_URL}/api/v1/coffee-lots`;

export enum CoffeeVariety {
    TYPICA = "TYPICA",
    CATURRA = "CATURRA",
    BOURBON = "BOURBON",
    GEISHA = "GEISHA",
    SL28 = "SL28",
    SL34 = "SL34",
    CASTILLO = "CASTILLO",
    COLOMBIA = "COLOMBIA"
}

export enum ProcessingMethod {
    WASHED = "WASHED",
    NATURAL = "NATURAL",
    HONEY = "HONEY",
    SEMI_WASHED = "SEMI_WASHED"
}

export enum LotStatus {
    REGISTERED = "REGISTERED",
    PROCESSING = "PROCESSING",
    CLASSIFIED = "CLASSIFIED",
    CERTIFIED = "CERTIFIED",
    SHIPPED = "SHIPPED"
}

export interface CoffeeLot {
    id: number;
    lot_number: string;
    producer_id: number;
    harvest_date: string;
    coffee_variety: string;
    quantity: number;
    status: string;
    processing_method: string;
    altitude?: number;
    latitude: number;
    longitude: number;
    created_at: string;
    updated_at: string;
    isLocal?: boolean;
}

export interface RegisterCoffeeLotData {
    producer_id: number;
    harvest_date: string;
    coffee_variety: CoffeeVariety;
    quantity: number;
    processing_method: ProcessingMethod;
    latitude: number;
    longitude: number;
    altitude?: number;
    soil_type?: string;
    climate_zone?: string;
    farm_section?: string;
}

export interface UpdateCoffeeLotData {
    quantity?: number;
    processing_method?: ProcessingMethod;
    altitude?: number;
    soil_type?: string;
    climate_zone?: string;
}

class CoffeeLotService extends BaseService {
    /**
     * Verifica si hay conexión real intentando un fetch
     */
    private async checkRealConnection(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${COFFEE_LOT_BASE_URL}/health`, {
                method: 'HEAD',
                signal: controller.signal,
                headers: this.getAuthHeaders()
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Obtiene lotes del productor (con soporte offline)
     */
    async getLotsByProducer(
        producerId: number,
        status?: LotStatus,
        harvestYear?: number
    ): Promise<CoffeeLot[]> {
        try {
            const params = new URLSearchParams();
            if (status) params.append("producer_status", status);
            if (harvestYear) params.append("harvest_year", harvestYear.toString());

            const url = `${COFFEE_LOT_BASE_URL}/producer/${producerId}${params.toString() ? `?${params.toString()}` : ""}`;

            const response = await fetch(url, {
                method: "GET",
                headers: this.getAuthHeaders(),
            });

            // Verificar si es respuesta offline del SW
            if (response.status === 503) {
                const data = await response.json();
                if (data.offline) {
                    console.log('[OFFLINE] SW indica offline, cargando desde IndexedDB');
                    return await offlineService.getLotsLocally();
                }
            }

            const lots = await this.handleResponse<CoffeeLot[]>(response);

            // Guardar en IndexedDB para acceso offline
            for (const lot of lots) {
                await offlineService.saveLotLocally(lot);
            }

            return lots;
        } catch (error: any) {
            // Si falla completamente, cargar desde IndexedDB
            console.log('[OFFLINE] Error de red, cargando lotes desde IndexedDB');
            return await offlineService.getLotsLocally();
        }
    }

    /**
     * Obtiene un lote por ID (con soporte offline)
     */
    async getLotById(lotId: number): Promise<CoffeeLot> {
        try {
            const response = await fetch(`${COFFEE_LOT_BASE_URL}/${lotId}`, {
                method: "GET",
                headers: this.getAuthHeaders(),
            });

            // Verificar si es respuesta offline del SW
            if (response.status === 503) {
                const data = await response.json();
                if (data.offline) {
                    console.log('[OFFLINE] SW indica offline, cargando desde IndexedDB');
                    const lot = await offlineService.getLotByIdLocally(lotId);
                    if (!lot) throw new Error('Lote no encontrado en almacenamiento local');
                    return lot;
                }
            }

            const lot = await this.handleResponse<CoffeeLot>(response);
            await offlineService.saveLotLocally(lot);
            return lot;
        } catch (error: any) {
            console.log('[OFFLINE] Error de red, cargando lote desde IndexedDB');
            const lot = await offlineService.getLotByIdLocally(lotId);
            if (!lot) throw new Error('Lote no encontrado en almacenamiento local');
            return lot;
        }
    }

    /**
     * Registra un nuevo lote (con soporte offline)
     */
    async registerLot(data: RegisterCoffeeLotData): Promise<CoffeeLot> {
        try {
            // Intentar crear en el servidor
            const response = await fetch(COFFEE_LOT_BASE_URL, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data),
            });

            // Si la respuesta es 503 (offline), manejar como offline
            if (response.status === 503) {
                const errorData = await response.json();
                if (errorData.offline) {
                    throw new Error('OFFLINE_MODE');
                }
            }

            const lot = await this.handleResponse<CoffeeLot>(response);
            await offlineService.saveLotLocally(lot);

            toast.success('Lote registrado', {
                description: `Lote ${lot.lot_number} creado exitosamente`
            });

            return lot;
        } catch (error: any) {
            // Si estamos offline, guardar localmente
            if (error.message === 'OFFLINE_MODE' || error.message.includes('Failed to fetch')) {
                console.log('[OFFLINE] Guardando lote localmente');

                // Crear lote temporal
                const tempLot: CoffeeLot = {
                    id: -Date.now(),
                    lot_number: `TEMP-${Date.now()}`,
                    producer_id: data.producer_id,
                    harvest_date: data.harvest_date,
                    coffee_variety: data.coffee_variety,
                    quantity: data.quantity,
                    status: LotStatus.REGISTERED,
                    processing_method: data.processing_method,
                    altitude: data.altitude,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    isLocal: true
                };

                await offlineService.saveLotLocally(tempLot);
                await offlineService.addPendingOperation({
                    type: OperationType.CREATE_LOT,
                    data: data,
                    timestamp: Date.now(),
                    retryCount: 0
                });

                toast.warning('Modo sin conexión', {
                    description: 'El lote se sincronizará cuando recuperes la conexión'
                });

                return tempLot;
            }

            throw error;
        }
    }

    /**
     * Actualiza un lote (con soporte offline)
     */
    async updateLot(lotId: number, data: UpdateCoffeeLotData): Promise<CoffeeLot> {
        try {
            const response = await fetch(`${COFFEE_LOT_BASE_URL}/${lotId}`, {
                method: "PUT",
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data),
            });

            if (response.status === 503) {
                throw new Error('OFFLINE_MODE');
            }

            const lot = await this.handleResponse<CoffeeLot>(response);
            await offlineService.saveLotLocally(lot);

            toast.success('Lote actualizado');
            return lot;
        } catch (error: any) {
            if (error.message === 'OFFLINE_MODE' || error.message.includes('Failed to fetch')) {
                console.log('[OFFLINE] Guardando actualización localmente');

                const currentLot = await offlineService.getLotByIdLocally(lotId);
                if (!currentLot) throw new Error('Lote no encontrado');

                const updatedLot = {
                    ...currentLot,
                    ...data,
                    updated_at: new Date().toISOString(),
                    isLocal: true
                };

                await offlineService.saveLotLocally(updatedLot);
                await offlineService.addPendingOperation({
                    type: OperationType.UPDATE_LOT,
                    data: { lotId, updateData: data },
                    timestamp: Date.now(),
                    retryCount: 0
                });

                toast.warning('Modo sin conexión', {
                    description: 'Los cambios se sincronizarán cuando recuperes la conexión'
                });

                return updatedLot;
            }

            throw error;
        }
    }

    /**
     * Elimina un lote (con soporte offline)
     */
    async deleteLot(lotId: number, deletionReason: string): Promise<void> {
        try {
            const response = await fetch(`${COFFEE_LOT_BASE_URL}/${lotId}?deletion_reason=${encodeURIComponent(deletionReason)}`, {
                method: "DELETE",
                headers: this.getAuthHeaders(),
            });

            if (response.status === 503) {
                throw new Error('OFFLINE_MODE');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || "Error al eliminar el lote");
            }

            await offlineService.deleteLotLocally(lotId);
            toast.success('Lote eliminado');
        } catch (error: any) {
            if (error.message === 'OFFLINE_MODE' || error.message.includes('Failed to fetch')) {
                console.log('[OFFLINE] Guardando eliminación localmente');

                await offlineService.deleteLotLocally(lotId);
                await offlineService.addPendingOperation({
                    type: OperationType.DELETE_LOT,
                    data: { lotId, deletionReason },
                    timestamp: Date.now(),
                    retryCount: 0
                });

                toast.warning('Modo sin conexión', {
                    description: 'La eliminación se sincronizará cuando recuperes la conexión'
                });
            } else {
                throw error;
            }
        }
    }

    async changeStatus(lotId: number, newStatus: LotStatus, changeReason?: string): Promise<CoffeeLot> {
        const response = await fetch(`${COFFEE_LOT_BASE_URL}/${lotId}/status`, {
            method: "PATCH",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                new_status: newStatus,
                change_reason: changeReason
            }),
        });

        const lot = await this.handleResponse<CoffeeLot>(response);
        await offlineService.saveLotLocally(lot);
        return lot;
    }

    async searchLots(filters: {
        variety?: CoffeeVariety;
        processing_method?: ProcessingMethod;
        status?: LotStatus;
        start_date?: string;
        end_date?: string;
    }): Promise<CoffeeLot[]> {
        const params = new URLSearchParams();

        if (filters.variety) params.append("variety", filters.variety);
        if (filters.processing_method) params.append("processing_method", filters.processing_method);
        if (filters.status) params.append("coffee_status", filters.status);
        if (filters.start_date) params.append("start_date", filters.start_date);
        if (filters.end_date) params.append("end_date", filters.end_date);

        const url = `${COFFEE_LOT_BASE_URL}/search/advanced${params.toString() ? `?${params.toString()}` : ""}`;

        const response = await fetch(url, {
            method: "GET",
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<CoffeeLot[]>(response);
    }
}

export const coffeeLotService = new CoffeeLotService();