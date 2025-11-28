"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, QrCode, TrendingUp, AlertCircle, Loader2, Package } from "lucide-react"
import { useClassificationReports } from "@/hooks/use-classification-reports"
import { CertificateModal } from "@/components/dashboard/producer/certificate-modal"
import { ClassificationSession } from "@/lib/services/classification.service"
import { certificateService } from "@/lib/services/certificate.service"

interface ProducerReportsProps {
  coffeeLotId?: number
}

// Interfaz para lote consolidado
interface ConsolidatedLot {
  coffeeLotId: number
  sessions: ClassificationSession[]
  totalGrains: number
  averageQuality: number
  predominantCategory: string
  firstClassification: string
  lastClassification: string
}

export function ProducerReports({ coffeeLotId }: ProducerReportsProps) {
  const { data, loading, error } = useClassificationReports(coffeeLotId)
  const [selectedLot, setSelectedLot] = useState<ConsolidatedLot | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Agrupar sesiones por lote
  const consolidatedLots = useMemo(() => {
    if (!data) return []

    const lotMap = new Map<number, ClassificationSession[]>()

    // Agrupar sesiones por coffee_lot_id
    data.sessions.forEach(session => {
      if (session.status === 'COMPLETED') {
        const existing = lotMap.get(session.coffee_lot_id) || []
        lotMap.set(session.coffee_lot_id, [...existing, session])
      }
    })

    // Convertir a array de lotes consolidados
    const consolidated: ConsolidatedLot[] = []

    lotMap.forEach((sessions, lotId) => {
      const allAnalyses = sessions.flatMap(s => s.analyses || [])
      const totalScore = allAnalyses.reduce((sum, a) => sum + a.final_score, 0)
      const averageQuality = allAnalyses.length > 0 ? (totalScore / allAnalyses.length) * 100 : 0

      // Calcular categoría predominante
      const categoryCount: Record<string, number> = {}
      allAnalyses.forEach(a => {
        categoryCount[a.final_category] = (categoryCount[a.final_category] || 0) + 1
      })
      const predominantCategory = Object.entries(categoryCount).reduce((a, b) =>
          a[1] > b[1] ? a : b
      )[0] || 'N/A'

      // Fechas
      const dates = sessions.map(s => new Date(s.created_at).getTime())

      consolidated.push({
        coffeeLotId: lotId,
        sessions,
        totalGrains: allAnalyses.length,
        averageQuality,
        predominantCategory,
        firstClassification: new Date(Math.min(...dates)).toISOString(),
        lastClassification: new Date(Math.max(...dates)).toISOString()
      })
    })

    // Ordenar por fecha más reciente
    return consolidated.sort((a, b) =>
        new Date(b.lastClassification).getTime() - new Date(a.lastClassification).getTime()
    )
  }, [data])

  const handleViewQR = (lot: ConsolidatedLot) => {
    setSelectedLot(lot)
    setModalOpen(true)
  }

  const handleQuickDownload = (lot: ConsolidatedLot) => {
    const lotData = certificateService.consolidateLotData(lot.sessions)
    certificateService.generateConsolidatedPDF(lotData)
  }

  const handleDownloadCSV = (lot: ConsolidatedLot) => {
    const lotData = certificateService.consolidateLotData(lot.sessions)
    certificateService.generateConsolidatedCSV(lotData)
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
        </div>
    )
  }

  if (error) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-lg">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Error al cargar los datos</p>
                    <p className="text-sm text-gray-600 mt-1">{error}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <p className="font-medium text-gray-900 mb-2">Verifica:</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Haber registrado un nuevo lote</li>
                    <li>• Haber realizado una clasificación previamente</li>
                  </ul>
                </div>

                <Button
                    onClick={() => window.location.reload()}
                    className="w-full bg-amber-700 hover:bg-amber-800"
                >
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    )
  }

  if (!data) {
    return null
  }

  // Calculate percentages for quality distribution
  const totalGrains = data.totalGrainsAnalyzed
  const qualityPercentages = totalGrains > 0 ? {
    Specialty: (data.qualityDistribution.Specialty / totalGrains) * 100,
    Premium: (data.qualityDistribution.Premium / totalGrains) * 100,
    A: (data.qualityDistribution.A / totalGrains) * 100,
    B: (data.qualityDistribution.B / totalGrains) * 100,
    C: (data.qualityDistribution.C / totalGrains) * 100
  } : {
    Specialty: 0,
    Premium: 0,
    A: 0,
    B: 0,
    C: 0
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes y Certificados</h2>
          <p className="text-sm text-gray-500 mt-1">
            {coffeeLotId
                ? `Certificados consolidados del Lote #${coffeeLotId}`
                : `Certificados consolidados por lote de café`
            }
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Calidad Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {data.averageQuality.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Basado en {data.totalGrainsAnalyzed} granos analizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {coffeeLotId ? 'Sesiones Completadas' : 'Lotes Clasificados'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {coffeeLotId ? data.sessionsCount : consolidatedLots.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {coffeeLotId
                    ? `${data.sessionsCount} sesiones de clasificación`
                    : `${consolidatedLots.length} lotes con certificados`
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Defectos Detectados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {data.defects.totalDefects}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Granos con defectos identificados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quality Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Calidad</CardTitle>
          </CardHeader>
          <CardContent>
            {totalGrains > 0 ? (
                <div className="space-y-4">
                  {/* Specialty */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Calidad Especial (90-100%)
                  </span>
                      <span className="text-sm font-medium text-gray-900">
                    {qualityPercentages.Specialty.toFixed(1)}%
                  </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${qualityPercentages.Specialty}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {data.qualityDistribution.Specialty} granos
                    </p>
                  </div>

                  {/* Premium */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Calidad Premium (80-89%)
                  </span>
                      <span className="text-sm font-medium text-gray-900">
                    {qualityPercentages.Premium.toFixed(1)}%
                  </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                          className="h-full bg-green-500"
                          style={{ width: `${qualityPercentages.Premium}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {data.qualityDistribution.Premium} granos
                    </p>
                  </div>

                  {/* A */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Calidad A (70-79%)
                  </span>
                      <span className="text-sm font-medium text-gray-900">
                    {qualityPercentages.A.toFixed(1)}%
                  </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                          className="h-full bg-blue-500"
                          style={{ width: `${qualityPercentages.A}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {data.qualityDistribution.A} granos
                    </p>
                  </div>

                  {/* B */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Calidad B (60-69%)
                  </span>
                      <span className="text-sm font-medium text-gray-900">
                    {qualityPercentages.B.toFixed(1)}%
                  </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                          className="h-full bg-amber-500"
                          style={{ width: `${qualityPercentages.B}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {data.qualityDistribution.B} granos
                    </p>
                  </div>

                  {/* C */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Calidad C (0-59%)
                  </span>
                      <span className="text-sm font-medium text-gray-900">
                    {qualityPercentages.C.toFixed(1)}%
                  </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                          className="h-full bg-red-500"
                          style={{ width: `${qualityPercentages.C}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {data.qualityDistribution.C} granos
                    </p>
                  </div>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay datos de distribución de calidad disponibles
                </div>
            )}
          </CardContent>
        </Card>

        {/* Defect Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Defectos</CardTitle>
          </CardHeader>
          <CardContent>
            {data.defects.totalDefects > 0 ? (
                <div className="space-y-3">
                  {/* Dark/Black Grains */}
                  {data.defects.darkGrains > 0 && (
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Granos negros</p>
                            <p className="text-xs text-gray-500">Defecto primario</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-red-600">
                    {data.defects.darkGrains} granos
                  </span>
                      </div>
                  )}

                  {/* Green Grains */}
                  {data.defects.greenGrains > 0 && (
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Granos verdes</p>
                            <p className="text-xs text-gray-500">Defecto secundario</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-yellow-600">
                    {data.defects.greenGrains} granos
                  </span>
                      </div>
                  )}
                </div>
            ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">¡Excelente!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    No se detectaron defectos en {coffeeLotId ? 'este lote' : 'ningún lote'}
                  </p>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Certificados Consolidados por Lote */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-700" />
              Certificados Consolidados por Lote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {consolidatedLots.map((lot) => (
                  <div
                      key={lot.coffeeLotId}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-amber-300 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Lote #{lot.coffeeLotId}</p>
                      <p className="text-sm text-gray-500">
                        {lot.totalGrains} granos • {lot.sessions.length} sesiones • {lot.predominantCategory}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Calidad promedio: {lot.averageQuality.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(lot.firstClassification).toLocaleDateString('es-PE')} - {new Date(lot.lastClassification).toLocaleDateString('es-PE')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewQR(lot)}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Ver QR
                      </Button>
                      <Button
                          size="sm"
                          className="bg-amber-700 hover:bg-amber-800"
                          onClick={() => handleQuickDownload(lot)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadCSV(lot)}
                      >
                        CSV
                      </Button>
                    </div>
                  </div>
              ))}

              {consolidatedLots.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay certificados disponibles
                  </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Certificate Modal - Consolidado por lote */}
        {selectedLot && (
            <CertificateModal
                sessions={selectedLot.sessions}
                coffeeLotId={selectedLot.coffeeLotId}
                open={modalOpen}
                onOpenChangeAction={setModalOpen}
            />
        )}

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-700" />
              Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.defects.darkGrains > 0 && (
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-red-600 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Se detectaron {data.defects.darkGrains} granos negros. Revisar el proceso de secado
                      y clasificación para reducir defectos primarios.
                    </p>
                  </li>
              )}

              {data.defects.greenGrains > 0 && (
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Se detectaron {data.defects.greenGrains} granos verdes. Mejorar el proceso de
                      maduración y selección en cosecha.
                    </p>
                  </li>
              )}

              {data.averageQuality >= 80 && (
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-green-600 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Excelente calidad promedio ({data.averageQuality.toFixed(1)}%).
                      Mantener las prácticas actuales de procesamiento.
                    </p>
                  </li>
              )}

              {data.averageQuality < 70 && data.averageQuality > 0 && (
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-700 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      La calidad promedio está por debajo del 70%. Se recomienda revisar todos los
                      procesos de beneficio y secado.
                    </p>
                  </li>
              )}

              {data.qualityDistribution.Specialty > totalGrains * 0.3 && totalGrains > 0 && (
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-emerald-600 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Más del 30% de granos son de calidad especial. Considerar certificación
                      de café specialty para mejor precio de mercado.
                    </p>
                  </li>
              )}

              {data.averageQuality === 0 && (
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Aún no hay datos suficientes para generar recomendaciones. Comienza clasificando tus primeros lotes.
                    </p>
                  </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
  )
}