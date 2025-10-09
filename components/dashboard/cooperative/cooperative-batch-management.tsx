"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

const mockBatchesByProducer = [
  {
    producer: "Juan Pérez",
    farm: "Finca El Cafetal",
    batches: [
      { id: "LOT-2024-001", date: "2024-01-15", weight: "500 kg", quality: "Premium", status: "Clasificado" },
      { id: "LOT-2024-002", date: "2024-01-14", weight: "450 kg", quality: "Estándar", status: "En proceso" },
    ],
  },
  {
    producer: "María González",
    farm: "La Esperanza",
    batches: [
      { id: "LOT-2024-010", date: "2024-01-13", weight: "600 kg", quality: "Premium", status: "Clasificado" },
      { id: "LOT-2024-011", date: "2024-01-12", weight: "550 kg", quality: "Premium", status: "Clasificado" },
    ],
  },
  {
    producer: "Carlos Rodríguez",
    farm: "Villa Rica",
    batches: [{ id: "LOT-2024-020", date: "2024-01-11", weight: "480 kg", quality: "Estándar", status: "Clasificado" }],
  },
]

export function CooperativeBatchManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedProducers, setExpandedProducers] = useState<string[]>(["Juan Pérez"])

  const toggleProducer = (producer: string) => {
    setExpandedProducers((prev) => (prev.includes(producer) ? prev.filter((p) => p !== producer) : [...prev, producer]))
  }

  const filteredData = mockBatchesByProducer.filter(
    (item) =>
      item.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batches.some((batch) => batch.id.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Lotes por Productor</h2>
        <p className="text-sm text-gray-500 mt-1">Visualiza todos los lotes organizados por productor</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar productor o lote..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Batches by Producer */}
      <div className="space-y-4">
        {filteredData.map((item) => {
          const isExpanded = expandedProducers.includes(item.producer)
          return (
            <Card key={item.producer}>
              <CardHeader
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleProducer(item.producer)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.producer}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{item.farm}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{item.batches.length} lotes</p>
                      <p className="text-xs text-gray-500">
                        {item.batches.filter((b) => b.status === "Clasificado").length} clasificados
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">ID Lote</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Fecha</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Peso</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Calidad</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.batches.map((batch) => (
                          <tr key={batch.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{batch.id}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{batch.date}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{batch.weight}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{batch.quality}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  batch.status === "Clasificado"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {batch.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
