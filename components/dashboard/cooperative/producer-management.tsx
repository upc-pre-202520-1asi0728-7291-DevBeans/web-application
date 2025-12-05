"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Mail, Phone, MapPin, Loader2, AlertCircle, Eye } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cooperativeService, ProducerWithMetrics } from "@/lib/services/cooperative.service"

export function ProducerManagement() {
  const router = useRouter()
  const [producers, setProducers] = useState<ProducerWithMetrics[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    loadProducers()
  }, [])

  const loadProducers = async () => {
    setIsLoading(true)
    setError("")

    try {
      const data = await cooperativeService.getProducersWithMetrics()
      setProducers(data)
    } catch (err: any) {
      console.error("Error loading producers:", err)
      setError(err.message || "Error al cargar los productores")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (producerId: number) => {
    router.push(`/dashboard/cooperative/producers/${producerId}/batches`)
  }

  const filteredProducers = producers.filter(
      (producer) =>
          `${producer.first_name} ${producer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producer.farm_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producer.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (producer: ProducerWithMetrics): string => {
    const daysSinceActivity = Math.floor(
        (new Date().getTime() - new Date(producer.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceActivity <= 30) return "bg-green-100 text-green-800"
    if (daysSinceActivity <= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  const getStatusLabel = (producer: ProducerWithMetrics): string => {
    const daysSinceActivity = Math.floor(
        (new Date().getTime() - new Date(producer.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceActivity <= 30) return "Activo"
    if (daysSinceActivity <= 60) return "Moderado"
    return "Inactivo"
  }

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Productores</h2>
            <p className="text-sm text-gray-500 mt-1">
              Administra los productores asociados a la cooperativa
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

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
                placeholder="Buscar productores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
            />
          </div>
        </div>

        {/* Stats Summary */}
        {producers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Productores</p>
                    <p className="text-2xl font-bold text-gray-900">{producers.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Calidad Promedio</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {(producers.reduce((sum, p) => sum + p.averageQuality, 0) / producers.length).toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Lotes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {producers.reduce((sum, p) => sum + p.totalBatches, 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Granos Analizados</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {producers.reduce((sum, p) => sum + p.totalGrains, 0).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
        )}

        {/* Producers Grid */}
        {filteredProducers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">
                  {searchTerm ? "No se encontraron productores" : "No hay productores registrados"}
                </p>
              </CardContent>
            </Card>
        ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducers.map((producer) => (
                  <Card key={producer.user_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-amber-100 text-amber-700 font-semibold">
                              {producer.first_name[0]}{producer.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">
                              {producer.first_name} {producer.last_name}
                            </CardTitle>
                            <p className="text-sm text-gray-500">{producer.farm_name}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(producer)}`}>
                    {getStatusLabel(producer)}
                  </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{producer.city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{producer.phone_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{producer.email}</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-xl font-bold text-gray-900">{producer.totalBatches}</p>
                            <p className="text-xs text-gray-500">Lotes</p>
                          </div>
                          <div>
                            <p className="text-xl font-bold text-amber-700">
                              {producer.averageQuality.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">Calidad</p>
                          </div>
                          <div>
                            <p className="text-xl font-bold text-gray-900">{producer.totalGrains}</p>
                            <p className="text-xs text-gray-500">Granos</p>
                          </div>
                        </div>
                      </div>

                      <Button
                          variant="outline"
                          className="w-full bg-transparent hover:bg-amber-50"
                          onClick={() => handleViewDetails(producer.user_id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </CardContent>
                  </Card>
              ))}
            </div>
        )}
      </div>
  )
}