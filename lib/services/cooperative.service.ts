// lib/services/cooperative.service.ts

import { BaseService } from './base.service'
import { coffeeLotService, CoffeeLot } from './coffee-lot.service'
import { classificationService, ClassificationSession } from './classification.service'
import { userService, ProducerProfile } from './user.service'

/**
 * Estadísticas agregadas de la cooperativa
 */
export interface CooperativeStats {
    totalProducers: number
    activeProducers: number
    totalBatches: number
    classifiedBatches: number
    averageQuality: number
    qualityChange: number
    premiumBatches: number
    premiumPercentage: number
}

/**
 * Productor con sus métricas
 */
export interface ProducerWithMetrics extends ProducerProfile {
    totalBatches: number
    classifiedBatches: number
    averageQuality: number
    totalGrains: number
    lastActivity: string
}

/**
 * Lote con información del productor
 */
export interface BatchWithProducer extends CoffeeLot {
    producer: ProducerProfile
    sessions: ClassificationSession[]
    averageQuality: number
}

/**
 * Comparación de calidad por temporada
 */
export interface SeasonalQualityComparison {
    season: string
    startDate: string
    endDate: string
    averageQuality: number
    totalGrains: number
    totalBatches: number
}

/**
 * Servicio para operaciones de cooperativas
 */
class CooperativeService extends BaseService {

    /**
     * Obtener estadísticas generales de la cooperativa
     */
    async getCooperativeStats(cooperativeId: number): Promise<CooperativeStats> {
        try {
            // 1. Obtener todos los productores asociados
            const producers = await userService.getAllProducers()

            // 2. Obtener todos los lotes
            const allBatches: CoffeeLot[] = []
            for (const producer of producers) {
                const batches = await coffeeLotService.getLotsByProducer(producer.user_id)
                allBatches.push(...batches)
            }

            // 3. Obtener todas las sesiones de clasificación
            const allSessions = await classificationService.getAllSessions()

            // 4. Calcular métricas
            const totalProducers = producers.length
            const activeProducers = this.getActiveProducersCount(producers, allBatches)
            const totalBatches = allBatches.length
            const classifiedBatches = allBatches.filter(b =>
                b.status === 'CLASSIFIED' || b.status === 'CERTIFIED'
            ).length

            const averageQuality = this.calculateAverageQuality(allSessions)
            const qualityChange = this.calculateQualityChange(allSessions)
            const premiumBatches = this.countPremiumBatches(allSessions)
            const premiumPercentage = totalBatches > 0
                ? (premiumBatches / totalBatches) * 100
                : 0

            return {
                totalProducers,
                activeProducers,
                totalBatches,
                classifiedBatches,
                averageQuality,
                qualityChange,
                premiumBatches,
                premiumPercentage
            }
        } catch (error) {
            console.error('Error getting cooperative stats:', error)
            throw error
        }
    }

    /**
     * Obtener productores con sus métricas
     */
    async getProducersWithMetrics(): Promise<ProducerWithMetrics[]> {
        try {
            const producers = await userService.getAllProducers()
            const allSessions = await classificationService.getAllSessions()

            const producersWithMetrics: ProducerWithMetrics[] = []

            for (const producer of producers) {
                const batches = await coffeeLotService.getLotsByProducer(producer.user_id)
                const producerSessions = allSessions.filter(s =>
                    batches.some(b => b.id === s.coffee_lot_id)
                )

                const totalBatches = batches.length
                const classifiedBatches = batches.filter(b =>
                    b.status === 'CLASSIFIED' || b.status === 'CERTIFIED'
                ).length

                const averageQuality = this.calculateAverageQuality(producerSessions)
                const totalGrains = producerSessions.reduce((sum, s) =>
                    sum + s.total_grains_analyzed, 0
                )

                const lastActivity = batches.length > 0
                    ? batches.reduce((latest, batch) => {
                        const batchDate = new Date(batch.harvest_date)
                        return batchDate > latest ? batchDate : latest
                    }, new Date(0)).toISOString()
                    : new Date().toISOString()

                producersWithMetrics.push({
                    ...producer,
                    totalBatches,
                    classifiedBatches,
                    averageQuality,
                    totalGrains,
                    lastActivity
                })
            }

            // Ordenar por calidad promedio descendente
            return producersWithMetrics.sort((a, b) => b.averageQuality - a.averageQuality)
        } catch (error) {
            console.error('Error getting producers with metrics:', error)
            throw error
        }
    }

