"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, QrCode, TrendingUp, AlertCircle } from "lucide-react"

export function ProducerReports() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reportes y Certificados</h2>
        <p className="text-sm text-gray-500 mt-1">Visualiza y descarga tus reportes de clasificación</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Calidad Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">85.5%</div>
            <p className="text-xs text-green-600 mt-1">+2.3% vs mes anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Lotes Certificados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">18</div>
            <p className="text-xs text-gray-500 mt-1">De 24 lotes totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Defectos Detectados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">3</div>
            <p className="text-xs text-green-600 mt-1">-2 vs mes anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Quality Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Calidad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Premium (90-100%)</span>
                <span className="text-sm font-medium text-gray-900">45%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: "45%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Estándar (75-89%)</span>
                <span className="text-sm font-medium text-gray-900">35%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: "35%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Básico (60-74%)</span>
                <span className="text-sm font-medium text-gray-900">20%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: "20%" }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Defect Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Defectos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Granos negros</p>
                  <p className="text-xs text-gray-500">Defecto primario</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-red-600">2 lotes</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Granos partidos</p>
                  <p className="text-xs text-gray-500">Defecto secundario</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-yellow-600">5 lotes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Certificates */}
      <Card>
        <CardHeader>
          <CardTitle>Certificados de Exportación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["LOT-2024-001", "LOT-2024-003", "LOT-2024-005"].map((lotId) => (
              <div key={lotId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{lotId}</p>
                  <p className="text-sm text-gray-500">Certificado disponible</p>
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
            <li className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-700 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                Mejorar el proceso de secado para reducir granos partidos en un 15%
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-700 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                Implementar selección manual adicional para lotes con defectos primarios
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-700 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                Mantener el proceso actual de lavado que está generando excelentes resultados
              </p>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
