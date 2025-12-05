// lib/utils/auto-certification-integration.ts

/**
 * Este módulo se encarga de generar automáticamente certificaciones blockchain
 * después de cada clasificación completada
 */

import { ClassificationSession } from '@/lib/services/classification.service'
import { certificationService, CreateCertificationCommand } from '@/lib/services/certification.service'
import { toast } from 'sonner'

/**
 * Genera automáticamente un certificado blockchain después de una clasificación
 */
export async function generateCertificationAfterClassification(
    session: ClassificationSession
): Promise<void> {
    try {
        // Verificar que la sesión esté completa
        if (session.status !== 'COMPLETED') {
            console.log('[AUTO-CERT] Sesión no completada, saltando certificación')
            return
        }

        // Verificar que no exista ya un certificado
        const existingCert = await certificationService.getCertificationBySession(session.id)
        if (existingCert) {
            console.log('[AUTO-CERT] Certificado ya existe para esta sesión')
            return
        }

        // Calcular métricas de calidad
        const totalAnalyses = session.analyses?.length || 0
        if (totalAnalyses === 0) {
            console.log('[AUTO-CERT] No hay análisis, saltando certificación')
            return
        }

        const totalScore = session.analyses.reduce((sum, a) => sum + a.final_score, 0)
        const averageScore = (totalScore / totalAnalyses) * 100

        // Determinar categoría predominante
        const categoryCount: Record<string, number> = {}
        session.analyses.forEach(a => {
            categoryCount[a.final_category] = (categoryCount[a.final_category] || 0) + 1
        })
        const predominantCategory = Object.entries(categoryCount).reduce((a, b) =>
            a[1] > b[1] ? a : b
        )[0]

        // Preparar comando de certificación
        const command: CreateCertificationCommand = {
            classification_session_id: session.id,
            coffee_lot_id: session.coffee_lot_id,
            quality_score: averageScore,
            quality_category: predominantCategory,
            total_grains_analyzed: totalAnalyses,
            classification_metadata: {
                session_id_vo: session.session_id_vo,
                completed_at: session.completed_at || new Date().toISOString(),
                processing_time_seconds: session.processing_time_seconds || 0,
                final_score: averageScore / 100, // Normalizar a 0-1
                final_category: predominantCategory,
            },
            make_public: true,
            certification_notes: `Auto-generated certification for session ${session.session_id_vo}`,
        }

        // Crear certificación
        console.log('[AUTO-CERT] Generando certificación...', command)
        const certification = await certificationService.createCertification(command)

        console.log('[AUTO-CERT] Certificación generada exitosamente:', certification.certification_id)

        // Notificar al usuario
        toast.success('Certificado blockchain generado', {
            description: `Hash: ${certification.certification_hash.substring(0, 16)}...`,
            duration: 5000,
        })

    } catch (error) {
        console.error('[AUTO-CERT] Error generando certificación:', error)

        // No lanzar error para no interrumpir el flujo principal
        toast.error('No se pudo generar el certificado blockchain', {
            description: error instanceof Error ? error.message : 'Error desconocido',
        })
    }
}

/**
 * Hook para integrar en componentes de clasificación
 * Uso: Llamar después de que una clasificación se complete exitosamente
 */
export function useAutoCertification() {
    return {
        generateCertification: generateCertificationAfterClassification,
    }
}

/**
 * Ejemplo de integración en classification.service.ts:
 *
 * async startClassificationSession(...): Promise<ClassificationSession> {
 *     const session = await fetch(...).then(...)
 *
 *     // Generar certificación automáticamente si está completa
 *     if (session.status === 'COMPLETED') {
 *         generateCertificationAfterClassification(session).catch(console.error)
 *     }
 *
 *     return session
 * }
 */