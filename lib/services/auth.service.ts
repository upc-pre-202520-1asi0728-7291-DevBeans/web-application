// lib/services/auth.service.ts
import { BaseService, API_BASE_URL } from './base.service';

// Authentication API base URL
const AUTH_BASE_URL = `${API_BASE_URL}/api/v1/auth`;

// Interface for producer registration data
export interface RegisterProducerData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    document_number: string;
    document_type: string;
    phone_number: string;
    city: string;
    country?: string;
    farm_name: string;
    latitude: number;
    longitude: number;
    altitude?: number;
    region: string;
    hectares: number;
    coffee_varieties?: string[];
    production_capacity?: number;
}

// Interface for cooperative registration data
export interface RegisterCooperativeData {
    email: string;
    password: string;
    cooperative_name: string;
    legal_registration_number: string;
    phone_number: string;
    address: string;
    city: string;
    country?: string;
    legal_representative_name: string;
    legal_representative_email: string;
    processing_capacity?: number;
    certifications?: string[];
}

// Interface for login data
export interface LoginData {
    email: string;
    password: string;
}

// Interface for login response
export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: {
        id: number;
        email: string;
        user_type: "PRODUCER" | "COOPERATIVE";
        status: string;
    };
}

// Interface for user resource
export interface UserResource {
    id: number;
    email: string;
    user_type: "PRODUCER" | "COOPERATIVE";
    status: string;
}

/**
 * * Auth Service for handling authentication-related API calls
 */
class AuthService extends BaseService {
    async registerProducer(data: RegisterProducerData): Promise<UserResource> {
        const response = await fetch(`${AUTH_BASE_URL}/register/producer`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        return this.handleResponse<UserResource>(response);
    }

    async registerCooperative(data: RegisterCooperativeData): Promise<UserResource> {
        const response = await fetch(`${AUTH_BASE_URL}/register/cooperative`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        return this.handleResponse<UserResource>(response);
    }

    async login(data: LoginData): Promise<LoginResponse> {
        const response = await fetch(`${AUTH_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        return this.handleResponse<LoginResponse>(response);
    }

    saveToken(token: string): void {
        if (typeof window !== "undefined") {
            localStorage.setItem("access_token", token);
        }
    }

    saveUser(user: UserResource): void {
        if (typeof window !== "undefined") {
            localStorage.setItem("user", JSON.stringify(user));
        }
    }

    getUser(): UserResource | null {
        if (typeof window !== "undefined") {
            const user = localStorage.getItem("user");
            return user ? JSON.parse(user) : null;
        }
        return null;
    }

    logout(): void {
        if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
        }
    }

    // Verifies if user is authenticated
    isAuthenticated(): boolean {
        return this.getToken() !== null;
    }
}

export const authService = new AuthService();