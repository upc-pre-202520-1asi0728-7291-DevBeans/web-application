"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Users, Package, TrendingUp, Award, Loader2, AlertCircle, Eye } from "lucide-react"
import { cooperativeService, CooperativeStats, ProducerWithMetrics } from "@/lib/services/cooperative.service"
import { useAuth } from "@/hooks/contexts/auth-context"

export function CooperativeDashboard() {
    const router = useRouter()
    const { user } = useAuth()
    const [stats, setStats] = useState<CooperativeStats | null>(null)
    const [topProducers, setTopProducers] = useState<ProducerWithMetrics[]>([])
    const [qualityDistribution, setQualityDistribution] = useState({
        specialty: 0,
        premium: 0,
        gradeA: 0,
        gradeB: 0,
        gradeC: 0
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string>("")

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        setIsLoading(true)
        setError("")

        try {
            if (!user) {
                setError("No se encontró información del usuario")
                return
            }

            // 1. Cargar estadísticas generales
            const statsData = await cooperativeService.getCooperativeStats(user.id)
            setStats(statsData)

            // 2. Cargar top productores (primeros 5)
            const producersData = await cooperativeService.getProducersWithMetrics()
            setTopProducers(producersData.slice(0, 5))

            // 3. Calcular distribución de calidad
            calculateQualityDistribution(producersData)

        } catch (err: any) {
            console.error("Error loading cooperative dashboard:", err)
            setError(err.message || "Error al cargar el dashboard")
        } finally {
            setIsLoading(false)
        }
    }

    const calculateQualityDistribution = (producers: ProducerWithMetrics[]) => {
        const totalGrains = producers.reduce((sum, p) => sum + p.totalGrains, 0)

        if (totalGrains === 0) return

        const distribution = {
            specialty: 0,
            premium: 0,
            gradeA: 0,
            gradeB: 0,
            gradeC: 0
        }

        producers.forEach(producer => {
            const quality = producer.averageQuality
            const grains = producer.totalGrains

            if (quality >= 90) {
                distribution.specialty += grains
            } else if (quality >= 80) {
                distribution.premium += grains
            } else if (quality >= 70) {
                distribution.gradeA += grains
            } else if (quality >= 60) {
                distribution.gradeB += grains
            } else {
                distribution.gradeC += grains
            }
        })

        setQualityDistribution({
            specialty: (distribution.specialty / totalGrains) * 100,
            premium: (distribution.premium / totalGrains) * 100,
            gradeA: (distribution.gradeA / totalGrains) * 100,
            gradeB: (distribution.gradeB / totalGrains) * 100,
            gradeC: (distribution.gradeC / totalGrains) * 100
        })
    }

    const handleViewProducerBatches = (producerId: number) => {
        router.push(`/dashboard/cooperative/producers/${producerId}/batches`)
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    if (!stats) {
        return null
    }

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Productores Asociados */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Productores Asociados
                        </CardTitle>
                        <Users className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.totalProducers}
                        </div>
                        <p className="text-xs text-green-600">
                            {stats.activeProducers} activos este mes
                        </p>
                    </CardContent>
                </Card>

                {/* Total de Lotes */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Total de Lotes
                        </CardTitle>
                        <Package className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.totalBatches}
                        </div>
                        <p className="text-xs text-gray-500">
                            {stats.classifiedBatches} clasificados
                        </p>
                    </CardContent>
                </Card>

                {/* Calidad Promedio */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Calidad Promedio
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.averageQuality.toFixed(1)}%
                        </div>
                        <p className={`text-xs ${
                            stats.qualityChange > 0 ? "text-green-600" :
                                stats.qualityChange < 0 ? "text-red-600" : "text-gray-500"
                        }`}>
                            {stats.qualityChange > 0 ? "+" : ""}
                            {stats.qualityChange.toFixed(1)}% vs mes anterior
                        </p>
                    </CardContent>
                </Card>

                {/* Lotes Premium */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Lotes Premium
                        </CardTitle>
                        <Award className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.premiumBatches}
                        </div>
                        <p className="text-xs text-gray-500">
                            {stats.premiumPercentage.toFixed(0)}% del total
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Producers */}
            <Card>
                <CardHeader>
                    <CardTitle>Mejores Productores del Mes</CardTitle>
                </CardHeader>
                <CardContent>
                    {topProducers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No hay datos de productores disponibles
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {topProducers.map((producer, index) => (
                                <div
                                    key={producer.user_id}
                                    className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {producer.first_name} {producer.last_name}
                                            </p>
                                            <p className="text-sm text-gray-500">{producer.farm_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">
                                                {producer.averageQuality.toFixed(1)}%
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {producer.totalBatches} lotes
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewProducerBatches(producer.user_id)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quality Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Distribución de Calidad Consolidada</CardTitle>
                </CardHeader>
                <CardContent>
                    {stats.totalBatches === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No hay datos de clasificación disponibles
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Specialty */}
                            {qualityDistribution.specialty > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Specialty (90-100%)
                    </span>
                                        <span className="text-sm font-medium text-gray-900">
                      {qualityDistribution.specialty.toFixed(1)}%
                    </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-600"
                                            style={{ width: `${qualityDistribution.specialty}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Premium */}
                            {qualityDistribution.premium > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Premium (80-89%)
                    </span>
                                        <span className="text-sm font-medium text-gray-900">
                      {qualityDistribution.premium.toFixed(1)}%
                    </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500"
                                            style={{ width: `${qualityDistribution.premium}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Grade A */}
                            {qualityDistribution.gradeA > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Grado A (70-79%)
                    </span>
                                        <span className="text-sm font-medium text-gray-900">
                      {qualityDistribution.gradeA.toFixed(1)}%
                    </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500"
                                            style={{ width: `${qualityDistribution.gradeA}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Grade B */}
                            {qualityDistribution.gradeB > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Grado B (60-69%)
                    </span>
                                        <span className="text-sm font-medium text-gray-900">
                      {qualityDistribution.gradeB.toFixed(1)}%
                    </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500"
                                            style={{ width: `${qualityDistribution.gradeB}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Grade C */}
                            {qualityDistribution.gradeC > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Grado C (0-59%)
                    </span>
                                        <span className="text-sm font-medium text-gray-900">
                      {qualityDistribution.gradeC.toFixed(1)}%
                    </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500"
                                            style={{ width: `${qualityDistribution.gradeC}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}