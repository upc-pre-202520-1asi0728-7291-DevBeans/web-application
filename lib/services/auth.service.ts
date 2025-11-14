// lib/services/auth.service.ts

//const BASE_URL = "https://bean-detect-ai-api-platform.azurewebsites.net/api/v1/auth";
const BASE_URL = 'http://localhost:8000/api/v1/auth';

// Atributos para el registro de productor
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

// Atributos para el registro de cooperativa
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

// Atributos para login
export interface LoginData {
    email: string;
    password: string;
}

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

export interface UserResource {
    id: number;
    email: string;
    user_type: "PRODUCER" | "COOPERATIVE";
    status: string;
}

// Servicio de autenticación
class AuthService {
    // Registrar productor
    async registerProducer(data: RegisterProducerData): Promise<UserResource> {
        const response = await fetch(`${BASE_URL}/register/producer`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al registrar productor");
        }

        return response.json();
    }

    // Registrar cooperativa
    async registerCooperative(data: RegisterCooperativeData): Promise<UserResource> {
        const response = await fetch(`${BASE_URL}/register/cooperative`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al registrar cooperativa");
        }

        return response.json();
    }

    // Iniciar sesión
    async login(data: LoginData): Promise<LoginResponse> {
        const response = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al iniciar sesión");
        }

        return response.json();
    }

    // Guardar token en localStorage
    saveToken(token: string): void {
        if (typeof window !== "undefined") {
            localStorage.setItem("access_token", token);
        }
    }

    // Obtener token
    getToken(): string | null {
        if (typeof window !== "undefined") {
            return localStorage.getItem("access_token");
        }
        return null;
    }

    // Guardar información del usuario
    saveUser(user: UserResource): void {
        if (typeof window !== "undefined") {
            localStorage.setItem("user", JSON.stringify(user));
        }
    }

    // Obtener información del usuario
    getUser(): UserResource | null {
        if (typeof window !== "undefined") {
            const user = localStorage.getItem("user");
            return user ? JSON.parse(user) : null;
        }
        return null;
    }

    // Cerrar sesión
    logout(): void {
        if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
        }
    }

    // Verificar si está autenticado
    isAuthenticated(): boolean {
        return this.getToken() !== null;
    }
}

export const authService = new AuthService();