    /**
     * Obtener lotes agrupados por productor
     */
    async getBatchesGroupedByProducer(): Promise<Map<string, BatchWithProducer[]>> {
        try {
            const producers = await userService.getAllProducers()
            const allSessions = await classificationService.getAllSessions()
            const batchesByProducer = new Map<string, BatchWithProducer[]>()

            for (const producer of producers) {
                const batches = await coffeeLotService.getLotsByProducer(producer.user_id)

                const batchesWithData: BatchWithProducer[] = batches.map(batch => {
                    const sessions = allSessions.filter(s => s.coffee_lot_id === batch.id)
                    const averageQuality = this.calculateAverageQuality(sessions)

                    return {
                        ...batch,
                        producer,
                        sessions,
                        averageQuality
                    }
                })

                if (batchesWithData.length > 0) {
                    batchesByProducer.set(producer.user_id.toString(), batchesWithData)
                }
            }

            return batchesByProducer
        } catch (error) {
            console.error('Error getting batches grouped by producer:', error)
            throw error
        }
    }

    /**
     * Obtener comparación de calidad por temporadas
     */
    async getSeasonalQualityComparison(): Promise<SeasonalQualityComparison[]> {
        try {
            const allSessions = await classificationService.getAllSessions()
            const currentYear = new Date().getFullYear()

            const seasons = [
                {
                    season: 'Ene-Mar',
                    startMonth: 0,
                    endMonth: 2
                },
                {
                    season: 'Abr-Jun',
                    startMonth: 3,
                    endMonth: 5
                },
                {
                    season: 'Jul-Sep',
                    startMonth: 6,
                    endMonth: 8
                },
                {
                    season: 'Oct-Dic',
                    startMonth: 9,
                    endMonth: 11
                }
            ]

            return seasons.map(({ season, startMonth, endMonth }) => {
                const startDate = new Date(currentYear, startMonth, 1).toISOString()
                const endDate = new Date(currentYear, endMonth + 1, 0).toISOString()

                const seasonSessions = allSessions.filter(s => {
                    const sessionDate = new Date(s.created_at)
                    return sessionDate.getMonth() >= startMonth &&
                        sessionDate.getMonth() <= endMonth &&
                        sessionDate.getFullYear() === currentYear
                })

                const averageQuality = this.calculateAverageQuality(seasonSessions)
                const totalGrains = seasonSessions.reduce((sum, s) =>
                    sum + s.total_grains_analyzed, 0
                )
                const totalBatches = new Set(seasonSessions.map(s => s.coffee_lot_id)).size

                return {
                    season,
                    startDate,
                    endDate,
                    averageQuality,
                    totalGrains,
                    totalBatches
                }
            })
        } catch (error) {
            console.error('Error getting seasonal comparison:', error)
            throw error
        }
    }

    // ========== Métodos auxiliares privados ==========

    private getActiveProducersCount(
        producers: ProducerProfile[],
        batches: CoffeeLot[]
    ): number {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const activeProducerIds = new Set(
            batches
                .filter(b => new Date(b.harvest_date) >= thirtyDaysAgo)
                .map(b => b.producer_id)
        )

        return activeProducerIds.size
    }

    private calculateAverageQuality(sessions: ClassificationSession[]): number {
        if (sessions.length === 0) return 0

        let totalQuality = 0
        let count = 0

        sessions.forEach(session => {
            const quality = this.getSessionQuality(session)
            if (quality > 0) {
                totalQuality += quality
                count++
            }
        })

        return count > 0 ? totalQuality / count : 0
    }

    private getSessionQuality(session: ClassificationSession): number {
        const result = session.classification_result

        if (result?.overall_batch_quality !== undefined && result.overall_batch_quality !== null) {
            const value = result.overall_batch_quality
            return value <= 1 ? value * 100 : value
        }

        if (result?.average_score !== undefined && result.average_score !== null) {
            return result.average_score * 100
        }

        if (session.analyses && session.analyses.length > 0) {
            const sum = session.analyses.reduce((acc, analysis) =>
                acc + (analysis.final_score || 0), 0
            )
            return (sum / session.analyses.length) * 100
        }

        return 0
    }

    private calculateQualityChange(sessions: ClassificationSession[]): number {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const sixtyDaysAgo = new Date()
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

        const recentSessions = sessions.filter(s =>
            new Date(s.created_at) >= thirtyDaysAgo
        )

        const previousSessions = sessions.filter(s => {
            const date = new Date(s.created_at)
            return date >= sixtyDaysAgo && date < thirtyDaysAgo
        })

        const recentQuality = this.calculateAverageQuality(recentSessions)
        const previousQuality = this.calculateAverageQuality(previousSessions)

        if (previousQuality === 0) return 0

        return recentQuality - previousQuality
    }

    private countPremiumBatches(sessions: ClassificationSession[]): number {
        const batchQuality = new Map<number, number>()

        sessions.forEach(session => {
            const quality = this.getSessionQuality(session)
            const currentQuality = batchQuality.get(session.coffee_lot_id) || 0
            batchQuality.set(
                session.coffee_lot_id,
                Math.max(currentQuality, quality)
            )
        })

        let premiumCount = 0
        batchQuality.forEach(quality => {
            if (quality >= 80) premiumCount++
        })

        return premiumCount
    }
}

export const cooperativeService = new CooperativeService()