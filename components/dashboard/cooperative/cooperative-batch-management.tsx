"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Search, ChevronDown, ChevronUp, Loader2, AlertCircle } from "lucide-react"
import { cooperativeService, BatchWithProducer } from "@/lib/services/cooperative.service"

export function CooperativeBatchManagement() {
  const [batchesByProducer, setBatchesByProducer] = useState<Map<string, BatchWithProducer[]>>(new Map())
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedProducers, setExpandedProducers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    loadBatches()
  }, [])

  const loadBatches = async () => {
    setIsLoading(true)
    setError("")

    try {
      const data = await cooperativeService.getBatchesGroupedByProducer()
      setBatchesByProducer(data)

      // Expandir el primer productor por defecto
      if (data.size > 0) {
        const firstKey = Array.from(data.keys())[0]
        setExpandedProducers([firstKey])
      }
    } catch (err: any) {
      console.error("Error loading batches:", err)
      setError(err.message || "Error al cargar los lotes")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleProducer = (producerId: string) => {
    setExpandedProducers((prev) =>
        prev.includes(producerId)
            ? prev.filter((p) => p !== producerId)
            : [...prev, producerId]
    )
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

  const processNames: Record<string, string> = {
    WASHED: "Lavado",
    NATURAL: "Natural",
    HONEY: "Honey",
    SEMI_WASHED: "Semi-lavado"
  }

  const statusNames: Record<string, string> = {
    REGISTERED: "Registrado",
    PROCESSING: "En proceso",
    CLASSIFIED: "Clasificado",
    CERTIFIED: "Certificado",
    SHIPPED: "Enviado"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REGISTERED":
        return "bg-blue-100 text-blue-800"
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800"
      case "CLASSIFIED":
        return "bg-green-100 text-green-800"
      case "CERTIFIED":
        return "bg-purple-100 text-purple-800"
      case "SHIPPED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
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
    if (quality >= 80) return "text-green-600"
    if (quality >= 70) return "text-blue-600"
    if (quality >= 60) return "text-yellow-600"
    return "text-orange-600"
  }

  // Filtrar por búsqueda
  const filteredData = Array.from(batchesByProducer.entries()).filter(([_, batches]) => {
    const producer = batches[0]?.producer
    if (!producer) return false

    const producerName = `${producer.first_name} ${producer.last_name}`.toLowerCase()
    const farmName = producer.farm_name.toLowerCase()
    const search = searchTerm.toLowerCase()

    return (
        producerName.includes(search) ||
        farmName.includes(search) ||
        batches.some((batch) => batch.lot_number.toLowerCase().includes(search))
    )
  })

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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lotes por Productor</h2>
          <p className="text-sm text-gray-500 mt-1">
            Visualiza todos los lotes organizados por productor
          </p>
        </div>

        {/* Error */}
        {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

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
        {filteredData.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">
                  {searchTerm ? "No se encontraron lotes" : "No hay lotes registrados"}
                </p>
              </CardContent>
            </Card>
        ) : (
            <div className="space-y-4">
              {filteredData.map(([producerId, batches]) => {
                const producer = batches[0].producer
                const isExpanded = expandedProducers.includes(producerId)
                const classifiedCount = batches.filter((b) =>
                    b.status === "CLASSIFIED" || b.status === "CERTIFIED"
                ).length
                const avgQuality = batches.reduce((sum, b) => sum + b.averageQuality, 0) / batches.length

                return (
                    <Card key={producerId}>
                      <CardHeader
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => toggleProducer(producerId)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {producer.first_name} {producer.last_name}
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">{producer.farm_name}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {batches.length} lotes
                              </p>
                              <p className="text-xs text-gray-500">
                                {classifiedCount} clasificados
                              </p>
                              {avgQuality > 0 && (
                                  <p className={`text-xs font-semibold ${getQualityCategoryColor(avgQuality)}`}>
                                    {getQualityCategoryLabel(avgQuality)} ({avgQuality.toFixed(1)}%)
                                  </p>
                              )}
                            </div>
                            <Button variant="ghost" size="sm">
                              {isExpanded ? (
                                  <ChevronUp className="h-5 w-5" />
                              ) : (
                                  <ChevronDown className="h-5 w-5" />
                              )}
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
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                                    ID Lote
                                  </th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                                    Fecha
                                  </th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                                    Variedad
                                  </th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                                    Proceso
                                  </th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                                    Cantidad
                                  </th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                                    Calidad
                                  </th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                                    Estado
                                  </th>
                                </tr>
                                </thead>
                                <tbody>
                                {batches.map((batch) => (
                                    <tr
                                        key={batch.id}
                                        className="border-b border-gray-100 hover:bg-gray-50"
                                    >
                                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                                        {batch.lot_number}
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-600">
                                        {new Date(batch.harvest_date).toLocaleDateString('es-PE')}
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-600">
                                        {varietyNames[batch.coffee_variety] || batch.coffee_variety}
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-600">
                                        {processNames[batch.processing_method] || batch.processing_method}
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-600">
                                        {batch.quantity} kg
                                      </td>
                                      <td className="py-3 px-4 text-sm">
                                        {batch.averageQuality > 0 ? (
                                            <span className={`font-semibold ${getQualityCategoryColor(batch.averageQuality)}`}>
                                    {batch.averageQuality.toFixed(1)}%
                                  </span>
                                        ) : (
                                            <span className="text-gray-500">N/A</span>
                                        )}
                                      </td>
                                      <td className="py-3 px-4">
                                <span
                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(batch.status)}`}
                                >
                                  {statusNames[batch.status] || batch.status}
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
        )}
      </div>
  )
}