// lib/services/coffee-lot.service.ts

//const API_BASE_URL = "https://bean-detect-ai-api-platform.azurewebsites.net/api/v1/coffee-lots";
const API_BASE_URL = "http://localhost:8000/api/v1/coffee-lots";

// Enums
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

// Tipos
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

// Servicio
class CoffeeLotService {
    private getAuthHeader(): HeadersInit {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        return {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
        };
    }

    // Obtener todos los lotes de un productor
    async getLotsByProducer(
        producerId: number,
        status?: LotStatus,
        harvestYear?: number
    ): Promise<CoffeeLot[]> {
        const params = new URLSearchParams();
        if (status) params.append("producer_status", status);
        if (harvestYear) params.append("harvest_year", harvestYear.toString());

        const url = `${API_BASE_URL}/producer/${producerId}${params.toString() ? `?${params.toString()}` : ""}`;

        const response = await fetch(url, {
            method: "GET",
            headers: this.getAuthHeader(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al obtener los lotes");
        }

        return response.json();
    }

    // Obtener un lote específico
    async getLotById(lotId: number): Promise<CoffeeLot> {
        const response = await fetch(`${API_BASE_URL}/${lotId}`, {
            method: "GET",
            headers: this.getAuthHeader(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al obtener el lote");
        }

        return response.json();
    }

    // Registrar nuevo lote
    async registerLot(data: RegisterCoffeeLotData): Promise<CoffeeLot> {
        const response = await fetch(API_BASE_URL, {
            method: "POST",
            headers: this.getAuthHeader(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al registrar el lote");
        }

        return response.json();
    }

    // Actualizar lote
    async updateLot(lotId: number, data: UpdateCoffeeLotData): Promise<CoffeeLot> {
        const response = await fetch(`${API_BASE_URL}/${lotId}`, {
            method: "PUT",
            headers: this.getAuthHeader(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al actualizar el lote");
        }

        return response.json();
    }

    // Eliminar lote
    async deleteLot(lotId: number, deletionReason: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/${lotId}?deletion_reason=${encodeURIComponent(deletionReason)}`, {
            method: "DELETE",
            headers: this.getAuthHeader(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al eliminar el lote");
        }
    }

    // Cambiar estado del lote
    async changeStatus(lotId: number, newStatus: LotStatus, changeReason?: string): Promise<CoffeeLot> {
        const response = await fetch(`${API_BASE_URL}/${lotId}/status`, {
            method: "PATCH",
            headers: this.getAuthHeader(),
            body: JSON.stringify({
                new_status: newStatus,
                change_reason: changeReason
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al cambiar el estado");
        }

        return response.json();
    }

    // Búsqueda avanzada de lotes
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

        const url = `${API_BASE_URL}/search/advanced${params.toString() ? `?${params.toString()}` : ""}`;

        const response = await fetch(url, {
            method: "GET",
            headers: this.getAuthHeader(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error en la búsqueda");
        }

        return response.json();
    }
}

export const coffeeLotService = new CoffeeLotService();