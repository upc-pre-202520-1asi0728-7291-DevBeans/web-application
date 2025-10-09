"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, Users, Award } from "lucide-react"

export function CooperativeReports() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes Consolidados</h2>
          <p className="text-sm text-gray-500 mt-1">Análisis y estadísticas de toda la cooperativa</p>
        </div>
        <Button className="bg-amber-700 hover:bg-amber-800">
          <Download className="h-4 w-4 mr-2" />
          Exportar Reporte
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Calidad Promedio General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">83.2%</div>
            <p className="text-xs text-green-600 mt-1">+1.8% vs mes anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Lotes Certificados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">245</div>
            <p className="text-xs text-gray-500 mt-1">De 328 lotes totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Productores Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">42</div>
            <p className="text-xs text-gray-500 mt-1">De 45 productores</p>
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
          <div className="space-y-4">
            {[
              { name: "Juan Pérez", quality: 92.5, batches: 12 },
              { name: "María González", quality: 89.3, batches: 10 },
              { name: "Carlos Rodríguez", quality: 87.8, batches: 9 },
              { name: "Ana Martínez", quality: 86.5, batches: 8 },
              { name: "Pedro López", quality: 84.2, batches: 7 },
            ].map((producer) => (
              <div key={producer.name}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">{producer.name}</span>
                    <span className="text-xs text-gray-500 ml-2">({producer.batches} lotes)</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{producer.quality}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                    style={{ width: `${producer.quality}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historical Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-700" />
            Tendencias Históricas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Calidad Promedio por Temporada</p>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { season: "Ene-Mar", quality: 81.5 },
                  { season: "Abr-Jun", quality: 82.8 },
                  { season: "Jul-Sep", quality: 83.2 },
                  { season: "Oct-Dic", quality: 84.1 },
                ].map((period) => (
                  <div key={period.season} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{period.season}</p>
                    <p className="text-2xl font-bold text-gray-900">{period.quality}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <li className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                La calidad promedio ha mejorado un 3.2% en los últimos 6 meses, principalmente debido a mejores
                prácticas de secado
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                Los productores que utilizan proceso lavado tienen un 8% más de lotes premium que los de proceso natural
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                Se recomienda capacitación adicional para 5 productores con calidad por debajo del 75%
              </p>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
