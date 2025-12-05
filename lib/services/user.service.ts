// lib/services/user.service.ts

import { BaseService, API_BASE_URL } from './base.service';


/**
 * Base profile interface con propiedades comunes
 */
export interface BaseProfile {
    phone_number: string
    city: string
    country?: string
}


/**
 * Producer Profile
 */
export interface ProducerProfile extends BaseProfile {
    user_id: number
    first_name: string
    last_name: string
    document_number: string
    document_type: string
    alternative_phone?: string
    address?: string
    farm_name: string
    latitude: number
    longitude: number
    altitude?: number
    region: string
    hectares: number
    coffee_varieties?: string[]
    production_capacity?: number
    email?: string // Agregado para el frontend
}


/**
 * Cooperative Profile
 */
export interface CooperativeProfile extends BaseProfile {
    user_id: number
    cooperative_name: string
    legal_registration_number: string
    alternative_phone?: string
    address: string
    legal_representative_name: string
    legal_representative_email: string
    processing_capacity?: number
    certifications?: string[]
    associated_producers?: number[]
}


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


/**
 * User Service for handling user profiles and related operations
 */
class UserService extends BaseService {
    /**
     * Get user profile (Producer or Cooperative)
     */
    async getProfile(userId: number): Promise<ProducerProfile | CooperativeProfile> {
        const response = await fetch(`${API_BASE_URL}/api/v1/profiles/${userId}`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<ProducerProfile | CooperativeProfile>(response);
    }

    /**
     * Obtener todos los productores (para cooperativas)
     */
    async getAllProducers(): Promise<ProducerProfile[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/users/producers`, {
                headers: this.getAuthHeaders()
            })

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Error al cargar productores' }))
                throw new Error(error.detail)
            }

            const producers = await response.json()

            // Enriquecer con email del usuario si es necesario
            return producers.map((producer: any) => ({
                ...producer,
                email: producer.email || `producer${producer.user_id}@example.com` // Fallback
            }))
        } catch (error) {
            console.error('Error getting all producers:', error)
            throw error
        }
    }


    /**
     * Updates user profile information
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
     * Changes user password
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