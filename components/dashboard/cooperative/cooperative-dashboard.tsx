"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, TrendingUp, Award } from "lucide-react"

const stats = [
  {
    name: "Productores Asociados",
    value: "45",
    icon: Users,
    change: "+5 este mes",
    changeType: "positive",
  },
  {
    name: "Total de Lotes",
    value: "328",
    icon: Package,
    change: "+23 este mes",
    changeType: "positive",
  },
  {
    name: "Calidad Promedio",
    value: "83.2%",
    icon: TrendingUp,
    change: "+1.8% vs mes anterior",
    changeType: "positive",
  },
  {
    name: "Lotes Premium",
    value: "142",
    icon: Award,
    change: "43% del total",
    changeType: "neutral",
  },
]

const topProducers = [
  { name: "Juan Pérez", farm: "Finca El Cafetal", batches: 12, quality: 92.5 },
  { name: "María González", farm: "La Esperanza", batches: 10, quality: 89.3 },
  { name: "Carlos Rodríguez", farm: "Villa Rica", batches: 9, quality: 87.8 },
  { name: "Ana Martínez", farm: "El Paraíso", batches: 8, quality: 86.5 },
]

export function CooperativeDashboard() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className={`text-xs ${stat.changeType === "positive" ? "text-green-600" : "text-gray-500"}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Producers */}
      <Card>
        <CardHeader>
          <CardTitle>Mejores Productores del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducers.map((producer, index) => (
              <div
                key={producer.name}
                className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{producer.name}</p>
                    <p className="text-sm text-gray-500">{producer.farm}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{producer.quality}%</p>
                  <p className="text-sm text-gray-500">{producer.batches} lotes</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quality Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Calidad Consolidada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Premium</span>
                <span className="text-sm font-medium text-gray-900">43%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: "43%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Estándar</span>
                <span className="text-sm font-medium text-gray-900">38%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: "38%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Básico</span>
                <span className="text-sm font-medium text-gray-900">19%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: "19%" }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="mt-1 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
              <div>
                <p className="text-gray-900">
                  <span className="font-medium">Juan Pérez</span> registró un nuevo lote (LOT-2024-045)
                </p>
                <p className="text-xs text-gray-500">Hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
              <div>
                <p className="text-gray-900">
                  <span className="font-medium">María González</span> completó la clasificación de LOT-2024-043
                </p>
                <p className="text-xs text-gray-500">Hace 5 horas</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="mt-1 h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
              <div>
                <p className="text-gray-900">
                  <span className="font-medium">Carlos Rodríguez</span> descargó certificado de exportación
                </p>
                <p className="text-xs text-gray-500">Hace 1 día</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
