// lib/services/coffee-lot.service.ts (ACTUALIZADO con soporte offline)

import { BaseService, API_BASE_URL } from './base.service';
import { offlineService, OperationType } from './offline.service';
import { syncService } from './sync.service';

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
    // Flag para indicar si es un lote local (no sincronizado)
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
     * Obtiene lotes del productor (con soporte offline)
     */
    async getLotsByProducer(
        producerId: number,
        status?: LotStatus,
        harvestYear?: number
    ): Promise<CoffeeLot[]> {
        // Si estamos offline, retornar datos locales
        if (!syncService.isOnline()) {
            console.log('[OFFLINE] Cargando lotes desde IndexedDB');
            return await offlineService.getLotsLocally();
        }

        try {
            const params = new URLSearchParams();
            if (status) params.append("producer_status", status);
            if (harvestYear) params.append("harvest_year", harvestYear.toString());

            const url = `${COFFEE_LOT_BASE_URL}/producer/${producerId}${params.toString() ? `?${params.toString()}` : ""}`;

            const response = await fetch(url, {
                method: "GET",
                headers: this.getAuthHeaders(),
            });

            const lots = await this.handleResponse<CoffeeLot[]>(response);

            // Guardar en IndexedDB para acceso offline
            for (const lot of lots) {
                await offlineService.saveLotLocally(lot);
            }

            return lots;
        } catch (error) {
            // Si falla, intentar cargar desde IndexedDB
            console.log('[OFFLINE] Error al cargar desde servidor, usando datos locales');
            return await offlineService.getLotsLocally();
        }
    }

    /**
     * Obtiene un lote por ID (con soporte offline)
     */
    async getLotById(lotId: number): Promise<CoffeeLot> {
        // Si estamos offline, retornar datos locales
        if (!syncService.isOnline()) {
            console.log('[OFFLINE] Cargando lote desde IndexedDB');
            const lot = await offlineService.getLotByIdLocally(lotId);
            if (!lot) throw new Error('Lote no encontrado en almacenamiento local');
            return lot;
        }

        try {
            const response = await fetch(`${COFFEE_LOT_BASE_URL}/${lotId}`, {
                method: "GET",
                headers: this.getAuthHeaders(),
            });

            const lot = await this.handleResponse<CoffeeLot>(response);

            // Guardar en IndexedDB
            await offlineService.saveLotLocally(lot);

            return lot;
        } catch (error) {
            // Si falla, intentar cargar desde IndexedDB
            console.log('[OFFLINE] Error al cargar desde servidor, usando datos locales');
            const lot = await offlineService.getLotByIdLocally(lotId);
            if (!lot) throw error;
            return lot;
        }
    }

    /**
     * Registra un nuevo lote (con soporte offline)
     */
    async registerLot(data: RegisterCoffeeLotData): Promise<CoffeeLot> {
        // Si estamos offline, guardar como operación pendiente
        if (!syncService.isOnline()) {
            console.log('[OFFLINE] Guardando lote para sincronización posterior');

            // Crear un lote temporal con ID negativo (para identificarlo como local)
            const tempLot: CoffeeLot = {
                id: -Date.now(), // ID temporal negativo
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

            // Guardar localmente
            await offlineService.saveLotLocally(tempLot);

            // Agregar a cola de operaciones pendientes
            await offlineService.addPendingOperation({
                type: OperationType.CREATE_LOT,
                data: data,
                timestamp: Date.now(),
                retryCount: 0
            });

            return tempLot;
        }

        // Si estamos online, crear normalmente
        const response = await fetch(COFFEE_LOT_BASE_URL, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });

        const lot = await this.handleResponse<CoffeeLot>(response);

        // Guardar en IndexedDB
        await offlineService.saveLotLocally(lot);

        return lot;
    }

    /**
     * Actualiza un lote (con soporte offline)
     */
    async updateLot(lotId: number, data: UpdateCoffeeLotData): Promise<CoffeeLot> {
        // Si estamos offline, guardar como operación pendiente
        if (!syncService.isOnline()) {
            console.log('[OFFLINE] Guardando actualización para sincronización posterior');

            // Obtener lote actual
            const currentLot = await offlineService.getLotByIdLocally(lotId);
            if (!currentLot) throw new Error('Lote no encontrado');

            // Actualizar localmente
            const updatedLot = {
                ...currentLot,
                ...data,
                updated_at: new Date().toISOString(),
                isLocal: true
            };

            await offlineService.saveLotLocally(updatedLot);

            // Agregar a cola de operaciones pendientes
            await offlineService.addPendingOperation({
                type: OperationType.UPDATE_LOT,
                data: { lotId, updateData: data },
                timestamp: Date.now(),
                retryCount: 0
            });

            return updatedLot;
        }

        // Si estamos online, actualizar normalmente
        const response = await fetch(`${COFFEE_LOT_BASE_URL}/${lotId}`, {
            method: "PUT",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });

        const lot = await this.handleResponse<CoffeeLot>(response);

        // Guardar en IndexedDB
        await offlineService.saveLotLocally(lot);

        return lot;
    }

    /**
     * Elimina un lote (con soporte offline)
     */
    async deleteLot(lotId: number, deletionReason: string): Promise<void> {
        // Si estamos offline, guardar como operación pendiente
        if (!syncService.isOnline()) {
            console.log('[OFFLINE] Guardando eliminación para sincronización posterior');

            // Marcar como eliminado localmente
            await offlineService.deleteLotLocally(lotId);

            // Agregar a cola de operaciones pendientes
            await offlineService.addPendingOperation({
                type: OperationType.DELETE_LOT,
                data: { lotId, deletionReason },
                timestamp: Date.now(),
                retryCount: 0
            });

            return;
        }

        // Si estamos online, eliminar normalmente
        const response = await fetch(`${COFFEE_LOT_BASE_URL}/${lotId}?deletion_reason=${encodeURIComponent(deletionReason)}`, {
            method: "DELETE",
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al eliminar el lote");
        }

        // Eliminar de IndexedDB
        await offlineService.deleteLotLocally(lotId);
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

        // Guardar en IndexedDB
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