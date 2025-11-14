// hooks/useClassificationReports.ts

import { useState, useEffect } from 'react'
import { classificationService, ClassificationSession } from '@/lib/services/classification.service'

interface QualityDistribution {
    Specialty: number
    Premium: number
    A: number
    B: number
    C: number
}

interface DefectAnalysis {
    totalDefects: number
    darkGrains: number
    greenGrains: number
}

interface ClassificationReportsData {
    averageQuality: number
    totalGrainsAnalyzed: number
    totalCoffeeLots: number
    sessionsCount: number
    defects: DefectAnalysis
    qualityDistribution: QualityDistribution
    sessions: ClassificationSession[]
}

export function useClassificationReports(coffeeLotId?: number) {
    const [data, setData] = useState<ClassificationReportsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = async () => {
        try {
            setLoading(true)
            setError(null)

            console.log('Fetching classification reports:', coffeeLotId ? `for lot ${coffeeLotId}` : 'all lots')

            // Fetch sessions (all or by lot)
            const sessions = coffeeLotId
                ? await classificationService.getSessionsByCoffeeLot(coffeeLotId)
                : await classificationService.getAllSessions()

            console.log('Sessions loaded:', sessions.length)

            // Calculate overall metrics from sessions
            let totalGrainsAnalyzed = 0
            let totalScore = 0
            const coffeeLotIds = new Set<number>()

            const qualityDistribution: QualityDistribution = {
                Specialty: 0,
                Premium: 0,
                A: 0,
                B: 0,
                C: 0
            }

            let darkGrains = 0
            let greenGrains = 0

            sessions.forEach(session => {
                coffeeLotIds.add(session.coffee_lot_id)

                // Calculate from individual analyses for accuracy
                session.analyses?.forEach(analysis => {
                    totalGrainsAnalyzed++
                    totalScore += analysis.final_score

                    // Count by final_category assigned to each grain
                    const category = analysis.final_category
                    if (category === 'Specialty') qualityDistribution.Specialty++
                    else if (category === 'Premium') qualityDistribution.Premium++
                    else if (category === 'A') qualityDistribution.A++
                    else if (category === 'B') qualityDistribution.B++
                    else if (category === 'C') qualityDistribution.C++

                    const colors = analysis.color_percentages

                    // Check for 100% Dark grains
                    if (colors.Dark >= 99) {
                        darkGrains++
                    }

                    // Check for 100% Green grains
                    if (colors.Green >= 99) {
                        greenGrains++
                    }
                })
            })

            const totalDefects = darkGrains + greenGrains
            const averageQuality = totalGrainsAnalyzed > 0
                ? (totalScore / totalGrainsAnalyzed) * 100
                : 0

            console.log('Calculated data:', {
                averageQuality,
                totalGrainsAnalyzed,
                totalCoffeeLots: coffeeLotIds.size,
                totalDefects
            })

            setData({
                averageQuality,
                totalGrainsAnalyzed,
                totalCoffeeLots: coffeeLotIds.size,
                sessionsCount: sessions.length,
                defects: {
                    totalDefects,
                    darkGrains,
                    greenGrains
                },
                qualityDistribution,
                sessions
            })

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
            setError(errorMessage)
            console.error('Error fetching classification reports:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [coffeeLotId])

    return { data, loading, error, refetch: fetchData }
}