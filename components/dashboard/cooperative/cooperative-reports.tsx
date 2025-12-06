"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, Users, Award, Loader2, AlertCircle } from "lucide-react"
import { cooperativeService, ProducerWithMetrics, SeasonalQualityComparison } from "@/lib/services/cooperative.service"
import { classificationService } from "@/lib/services/classification.service"
import { getDefectInfo } from "@/lib/types/extended-types"

export function CooperativeReports() {
  const [producers, setProducers] = useState<ProducerWithMetrics[]>([])
  const [seasonalData, setSeasonalData] = useState<SeasonalQualityComparison[]>([])
  const [totalGrains, setTotalGrains] = useState(0)
  const [qualityDistribution, setQualityDistribution] = useState({
    specialty: 0,
    premium: 0,
    gradeA: 0,
    gradeB: 0,
    gradeC: 0
  })
  const [defectStats, setDefectStats] = useState({
    darkGrains: 0,
    greenGrains: 0,
    total: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    loadReportData()
  }, [])

  const loadReportData = async () => {
    setIsLoading(true)
    setError("")

    try {
      // 1. Cargar productores con métricas
      const producersData = await cooperativeService.getProducersWithMetrics()
      setProducers(producersData)

      // 2. Cargar comparación temporal
      const seasonalComparison = await cooperativeService.getSeasonalQualityComparison()
      setSeasonalData(seasonalComparison)

      // 3. Cargar todas las sesiones para análisis de calidad y defectos
      const allSessions = await classificationService.getAllSessions()

      // Calcular total de granos
      const total = allSessions.reduce((sum, s) => sum + s.total_grains_analyzed, 0)
      setTotalGrains(total)

      // Calcular distribución de calidad
      const distribution = {
        specialty: 0,
        premium: 0,
        gradeA: 0,
        gradeB: 0,
        gradeC: 0
      }

      allSessions.forEach(session => {
        const dist = session.classification_result?.category_distribution
        if (dist) {
          distribution.specialty += dist.Specialty?.count || 0
          distribution.premium += dist.Premium?.count || 0
          distribution.gradeA += dist.A?.count || 0
          distribution.gradeB += dist.B?.count || 0
          distribution.gradeC += dist.C?.count || 0
        }
      })

      setQualityDistribution({
        specialty: total > 0 ? (distribution.specialty / total) * 100 : 0,
        premium: total > 0 ? (distribution.premium / total) * 100 : 0,
        gradeA: total > 0 ? (distribution.gradeA / total) * 100 : 0,
        gradeB: total > 0 ? (distribution.gradeB / total) * 100 : 0,
        gradeC: total > 0 ? (distribution.gradeC / total) * 100 : 0
      })

      // Calcular defectos
      let darkGrains = 0
      let greenGrains = 0

      allSessions.forEach(session => {
        if (session.analyses) {
          session.analyses.forEach(analysis => {
            const defects = getDefectInfo(analysis)
            if (defects.isDarkGrain) darkGrains++
            if (defects.isGreenGrain) greenGrains++
          })
        }
      })

      setDefectStats({
        darkGrains,
        greenGrains,
        total: darkGrains + greenGrains
      })

    } catch (err: any) {
      console.error("Error loading report data:", err)
      setError(err.message || "Error al cargar los datos del reporte")
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportReport = () => {
    // Implementar exportación a PDF/Excel
    console.log("Exportar reporte consolidado")
  }

  const averageQuality = producers.length > 0
      ? producers.reduce((sum, p) => sum + p.averageQuality, 0) / producers.length
      : 0

  const totalBatches = producers.reduce((sum, p) => sum + p.totalBatches, 0)
  const classifiedBatches = producers.reduce((sum, p) => sum + p.classifiedBatches, 0)

  if (isLoading) {
    return (
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
        </div>
    )
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reportes Consolidados</h2>
            <p className="text-sm text-gray-500 mt-1">
              Análisis y estadísticas de toda la cooperativa
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Calidad Promedio General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {averageQuality.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Basado en {totalGrains.toLocaleString()} granos analizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Lotes Certificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {classifiedBatches}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                De {totalBatches} lotes totales ({totalBatches > 0 ? ((classifiedBatches / totalBatches) * 100).toFixed(0) : 0}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Productores Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {producers.filter(p => p.totalBatches > 0).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                De {producers.length} productores registrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Producer Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-700" />
              Comparación de Productores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {producers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay datos de productores disponibles
                </div>
            ) : (
                <div className="space-y-4">
                  {producers.slice(0, 10).map((producer, index) => (
                      <div key={producer.user_id}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                        <span className="text-sm font-medium text-gray-700">
                          {producer.first_name} {producer.last_name}
                        </span>
                              <span className="text-xs text-gray-500 ml-2">
                          ({producer.totalBatches} lotes)
                        </span>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                      {producer.averageQuality.toFixed(1)}%
                    </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                              className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                              style={{ width: `${producer.averageQuality}%` }}
                          />
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
            {totalGrains === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay datos de distribución de calidad disponibles
                </div>
            ) : (
                <div className="space-y-4">
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
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                              className="h-full bg-purple-600"
                              style={{ width: `${qualityDistribution.specialty}%` }}
                          />
                        </div>
                      </div>
                  )}

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
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                              className="h-full bg-green-500"
                              style={{ width: `${qualityDistribution.premium}%` }}
                          />
                        </div>
                      </div>
                  )}

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
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                              className="h-full bg-blue-500"
                              style={{ width: `${qualityDistribution.gradeA}%` }}
                          />
                        </div>
                      </div>
                  )}

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
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                              className="h-full bg-amber-500"
                              style={{ width: `${qualityDistribution.gradeB}%` }}
                          />
                        </div>
                      </div>
                  )}

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
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                              className="h-full bg-red-500"
                              style={{ width: `${qualityDistribution.gradeC}%` }}
                          />
                        </div>
                      </div>
                  )}
                </div>
            )}
          </CardContent>
        </Card>

        {/* Historical Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-700" />
              Tendencias Históricas por Temporada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {seasonalData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay datos históricos disponibles
                </div>
            ) : (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Calidad Promedio por Temporada
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {seasonalData.map((period) => (
                        <div
                            key={period.season}
                            className="text-center p-4 bg-gray-50 rounded-lg"
                        >
                          <p className="text-xs text-gray-500 mb-1">{period.season}</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {period.averageQuality.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {period.totalBatches} lotes
                          </p>
                        </div>
                    ))}
                  </div>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Defect Analysis */}
        {defectStats.total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Defectos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {defectStats.darkGrains > 0 && (
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Granos negros</p>
                            <p className="text-xs text-gray-500">Defecto primario</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-red-600">
                    {defectStats.darkGrains} granos
                  </span>
                      </div>
                  )}

                  {defectStats.greenGrains > 0 && (
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Granos verdes</p>
                            <p className="text-xs text-gray-500">Defecto secundario</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-yellow-600">
                    {defectStats.greenGrains} granos
                  </span>
                      </div>
                  )}
                </div>
              </CardContent>
            </Card>
        )}

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-700" />
              Insights y Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {averageQuality >= 80 && (
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Excelente calidad promedio ({averageQuality.toFixed(1)}%).
                      La cooperativa mantiene altos estándares de calidad.
                    </p>
                  </li>
              )}

              {producers.length > 0 && producers[0].averageQuality >= 90 && (
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      {producers[0].first_name} {producers[0].last_name} lidera en calidad con {producers[0].averageQuality.toFixed(1)}%.
                      Considerar compartir sus prácticas con otros productores.
                    </p>
                  </li>
              )}

              {defectStats.total > 0 && (
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Se detectaron {defectStats.total} granos con defectos.
                      Implementar mejores controles de calidad en la clasificación inicial.
                    </p>
                  </li>
              )}

              {classifiedBatches < totalBatches * 0.5 && totalBatches > 0 && (
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-orange-500 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Solo el {((classifiedBatches / totalBatches) * 100).toFixed(0)}% de los lotes están clasificados.
                      Incentivar a los productores a clasificar sus lotes pendientes.
                    </p>
                  </li>
              )}

              {producers.length === 0 && (
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Aún no hay datos suficientes para generar recomendaciones.
                      Comienza registrando productores y clasificando lotes.
                    </p>
                  </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
  )
}