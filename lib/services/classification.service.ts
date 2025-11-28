// lib/services/classification.service.ts (CON SOPORTE OFFLINE)

import { BaseService, API_BASE_URL } from './base.service';
import { offlineService } from './offline.service';

// Interface for individual grain analysis data
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

// Interface for classification session data
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

// Interface for average quality metrics
export interface AverageQuality {
    coffee_lot_id: number;
    average_quality_percentage: number;
    total_grains_analyzed: number;
    quality_scale: string;
}

/**
 * Classification Service for handling classification-related API calls
 */
class ClassificationService extends BaseService {
    /**
     * Start a new classification session
     */
    async startClassificationSession(
        coffeeLotId: number,
        imageFile: File,
        options?: {
            userEmail?: string;
            sendEmailNotification?: boolean;
        }
    ): Promise<ClassificationSession> {
        const formData = new FormData();
        formData.append('coffee_lot_id', coffeeLotId.toString());
        formData.append('image', imageFile);

        if (options?.userEmail) {
            formData.append('user_email', options.userEmail);
        }

        if (options?.sendEmailNotification) {
            formData.append('send_email_notification', 'true');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/classification/session`, {
            method: 'POST',
            headers: this.getAuthHeadersNoContentType(),
            body: formData,
        });

        const session = await this.handleResponse<ClassificationSession>(response);

        // Guardar en IndexedDB
        await offlineService.saveSessionLocally(session);

        return session;
    }

    /**
     * Send a classification report via email
     */
    async sendReportByEmail(sessionId: number, recipientEmail: string): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${API_BASE_URL}/api/v1/classification/send-report`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                session_id: sessionId,
                recipient_email: recipientEmail,
            }),
        });

        return this.handleResponse<{ success: boolean; message: string }>(response);
    }

    /**
     * Fetch classification sessions by coffee lot ID (con soporte offline)
     */
    async getSessionsByCoffeeLot(coffeeLotId: number): Promise<ClassificationSession[]> {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/classification/sessions/coffee-lot/${coffeeLotId}`,
                {
                    headers: this.getAuthHeaders(),
                }
            );

            // Verificar si es respuesta offline del SW
            if (response.status === 503) {
                const data = await response.json();
                if (data.offline) {
                    console.log('[OFFLINE] SW indica offline, cargando sesiones desde IndexedDB');
                    return await offlineService.getSessionsByCoffeeLotLocally(coffeeLotId);
                }
            }

            const sessions = await this.handleResponse<ClassificationSession[]>(response);

            // Guardar en IndexedDB
            for (const session of sessions) {
                await offlineService.saveSessionLocally(session);
            }

            return sessions;
        } catch (error) {
            console.log('[OFFLINE] Error de red, cargando sesiones desde IndexedDB');
            return await offlineService.getSessionsByCoffeeLotLocally(coffeeLotId);
        }
    }

    /**
     * Fetch a classification session by its ID (con soporte offline)
     */
    async getSessionById(sessionId: number): Promise<ClassificationSession> {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/classification/session/${sessionId}`,
                {
                    headers: this.getAuthHeaders(),
                }
            );

            // Verificar si es respuesta offline del SW
            if (response.status === 503) {
                const data = await response.json();
                if (data.offline) {
                    console.log('[OFFLINE] SW indica offline, buscando en IndexedDB');
                    const sessions = await offlineService.getSessionsLocally();
                    const session = sessions.find(s => s.id === sessionId);
                    if (!session) return Promise.reject(new Error('Sesión no encontrada en almacenamiento local'));
                    return session;
                }
            }

            const session = await this.handleResponse<ClassificationSession>(response);

            // Guardar en IndexedDB
            await offlineService.saveSessionLocally(session);

            return session;
        } catch (error) {
            console.log('[OFFLINE] Error de red, buscando sesión en IndexedDB');
            const sessions = await offlineService.getSessionsLocally();
            const session = sessions.find(s => s.id === sessionId);
            if (!session) throw new Error('Sesión no encontrada en almacenamiento local');
            return session;
        }
    }

    /**
     * Fetch average quality metrics for a coffee lot
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
     * Fetch all classification sessions (con soporte offline)
     */
    async getAllSessions(): Promise<ClassificationSession[]> {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/classification/sessions`,
                {
                    headers: this.getAuthHeaders(),
                }
            );

            // Verificar si es respuesta offline del SW
            if (response.status === 503) {
                const data = await response.json();
                if (data.offline) {
                    console.log('[OFFLINE] SW indica offline, cargando todas las sesiones desde IndexedDB');
                    return await offlineService.getSessionsLocally();
                }
            }

            const sessions = await this.handleResponse<ClassificationSession[]>(response);

            // Guardar en IndexedDB
            for (const session of sessions) {
                await offlineService.saveSessionLocally(session);
            }

            return sessions;
        } catch (error) {
            console.log('[OFFLINE] Error de red, cargando todas las sesiones desde IndexedDB');
            return await offlineService.getSessionsLocally();
        }
    }
}

export const classificationService = new ClassificationService();