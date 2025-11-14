"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, QrCode, TrendingUp, AlertCircle, Loader2 } from "lucide-react"
import { useClassificationReports } from "@/hooks/use-classification-reports"

interface ProducerReportsProps {
  coffeeLotId?: number
}

export function ProducerReports({ coffeeLotId }: ProducerReportsProps) {
  const { data, loading, error } = useClassificationReports(coffeeLotId)

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
                    <li>• Backend corriendo en: <code className="bg-white px-1 rounded">http://localhost:8000</code></li>
                    {coffeeLotId && <li>• Lote #{coffeeLotId} existe en la base de datos</li>}
                    <li>• CORS configurado correctamente</li>
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
                ? `Visualiza y descarga tus reportes de clasificación - Lote #${coffeeLotId}`
                : `Visualiza y descarga todos tus reportes de clasificación`
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
                {coffeeLotId ? data.sessionsCount : data.totalCoffeeLots}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {coffeeLotId
                    ? `${data.sessionsCount} sesiones de clasificación`
                    : `${data.totalCoffeeLots} lotes de café analizados`
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

        {/* Export Certificates */}
        <Card>
          <CardHeader>
            <CardTitle>Certificados de Exportación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.sessions.filter(s => s.status === 'COMPLETED').map((session) => (
                  <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-amber-300 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{session.session_id_vo}</p>
                      <p className="text-sm text-gray-500">
                        Lote #{session.coffee_lot_id} • {session.total_grains_analyzed} granos • {session.classification_result?.lot_quality || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(session.created_at).toLocaleDateString('es-PE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <QrCode className="h-4 w-4 mr-2" />
                        Ver QR
                      </Button>
                      <Button size="sm" className="bg-amber-700 hover:bg-amber-800">
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  </div>
              ))}

              {data.sessions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay certificados disponibles
                  </div>
              )}
            </div>
          </CardContent>
        </Card>

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