// lib/services/base.service.ts

/**
 * Base API URL
 */
//export const API_BASE_URL = 'https://bean-detect-ai-api-platform.azurewebsites.net';
export const API_BASE_URL = 'http://localhost:8000';

/**
 * Base Service with common methods for API services
 */
export abstract class BaseService {
    protected getToken(): string | null {
        if (typeof window !== "undefined") {
            return localStorage.getItem("access_token");
        }
        return null;
    }

    protected getAuthHeaders(): HeadersInit {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    protected getAuthHeadersNoContentType(): HeadersInit {
        const token = this.getToken();
        return {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    protected async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const error = await response.json().catch(() => ({
                detail: 'An error occurred'
            }));
            throw new Error(error.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }
}