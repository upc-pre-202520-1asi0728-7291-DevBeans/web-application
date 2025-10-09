"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react"

const stats = [
  {
    name: "Total de Lotes",
    value: "24",
    icon: Package,
    change: "+3 este mes",
    changeType: "positive",
  },
  {
    name: "Calidad Promedio",
    value: "85.5%",
    icon: TrendingUp,
    change: "+2.3% vs mes anterior",
    changeType: "positive",
  },
  {
    name: "Listos para Exportar",
    value: "18",
    icon: CheckCircle,
    change: "75% del total",
    changeType: "neutral",
  },
  {
    name: "Defectos Críticos",
    value: "3",
    icon: AlertTriangle,
    change: "-2 vs mes anterior",
    changeType: "positive",
  },
]

const recentBatches = [
  {
    id: "LOT-2024-001",
    date: "2024-01-15",
    weight: "500 kg",
    quality: "Premium",
    status: "Clasificado",
  },
  {
    id: "LOT-2024-002",
    date: "2024-01-14",
    weight: "450 kg",
    quality: "Estándar",
    status: "En proceso",
  },
  {
    id: "LOT-2024-003",
    date: "2024-01-13",
    weight: "600 kg",
    quality: "Premium",
    status: "Clasificado",
  },
]

export function ProducerDashboard() {
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

      {/* Recent Batches */}
      <Card>
        <CardHeader>
          <CardTitle>Lotes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBatches.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{batch.id}</p>
                  <p className="text-sm text-gray-500">{batch.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{batch.weight}</p>
                  <p className="text-sm text-gray-500">{batch.quality}</p>
                </div>
                <div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      batch.status === "Clasificado" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {batch.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quality Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Calidad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Premium</span>
                <span className="text-sm font-medium text-gray-900">45%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: "45%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Estándar</span>
                <span className="text-sm font-medium text-gray-900">35%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: "35%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Básico</span>
                <span className="text-sm font-medium text-gray-900">20%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: "20%" }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
