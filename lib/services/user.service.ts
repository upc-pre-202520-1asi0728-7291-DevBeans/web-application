// lib/services/user.service.ts

const API_BASE_URL = "https://bean-detect-ai-api-platform.azurewebsites.net";
//const API_BASE_URL = 'http://localhost:8000';

// ============================================
// INTERFACES - Perfiles
// ============================================

export interface ProducerProfile {
    id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    document_number: string;
    document_type: string;
    phone_number: string;
    city: string;
    country: string;
    farm_name: string;
    latitude: number;
    longitude: number;
    altitude: number | null;
    region: string;
    hectares: number;
    coffee_varieties: string[] | null;
    production_capacity: number | null;
}

export interface CooperativeProfile {
    id: number;
    user_id: number;
    cooperative_name: string;
    legal_registration_number: string;
    phone_number: string;
    address: string;
    city: string;
    country: string;
    legal_representative_name: string;
    legal_representative_email: string;
    processing_capacity: number | null;
    certifications: string[] | null;
}

// ============================================
// INTERFACES - Actualización
// ============================================

export interface UpdateProfileData {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    city?: string;
    farm_name?: string;
    hectares?: number;
    production_capacity?: number;
}

export interface ChangePasswordData {
    current_password: string;
    new_password: string;
}

export interface UserResource {
    id: number;
    email: string;
    user_type: "PRODUCER" | "COOPERATIVE";
    status: string;
    created_at: string;
}

// ============================================
// SERVICIO DE USUARIO
// ============================================

class UserService {
    // ========================================
    // Métodos auxiliares
    // ========================================

    private getAuthHeaders(): HeadersInit {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
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

    // ========================================
    // Gestión de Perfiles
    // ========================================

    /**
     * Obtiene el perfil completo de un usuario (productor o cooperativa)
     * El backend determina automáticamente el tipo de perfil
     */
    async getProfile(userId: number): Promise<ProducerProfile | CooperativeProfile> {
        const response = await fetch(`${API_BASE_URL}/api/v1/profiles/${userId}`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<ProducerProfile | CooperativeProfile>(response);
    }

    /**
     * Obtiene específicamente el perfil de un productor
     */
    async getProducerProfile(userId: number): Promise<ProducerProfile> {
        const response = await fetch(`${API_BASE_URL}/api/v1/profiles/producer/${userId}`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<ProducerProfile>(response);
    }

    /**
     * Obtiene específicamente el perfil de una cooperativa
     */
    async getCooperativeProfile(userId: number): Promise<CooperativeProfile> {
        const response = await fetch(`${API_BASE_URL}/api/v1/profiles/cooperative/${userId}`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<CooperativeProfile>(response);
    }

    // ========================================
    // Actualización de Usuario
    // ========================================

    /**
     * Actualiza el perfil de un usuario
     * Solo se actualizan los campos que se envían
     */
    async updateProfile(userId: number, data: UpdateProfileData): Promise<UserResource> {
        const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/profile`, {
            method: "PUT",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return this.handleResponse<UserResource>(response);
    }

    /**
     * Cambia la contraseña del usuario
     * Requiere la contraseña actual para validación
     */
    async changePassword(userId: number, data: ChangePasswordData): Promise<UserResource> {
        const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/password`, {
            method: "PUT",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return this.handleResponse<UserResource>(response);
    }
}

export const userService = new UserService();