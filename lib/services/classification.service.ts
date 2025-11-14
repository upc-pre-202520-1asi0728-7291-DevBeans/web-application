// lib/services/classification.service.ts

const API_BASE_URL = 'https://bean-detect-ai-api-platform.azurewebsites.net';
//const API_BASE_URL = 'http://localhost:8000';

// ============================================
// INTERFACES - Clasificación
// ============================================

export interface GrainAnalysis {
    id: number;
    session_id: number;
    image_url: string | null;
    color_percentages: Record<string, number>;
    features: Record<string, any>;
    quality_assessment: Record<string, any>;
    final_score: number;
    final_category: string;
    created_at: string;
}

export interface ClassificationSession {
    id: number;
    session_id_vo: string;
    coffee_lot_id: number;
    user_id: number;
    status: string;
    total_grains_analyzed: number;
    processing_time_seconds: number | null;
    classification_result: Record<string, any>;
    created_at: string;
    completed_at: string | null;
    analyses: GrainAnalysis[];
}

export interface AverageQuality {
    coffee_lot_id: number;
    average_quality_percentage: number;
    total_grains_analyzed: number;
    quality_scale: string;
}

// ============================================
// SERVICIO DE CLASIFICACIÓN
// ============================================

class ClassificationService {
    private getAuthHeaders(): HeadersInit {
        const token = this.getToken();
        return {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    private getToken(): string | null {
        if (typeof window !== "undefined") {
            return localStorage.getItem("access_token");
        }
        return null;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const error = await response.json().catch(() => ({
                detail: 'An error occurred'
            }));
            throw new Error(error.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Inicia una sesión de clasificación con una imagen
     */
    async startClassificationSession(coffeeLotId: number, imageFile: File): Promise<ClassificationSession> {
        const formData = new FormData();
        formData.append('coffee_lot_id', coffeeLotId.toString());
        formData.append('image', imageFile);

        const response = await fetch(`${API_BASE_URL}/api/v1/classification/session`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: formData,
        });

        return this.handleResponse<ClassificationSession>(response);
    }

    /**
     * Obtiene todas las sesiones de clasificación de un lote
     */
    async getSessionsByCoffeeLot(coffeeLotId: number): Promise<ClassificationSession[]> {
        const response = await fetch(
            `${API_BASE_URL}/api/v1/classification/sessions/coffee-lot/${coffeeLotId}`,
            {
                headers: this.getAuthHeaders(),
            }
        );

        return this.handleResponse<ClassificationSession[]>(response);
    }

    /**
     * Obtiene una sesión específica con todos sus análisis
     */
    async getSessionById(sessionId: number): Promise<ClassificationSession> {
        const response = await fetch(
            `${API_BASE_URL}/api/v1/classification/session/${sessionId}`,
            {
                headers: this.getAuthHeaders(),
            }
        );

        return this.handleResponse<ClassificationSession>(response);
    }

    /**
     * Obtiene la calidad promedio de un lote
     */
    async getAverageQualityByLot(coffeeLotId: number): Promise<AverageQuality> {
        const response = await fetch(
            `${API_BASE_URL}/api/v1/classification/average-quality/coffee-lot/${coffeeLotId}`,
            {
                headers: this.getAuthHeaders(),
            }
        );

        return this.handleResponse<AverageQuality>(response);
    }

    /**
     * Obtiene todas las sesiones de clasificación
     */
    async getAllSessions(): Promise<ClassificationSession[]> {
        const response = await fetch(
            `${API_BASE_URL}/api/v1/classification/sessions`,
            {
                headers: this.getAuthHeaders(),
            }
        );

        return this.handleResponse<ClassificationSession[]>(response);
    }
}

export const classificationService = new ClassificationService();