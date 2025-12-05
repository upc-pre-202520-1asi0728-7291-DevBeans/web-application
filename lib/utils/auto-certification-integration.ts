// lib/utils/auto-certification-integration.ts
// FIXED: Genera certificaciones blockchain automáticamente con manejo robusto de errores

import { ClassificationSession } from '@/lib/services/classification.service'
import { certificationService, CreateCertificationCommand } from '@/lib/services/certification.service'
import { toast } from 'sonner'

/**
 * Genera automáticamente un certificado blockchain después de una clasificación
 * CON REINTENTOS Y VALIDACIÓN ROBUSTA
 */
export async function generateCertificationAfterClassification(
    session: ClassificationSession,
    retryCount: number = 0
): Promise<void> {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 2000 // 2 segundos

    try {
        console.log('[AUTO-CERT] Iniciando certificación para sesión:', session.session_id_vo)

        // ✅ VALIDACIÓN 1: Verificar que la sesión esté completa
        if (session.status !== 'COMPLETED') {
            console.warn('[AUTO-CERT] Sesión no completada, estado:', session.status)
            return
        }

        // ✅ VALIDACIÓN 2: Verificar que haya análisis
        if (!session.analyses || session.analyses.length === 0) {
            console.warn('[AUTO-CERT] No hay análisis en la sesión')
            return
        }

        // ✅ VALIDACIÓN 3: Verificar que no exista certificado previo
        try {
            const existingCert = await certificationService.getCertificationBySession(session.id)
            if (existingCert) {
                console.log('[AUTO-CERT] Certificado ya existe:', existingCert.certification_id)
                return
            }
        } catch (error) {
            // Es normal que lance error si no existe, continuamos
            console.log('[AUTO-CERT] No existe certificado previo, creando uno nuevo...')
        }

        // ✅ CÁLCULO DE MÉTRICAS
        const totalAnalyses = session.analyses.length
        const totalScore = session.analyses.reduce((sum, a) => sum + (a.final_score || 0), 0)
        const averageScore = totalScore / totalAnalyses

        // Determinar categoría predominante
        const categoryCount: Record<string, number> = {}
        session.analyses.forEach(a => {
            const category = a.final_category || 'Unknown'
            categoryCount[category] = (categoryCount[category] || 0) + 1
        })

        const predominantCategory = Object.entries(categoryCount).reduce((a, b) =>
            (a[1] > b[1]) ? a : b, ['Unknown', 0]
        )[0]

        console.log('[AUTO-CERT] Métricas calculadas:', {
            totalAnalyses,
            averageScore,
            predominantCategory
        })

        // ✅ PREPARAR COMANDO DE CERTIFICACIÓN
        const command: CreateCertificationCommand = {
            classification_session_id: session.id,
            coffee_lot_id: session.coffee_lot_id,
            quality_score: averageScore * 100, // Convertir a porcentaje
            quality_category: predominantCategory,
            total_grains_analyzed: totalAnalyses,
            classification_metadata: {
                session_id_vo: session.session_id_vo,
                completed_at: session.completed_at || new Date().toISOString(),
                processing_time_seconds: session.processing_time_seconds || 0,
                final_score: averageScore,
                final_category: predominantCategory,
            },
            make_public: true,
            certification_notes: `Auto-generated certification for session ${session.session_id_vo}`,
        }

        console.log('[AUTO-CERT] Creando certificación con comando:', command)

        // ✅ CREAR CERTIFICACIÓN
        const certification = await certificationService.createCertification(command)

        console.log('[AUTO-CERT] ✅ Certificación creada exitosamente:', {
            id: certification.certification_id,
            hash: certification.certification_hash,
            token: certification.verification_token
        })

        // Notificar al usuario
        toast.success('Certificado blockchain generado', {
            description: `Hash: ${certification.certification_hash.substring(0, 16)}...`,
            duration: 5000,
        })

    } catch (error) {
        console.error('[AUTO-CERT] ❌ Error generando certificación:', error)

        // REINTENTAR SI ES POSIBLE
        if (retryCount < MAX_RETRIES) {
            console.log(`[AUTO-CERT] Reintentando... (${retryCount + 1}/${MAX_RETRIES})`)

            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))

            return generateCertificationAfterClassification(session, retryCount + 1)
        }

        // Si agotamos reintentos, mostrar error pero no bloquear
        toast.error('No se pudo generar el certificado blockchain', {
            description: error instanceof Error ? error.message : 'Error desconocido',
            duration: 8000,
        })
    }
}

/**
 * Hook para integrar en componentes de clasificación
 */
export function useAutoCertification() {
    return {
        generateCertification: generateCertificationAfterClassification,
    }
}

/**
 * Genera certificación con delay (para evitar race conditions)
 */
export async function generateCertificationWithDelay(
    session: ClassificationSession,
    delayMs: number = 1000
): Promise<void> {
    console.log(`[AUTO-CERT] Esperando ${delayMs}ms antes de certificar...`)

    await new Promise(resolve => setTimeout(resolve, delayMs))

    return generateCertificationAfterClassification(session)
}