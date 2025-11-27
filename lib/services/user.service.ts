// lib/services/user.service.ts

import { BaseService, API_BASE_URL } from './base.service';


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
    async getProfile(userId: number): Promise<ProducerProfile | CooperativeProfile> {
        const response = await fetch(`${API_BASE_URL}/api/v1/profiles/${userId}`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<ProducerProfile | CooperativeProfile>(response);
    }

    async getProducerProfile(userId: number): Promise<ProducerProfile> {
        const response = await fetch(`${API_BASE_URL}/api/v1/profiles/producer/${userId}`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<ProducerProfile>(response);
    }

    async getCooperativeProfile(userId: number): Promise<CooperativeProfile> {
        const response = await fetch(`${API_BASE_URL}/api/v1/profiles/cooperative/${userId}`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<CooperativeProfile>(response);
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