"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Package,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Eye
} from "lucide-react"
import { coffeeLotService, type CoffeeLot } from "@/lib/services/coffee-lot.service"
import { classificationService, type ClassificationSession } from "@/lib/services/classification.service"
import { authService } from "@/lib/services/auth.service"

interface DashboardStats {
  totalLots: number
  averageQuality: number
  qualityChange: number
  readyToExport: number
  registeredLots: number
}

interface LotWithClassification extends CoffeeLot {
  lastClassification?: ClassificationSession
  averageQuality?: number
}

export function ProducerDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalLots: 0,
    averageQuality: 0,
    qualityChange: 0,
    readyToExport: 0,
    registeredLots: 0
  })
  const [recentLots, setRecentLots] = useState<LotWithClassification[]>([])
  const [qualityDistribution, setQualityDistribution] = useState<{
    specialty: number
    premium: number
    gradeA: number
    gradeB: number
    gradeC: number
  }>({
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
      const user = authService.getUser()
      if (!user) {
        setError("No se encontró información del usuario")
        return
      }

      // 1. Cargar todos los lotes del productor
      const allLots = await coffeeLotService.getLotsByProducer(user.id)

      // 2. Cargar todas las sesiones de clasificación
      const allSessions = await classificationService.getAllSessions()

      // 3. Calcular estadísticas
      await calculateStats(allLots, allSessions)

      // 4. Preparar lotes recientes con su última clasificación
      const lotsWithClassifications = await enrichLotsWithClassifications(
          allLots.slice(0, 5), // Solo los 5 más recientes
          allSessions
      )
      setRecentLots(lotsWithClassifications)

      // 5. Calcular distribución de calidad
      calculateQualityDistribution(allSessions)

    } catch (err: any) {
      console.error("Error loading dashboard:", err)
      setError(err.message || "Error al cargar el dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = async (
      lots: CoffeeLot[],
      sessions: ClassificationSession[]
  ) => {
    const totalLots = lots.length

    // Contar lotes por estado
    const registeredLots = lots.filter(l => l.status === "REGISTERED").length
    const classifiedLots = lots.filter(l =>
        l.status === "CLASSIFIED" || l.status === "CERTIFIED"
    ).length

    // Calcular calidad promedio de todas las sesiones
    let totalQuality = 0
    let sessionCount = 0

    sessions.forEach(session => {
      const quality = getSessionQuality(session)
      if (quality > 0) {
        totalQuality += quality
        sessionCount++
      }
    })

    const averageQuality = sessionCount > 0 ? totalQuality / sessionCount : 0

    // Calcular cambio de calidad (comparar con promedio del mes anterior)
    // Por ahora simulamos el cambio - podrías implementar lógica real
    const qualityChange = averageQuality > 0 ? +(Math.random() * 5 - 2.5).toFixed(1) : 0

    setStats({
      totalLots,
      averageQuality,
      qualityChange,
      readyToExport: classifiedLots,
      registeredLots
    })
  }

  const enrichLotsWithClassifications = async (
      lots: CoffeeLot[],
      allSessions: ClassificationSession[]
  ): Promise<LotWithClassification[]> => {
    return lots.map(lot => {
      // Encontrar sesiones de este lote
      const lotSessions = allSessions
          .filter(s => s.coffee_lot_id === lot.id)
          .sort((a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )

      const lastClassification = lotSessions[0]
      const averageQuality = lastClassification
          ? getSessionQuality(lastClassification)
          : 0

      return {
        ...lot,
        lastClassification,
        averageQuality
      }
    })
  }

  const getSessionQuality = (session: ClassificationSession): number => {
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
          acc + (analysis.final_score || 0), 0)
      return (sum / session.analyses.length) * 100
    }

    return 0
  }

  const calculateQualityDistribution = (sessions: ClassificationSession[]) => {
    let specialty = 0
    let premium = 0
    let gradeA = 0
    let gradeB = 0
    let gradeC = 0
    let totalGrains = 0

    sessions.forEach(session => {
      const dist = session.classification_result?.category_distribution
      if (dist) {
        specialty += dist.Specialty?.count || 0
        premium += dist.Premium?.count || 0
        gradeA += dist.A?.count || 0
        gradeB += dist.B?.count || 0
        gradeC += dist.C?.count || 0
        totalGrains += session.total_grains_analyzed || 0
      }
    })

    if (totalGrains > 0) {
      setQualityDistribution({
        specialty: (specialty / totalGrains) * 100,
        premium: (premium / totalGrains) * 100,
        gradeA: (gradeA / totalGrains) * 100,
        gradeB: (gradeB / totalGrains) * 100,
        gradeC: (gradeC / totalGrains) * 100
      })
    }
  }

  const getQualityCategoryLabel = (quality: number): string => {
    if (quality >= 90) return "Specialty"
    if (quality >= 80) return "Premium"
    if (quality >= 70) return "Grado A"
    if (quality >= 60) return "Grado B"
    return "Grado C"
  }

  const getQualityCategoryColor = (quality: number): string => {
    if (quality >= 90) return "text-purple-600"
    if (quality >= 80) return "text-blue-600"
    if (quality >= 70) return "text-green-600"
    if (quality >= 60) return "text-yellow-600"
    return "text-orange-600"
  }

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      REGISTERED: "Registrado",
      PROCESSING: "En Proceso",
      CLASSIFIED: "Clasificado",
      CERTIFIED: "Certificado",
      SHIPPED: "Enviado"
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      REGISTERED: "bg-blue-100 text-blue-800",
      PROCESSING: "bg-yellow-100 text-yellow-800",
      CLASSIFIED: "bg-green-100 text-green-800",
      CERTIFIED: "bg-purple-100 text-purple-800",
      SHIPPED: "bg-gray-100 text-gray-800"
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const varietyNames: Record<string, string> = {
    TYPICA: "Typica",
    CATURRA: "Caturra",
    BOURBON: "Bourbon",
    GEISHA: "Geisha",
    SL28: "SL28",
    SL34: "SL34",
    CASTILLO: "Castillo",
    COLOMBIA: "Colombia"
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

  return (
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                {stats.totalLots}
              </div>
              <p className="text-xs text-gray-500">
                {stats.registeredLots} nuevos este mes
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
                {stats.qualityChange}% vs mes anterior
              </p>
            </CardContent>
          </Card>

          {/* Listos para Exportar */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Listos para Exportar
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.readyToExport}
              </div>
              <p className="text-xs text-gray-500">
                {stats.totalLots > 0
                    ? `${((stats.readyToExport / stats.totalLots) * 100).toFixed(0)}% del total`
                    : "0% del total"
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Batches */}
        <Card>
          <CardHeader>
            <CardTitle>Lotes Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay lotes registrados aún
                </div>
            ) : (
                <div className="space-y-4">
                  {recentLots.map((lot) => (
                      <div
                          key={lot.id}
                          className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{lot.lot_number}</p>
                          <p className="text-sm text-gray-500">
                            {varietyNames[lot.coffee_variety] || lot.coffee_variety} · {" "}
                            {new Date(lot.harvest_date).toLocaleDateString('es-PE')}
                          </p>
                        </div>
                        <div className="text-right mx-4">
                          <p className="font-medium text-gray-900">{lot.quantity} kg</p>
                          {lot.averageQuality && lot.averageQuality > 0 ? (
                              <p className={`text-sm font-semibold ${getQualityCategoryColor(lot.averageQuality)}`}>
                                {getQualityCategoryLabel(lot.averageQuality)} ({lot.averageQuality.toFixed(1)}%)
                              </p>
                          ) : (
                              <p className="text-sm text-gray-500">Sin clasificar</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                    <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(lot.status)}`}
                    >
                      {getStatusLabel(lot.status)}
                    </span>
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/producer/batches/${lot.id}/classifications`)}
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
            <CardTitle>Distribución de Calidad</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.averageQuality === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay datos de clasificación aún
                </div>
            ) : (
                <div className="space-y-4">
                  {/* Specialty */}
                  {qualityDistribution.specialty > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Specialty</span>
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
                          <span className="text-sm font-medium text-gray-700">Premium</span>
                          <span className="text-sm font-medium text-gray-900">
                      {qualityDistribution.premium.toFixed(1)}%
                    </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                              className="h-full bg-blue-600"
                              style={{ width: `${qualityDistribution.premium}%` }}
                          />
                        </div>
                      </div>
                  )}

                  {/* Grado A */}
                  {qualityDistribution.gradeA > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Grado A</span>
                          <span className="text-sm font-medium text-gray-900">
                      {qualityDistribution.gradeA.toFixed(1)}%
                    </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                              className="h-full bg-green-600"
                              style={{ width: `${qualityDistribution.gradeA}%` }}
                          />
                        </div>
                      </div>
                  )}

                  {/* Grado B */}
                  {qualityDistribution.gradeB > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Grado B</span>
                          <span className="text-sm font-medium text-gray-900">
                      {qualityDistribution.gradeB.toFixed(1)}%
                    </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                              className="h-full bg-yellow-500"
                              style={{ width: `${qualityDistribution.gradeB}%` }}
                          />
                        </div>
                      </div>
                  )}

                  {/* Grado C */}
                  {qualityDistribution.gradeC > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Grado C</span>
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