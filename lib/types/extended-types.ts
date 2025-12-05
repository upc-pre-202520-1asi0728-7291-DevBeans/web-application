// lib/types/extended-types.ts
// Tipos extendidos para manejar propiedades adicionales del backend

import { GrainAnalysis as BaseGrainAnalysis } from '@/lib/services/classification.service'

/**
 * GrainAnalysis extendido con propiedades opcionales del backend
 */
export interface ExtendedGrainAnalysis extends BaseGrainAnalysis {
    is_dark_grain?: boolean
    is_green_grain?: boolean
}

/**
 * Type guard para verificar si un análisis tiene defectos
 */
export function hasDefectInfo(analysis: BaseGrainAnalysis): boolean {
    const extended = analysis as any
    return (
        extended.is_dark_grain !== undefined ||
        extended.is_green_grain !== undefined ||
        analysis.quality_assessment?.is_dark_grain !== undefined ||
        analysis.quality_assessment?.is_green_grain !== undefined
    )
}

/**
 * Obtener información de defectos de un análisis
 */
export function getDefectInfo(analysis: BaseGrainAnalysis): {
    isDarkGrain: boolean
    isGreenGrain: boolean
} {
    const extended = analysis as any

    return {
        isDarkGrain:
            extended.is_dark_grain ||
            analysis.quality_assessment?.is_dark_grain ||
            false,
        isGreenGrain:
            extended.is_green_grain ||
            analysis.quality_assessment?.is_green_grain ||
            false
    }
}