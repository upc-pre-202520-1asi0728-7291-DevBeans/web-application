// lib/services/certification.service.ts

import { BaseService, API_BASE_URL } from './base.service';

export interface CertificationRecord {
    id: number;
    certification_id: string;
    certification_hash: string;
    classification_session_id: number;
    coffee_lot_id: number;
    quality_score: number;
    quality_category: string;
    total_grains_analyzed: number;
    verification_token: string;
    status: 'ACTIVE' | 'VERIFIED' | 'REVOKED';
    is_public: boolean;
    certified_at: string;
    expires_at: string | null;
    certification_notes: string | null;
}

export interface CreateCertificationCommand {
    classification_session_id: number;
    coffee_lot_id: number;
    quality_score: number;
    quality_category: string;
    total_grains_analyzed: number;
    classification_metadata: {
        session_id_vo: string;
        completed_at: string;
        processing_time_seconds: number;
        final_score: number;
        final_category: string;
    };
    make_public?: boolean;
    certification_notes?: string;
    expires_in_days?: number;
}

export interface VerificationResponse {
    verified: boolean;
    certification_id?: string;
    certification_hash?: string;
    quality_score?: number;
    quality_category?: string;
    certified_at?: string;
    status?: string;
    message?: string;
    hash_integrity_check?: boolean;
}

export interface PublicVerificationResponse {
    certification_id: string;
    certification_hash: string;
    quality_score: number;
    quality_category: string;
    total_grains_analyzed: number;
    certified_at: string;
    status: string;
    is_valid: boolean;
}

class CertificationService extends BaseService {
    private readonly CERT_BASE_URL = `${API_BASE_URL}/api/v1/certifications`;

    /**
     * Crea un certificado de trazabilidad inmutable
     */
    async createCertification(command: CreateCertificationCommand): Promise<CertificationRecord> {
        const response = await fetch(this.CERT_BASE_URL, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(command),
        });

        return this.handleResponse<CertificationRecord>(response);
    }

    /**
     * Verifica un certificado por su hash
     */
    async verifyByHash(certificationHash: string): Promise<VerificationResponse> {
        const response = await fetch(`${this.CERT_BASE_URL}/verify/hash/${certificationHash}`, {
            method: 'GET',
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<VerificationResponse>(response);
    }

    /**
     * Verifica un certificado por su token público (para QR)
     */
    async verifyByToken(verificationToken: string): Promise<PublicVerificationResponse> {
        const response = await fetch(`${this.CERT_BASE_URL}/verify/token/${verificationToken}`, {
            method: 'GET',
            // No headers - endpoint público
        });

        return this.handleResponse<PublicVerificationResponse>(response);
    }

    /**
     * Obtiene un certificado por su ID
     */
    async getCertificationById(certificationId: string): Promise<CertificationRecord> {
        const response = await fetch(`${this.CERT_BASE_URL}/${certificationId}`, {
            method: 'GET',
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<CertificationRecord>(response);
    }

    /**
     * Obtiene certificados de un lote
     */
    async getCertificationsByLot(coffeeLotId: number): Promise<CertificationRecord[]> {
        const response = await fetch(`${this.CERT_BASE_URL}/lot/${coffeeLotId}`, {
            method: 'GET',
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<CertificationRecord[]>(response);
    }

    /**
     * Obtiene el certificado de una sesión de clasificación
     */
    async getCertificationBySession(sessionId: number): Promise<CertificationRecord | null> {
        try {
            // Primero obtenemos la sesión para saber el coffee_lot_id
            const sessionResponse = await fetch(
                `${API_BASE_URL}/api/v1/classification/session/${sessionId}`,
                {
                    headers: this.getAuthHeaders(),
                }
            );
            const session = await this.handleResponse<any>(sessionResponse);

            // Luego buscamos certificados del lote
            const certifications = await this.getCertificationsByLot(session.coffee_lot_id);

            // Filtramos por session_id
            return certifications.find(cert => cert.classification_session_id === sessionId) || null;
        } catch (error) {
            console.error('Error getting certification by session:', error);
            return null;
        }
    }

    /**
     * Revoca un certificado
     */
    async revokeCertification(certificationId: string, reason: string): Promise<CertificationRecord> {
        const response = await fetch(`${this.CERT_BASE_URL}/${certificationId}/revoke`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ reason }),
        });

        return this.handleResponse<CertificationRecord>(response);
    }

    /**
     * Obtiene todos los certificados públicos
     */
    async getAllPublicCertifications(): Promise<CertificationRecord[]> {
        const response = await fetch(this.CERT_BASE_URL, {
            method: 'GET',
            // No headers - endpoint público
        });

        return this.handleResponse<CertificationRecord[]>(response);
    }

    /**
     * Genera URL de blockchain explorer (simulado por ahora)
     * TODO: Integrar con blockchain real cuando esté disponible
     */
    getBlockchainExplorerUrl(certificationHash: string): string {
        // Por ahora redirige a la verificación pública
        // Cuando tengas blockchain real, cambiar esta URL
        return `${window.location.origin}/verify/${certificationHash}`;
    }

    /**
     * Genera datos para QR con información de trazabilidad
     */
    generateTraceabilityQRData(certification: CertificationRecord): string {
        const qrData = {
            type: 'BeanDetect_Certification',
            certification_id: certification.certification_id,
            certification_hash: certification.certification_hash,
            verification_token: certification.verification_token,
            coffee_lot_id: certification.coffee_lot_id,
            quality_score: certification.quality_score,
            quality_category: certification.quality_category,
            total_grains: certification.total_grains_analyzed,
            certified_at: certification.certified_at,
            status: certification.status,
            verify_url: `${window.location.origin}/verify/${certification.verification_token}`,
            blockchain_url: this.getBlockchainExplorerUrl(certification.certification_hash)
        };

        return JSON.stringify(qrData, null, 2);
    }

    /**
     * Genera URL de imagen QR con datos de trazabilidad
     */
    generateTraceabilityQRImageURL(certification: CertificationRecord, size: number = 400): string {
        const qrData = this.generateTraceabilityQRData(certification);
        const encoded = encodeURIComponent(qrData);
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
    }
}

export const certificationService = new CertificationService();