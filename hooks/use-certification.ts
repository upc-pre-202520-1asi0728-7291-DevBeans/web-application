// hooks/use-certification.ts

import {useEffect, useState} from 'react'
import {
    CertificationRecord,
    certificationService,
    CreateCertificationCommand
} from '@/lib/services/certification.service'
import {ClassificationSession} from '@/lib/services/classification.service'
import {toast} from 'sonner'

interface UseCertificationOptions {
    sessionId?: number
    coffeeLotId?: number
    autoLoad?: boolean
}

export function useCertification(options: UseCertificationOptions = {}) {
    const [certification, setCertification] = useState<CertificationRecord | null>(null)
    const [certifications, setCertifications] = useState<CertificationRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /**
     * Carga certificado de una sesión
     */
    const loadCertificationBySession = async (sessionId: number) => {
        setLoading(true)
        setError(null)
        try {
            const cert = await certificationService.getCertificationBySession(sessionId)
            setCertification(cert)
            return cert
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al cargar certificado'
            setError(message)
            return null
        } finally {
            setLoading(false)
        }
    }

    /**
     * Carga certificados de un lote
     */
    const loadCertificationsByLot = async (coffeeLotId: number) => {
        setLoading(true)
        setError(null)
        try {
            const certs = await certificationService.getCertificationsByLot(coffeeLotId)
            setCertifications(certs)
            return certs
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al cargar certificados'
            setError(message)
            return []
        } finally {
            setLoading(false)
        }
    }

    /**
     * Crea certificado automáticamente después de una clasificación
     */
    const createCertificationFromSession = async (session: ClassificationSession) => {
        setLoading(true)
        setError(null)
        try {
            // Verificar que la sesión esté completa
            if (session.status !== 'COMPLETED') {
                throw new Error('La sesión debe estar completada para generar certificado')
            }

            // Preparar comando
            const command: CreateCertificationCommand = {
                classification_session_id: session.id,
                coffee_lot_id: session.coffee_lot_id,
                quality_score: session.classification_result?.average_quality || 0,
                quality_category: session.classification_result?.predominant_category || 'N/A',
                total_grains_analyzed: session.total_grains_analyzed,
                classification_metadata: {
                    session_id_vo: session.session_id_vo,
                    completed_at: session.completed_at || new Date().toISOString(),
                    processing_time_seconds: session.processing_time_seconds || 0,
                    final_score: session.classification_result?.average_quality || 0,
                    final_category: session.classification_result?.predominant_category || 'N/A',
                },
                make_public: true,
            }

            // Crear certificado
            const cert = await certificationService.createCertification(command)
            setCertification(cert)

            toast.success('Certificado generado', {
                description: `Hash: ${cert.certification_hash.substring(0, 16)}...`
            })

            return cert
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al crear certificado'
            setError(message)
            toast.error('Error al generar certificado', {
                description: message
            })
            return null
        } finally {
            setLoading(false)
        }
    }

    /**
     * Verifica un certificado por hash
     */
    const verifyByHash = async (hash: string) => {
        setLoading(true)
        setError(null)
        try {
            return await certificationService.verifyByHash(hash)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al verificar certificado'
            setError(message)
            return null
        } finally {
            setLoading(false)
        }
    }

    /**
     * Verifica un certificado por token público
     */
    const verifyByToken = async (token: string) => {
        setLoading(true)
        setError(null)
        try {
            return await certificationService.verifyByToken(token)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al verificar certificado'
            setError(message)
            return null
        } finally {
            setLoading(false)
        }
    }

    // Auto-load al montar
    useEffect(() => {
        if (options.autoLoad) {
            if (options.sessionId) {
                loadCertificationBySession(options.sessionId)
            } else if (options.coffeeLotId) {
                loadCertificationsByLot(options.coffeeLotId)
            }
        }
    }, [options.sessionId, options.coffeeLotId, options.autoLoad])

    return {
        certification,
        certifications,
        loading,
        error,
        loadCertificationBySession,
        loadCertificationsByLot,
        createCertificationFromSession,
        verifyByHash,
        verifyByToken,
    }
}