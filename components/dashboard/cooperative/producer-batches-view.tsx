//@components/dashboard/cooperative/producer-batches-view.tsx

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, AlertCircle, FileText } from "lucide-react"
import { coffeeLotService, CoffeeLot } from "@/lib/services/coffee-lot.service"
import { userService, ProducerProfile } from "@/lib/services/user.service"
import { classificationService, ClassificationSession } from "@/lib/services/classification.service"
import { CertificateModal } from "@/components/dashboard/producer/certificate-modal"

interface ProducerBatchesViewProps {
    producerId: number
}

interface BatchWithQuality extends CoffeeLot {
    averageQuality: number
    sessions: ClassificationSession[]
}

export function ProducerBatchesView({ producerId }: ProducerBatchesViewProps) {
    const router = useRouter()
    const [producer, setProducer] = useState<ProducerProfile | null>(null)
    const [batches, setBatches] = useState<BatchWithQuality[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string>("")

    // Estados para el modal de certificado
    const [selectedBatch, setSelectedBatch] = useState<BatchWithQuality | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [producerId])

    const loadData = async () => {
        setIsLoading(true)
        setError("")

        try {
            // 1. Cargar perfil del productor
            const producerData = await userService.getProfile(producerId) as ProducerProfile
            setProducer(producerData)

            // 2. Cargar lotes del productor
            const lots = await coffeeLotService.getLotsByProducer(producerId)

            // 3. Cargar sesiones de clasificación para cada lote
            const allSessions = await classificationService.getAllSessions()

            // 4. Enriquecer lotes con calidad
            const batchesWithQuality: BatchWithQuality[] = lots.map(lot => {
                const lotSessions = allSessions.filter(s => s.coffee_lot_id === lot.id)
                const averageQuality = calculateAverageQuality(lotSessions)

                return {
                    ...lot,
                    averageQuality,
                    sessions: lotSessions
                }
            })

            setBatches(batchesWithQuality)
        } catch (err: any) {
            console.error("Error loading producer batches:", err)
            setError(err.message || "Error al cargar los lotes del productor")
        } finally {
            setIsLoading(false)
        }
    }

    const calculateAverageQuality = (sessions: ClassificationSession[]): number => {
        if (sessions.length === 0) return 0

        let totalQuality = 0
        let count = 0

        sessions.forEach(session => {
            const quality = getSessionQuality(session)
            if (quality > 0) {
                totalQuality += quality
                count++
            }
        })

        return count > 0 ? totalQuality / count : 0
    }

    const getSessionQuality = (session: ClassificationSession): number => {
        const result = session.classification_result

        if (result?.overall_batch_quality !== undefined && result.overall_batch_quality !== null) {
            const value = result.overall_batch_quality
            return value <= 1 ? value * 100 : value
        }

        if (result?.average_score !== undefined && result.average_score !== null) {
            return result.average_score * 100
        }

        if (session.analyses && session.analyses.length > 0) {
            const sum = session.analyses.reduce((acc, analysis) =>
                acc + (analysis.final_score || 0), 0
            )
            return (sum / session.analyses.length) * 100
        }

        return 0
    }

    const handleViewCertificate = (batch: BatchWithQuality) => {
        if (batch.sessions.length === 0) {
            Alert({
                title: "Sin clasificaciones",
                description: "Este lote no tiene clasificaciones realizadas todavía"
            } as any)
            return
        }
        setSelectedBatch(batch)
        setModalOpen(true)
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

    const getStatusLabel = (status: string): string => {
        const labels: Record<string, string> = {
            REGISTERED: "Registrado",
            PROCESSING: "En Proceso",
            CLASSIFIED: "Clasificado",
            CERTIFIED: "Certificado",
            SHIPPED: "Enviado"
        }
        return labels[status] || status
    }

    const getStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
            REGISTERED: "bg-blue-100 text-blue-800",
            PROCESSING: "bg-yellow-100 text-yellow-800",
            CLASSIFIED: "bg-green-100 text-green-800",
            CERTIFIED: "bg-purple-100 text-purple-800",
            SHIPPED: "bg-gray-100 text-gray-800"
        }
        return colors[status] || "bg-gray-100 text-gray-800"
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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                </Button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Lotes de {producer?.first_name} {producer?.last_name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {producer?.farm_name} · {producer?.city}
                    </p>
                </div>
            </div>

            {/* Producer Info Card */}
            {producer && (
                <Card>
                    <CardHeader>
                        <CardTitle>Información del Productor</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-gray-600">Teléfono</p>
                                <p className="text-sm font-semibold">{producer.phone_number}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600">Hectáreas</p>
                                <p className="text-sm font-semibold">{producer.hectares} ha</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600">Región</p>
                                <p className="text-sm font-semibold">{producer.region}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600">Capacidad</p>
                                <p className="text-sm font-semibold">
                                    {producer.production_capacity
                                        ? `${producer.production_capacity.toLocaleString()} kg/año`
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary Stats */}
            {batches.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Total Lotes</p>
                                <p className="text-2xl font-bold text-gray-900">{batches.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Lotes Clasificados</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {batches.filter(b => b.sessions.length > 0).length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Calidad Promedio</p>
                                <p className="text-2xl font-bold text-amber-700">
                                    {batches.length > 0
                                        ? (batches.reduce((sum, b) => sum + b.averageQuality, 0) / batches.length).toFixed(1)
                                        : '0'}%
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Batches List */}
            <Card>
                <CardHeader>
                    <CardTitle>Lotes Registrados</CardTitle>
                </CardHeader>
                <CardContent>
                    {batches.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Este productor no tiene lotes registrados
                        </div>
                    ) : (
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
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                                        Certificado
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
                                                <div>
                                                    <span className={`font-semibold ${getQualityCategoryColor(batch.averageQuality)}`}>
                                                        {batch.averageQuality.toFixed(1)}%
                                                    </span>
                                                    <p className="text-xs text-gray-500">
                                                        {getQualityCategoryLabel(batch.averageQuality)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">Sin clasificar</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(batch.status)}`}
                                            >
                                                {getStatusLabel(batch.status)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewCertificate(batch)}
                                                disabled={batch.sessions.length === 0}
                                                title={batch.sessions.length === 0 ? "Sin clasificaciones" : "Ver certificado"}
                                            >
                                                <FileText className={`h-4 w-4 ${batch.sessions.length === 0 ? 'text-gray-400' : 'text-amber-700'}`} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Certificate Modal */}
            {selectedBatch && (
                <CertificateModal
                    sessions={selectedBatch.sessions}
                    coffeeLotId={selectedBatch.id}
                    open={modalOpen}
                    onOpenChangeAction={setModalOpen}
                />
            )}
        </div>
    )
}