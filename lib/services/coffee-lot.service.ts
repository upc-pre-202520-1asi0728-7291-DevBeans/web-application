// lib/services/coffee-lot.service.ts

import { BaseService, API_BASE_URL } from './base.service';

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

/**
 * Coffee Lot Service for handling coffee lot-related API calls
 */
class CoffeeLotService extends BaseService {
    async getLotsByProducer(
        producerId: number,
        status?: LotStatus,
        harvestYear?: number
    ): Promise<CoffeeLot[]> {
        const params = new URLSearchParams();
        if (status) params.append("producer_status", status);
        if (harvestYear) params.append("harvest_year", harvestYear.toString());

        const url = `${COFFEE_LOT_BASE_URL}/producer/${producerId}${params.toString() ? `?${params.toString()}` : ""}`;

        const response = await fetch(url, {
            method: "GET",
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<CoffeeLot[]>(response);
    }

    async getLotById(lotId: number): Promise<CoffeeLot> {
        const response = await fetch(`${COFFEE_LOT_BASE_URL}/${lotId}`, {
            method: "GET",
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<CoffeeLot>(response);
    }

    async registerLot(data: RegisterCoffeeLotData): Promise<CoffeeLot> {
        const response = await fetch(COFFEE_LOT_BASE_URL, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });

        return this.handleResponse<CoffeeLot>(response);
    }

    async updateLot(lotId: number, data: UpdateCoffeeLotData): Promise<CoffeeLot> {
        const response = await fetch(`${COFFEE_LOT_BASE_URL}/${lotId}`, {
            method: "PUT",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });

        return this.handleResponse<CoffeeLot>(response);
    }

    async deleteLot(lotId: number, deletionReason: string): Promise<void> {
        const response = await fetch(`${COFFEE_LOT_BASE_URL}/${lotId}?deletion_reason=${encodeURIComponent(deletionReason)}`, {
            method: "DELETE",
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al eliminar el lote");
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

        return this.handleResponse<CoffeeLot>(response);
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