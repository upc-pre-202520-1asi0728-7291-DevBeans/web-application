"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    AlertCircle,
    ArrowLeft,
    Loader2,
    TrendingUp,
    Beaker,
    Award,
    Image as ImageIcon,
    Clock,
    Palette,
    Ruler,
    BarChart3
} from "lucide-react"
import { classificationService, type ClassificationSession, type GrainAnalysis } from "@/lib/services/classification.service"

interface SessionDetailsProps {
    sessionId: number
    lotId: number
}

export function SessionDetails({ sessionId, lotId }: SessionDetailsProps) {
    const router = useRouter()
    const [session, setSession] = useState<ClassificationSession | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string>("")
    const [selectedGrain, setSelectedGrain] = useState<GrainAnalysis | null>(null)

    useEffect(() => {
        loadSession()
    }, [sessionId])

    const loadSession = async () => {
        setIsLoading(true)
        setError("")

        try {
            const sessionData = await classificationService.getSessionById(sessionId)
            setSession(sessionData)
            if (sessionData.analyses?.length > 0) {
                setSelectedGrain(sessionData.analyses[0])
            }
        } catch (err: any) {
            setError(err.message || "Error al cargar la sesión")
        } finally {
            setIsLoading(false)
        }
    }

    const getQualityColor = (category: string) => {
        switch (category) {
            case "Specialty":
                return "bg-purple-100 text-purple-800 border-purple-300"
            case "Premium":
                return "bg-blue-100 text-blue-800 border-blue-300"
            case "A":
                return "bg-green-100 text-green-800 border-green-300"
            case "B":
                return "bg-yellow-100 text-yellow-800 border-yellow-300"
            case "C":
                return "bg-orange-100 text-orange-800 border-orange-300"
            default:
                return "bg-gray-100 text-gray-800 border-gray-300"
        }
    }

    const getProgressBarColor = (category: string) => {
        switch (category) {
            case "Specialty":
                return "bg-purple-600"
            case "Premium":
                return "bg-blue-600"
            case "A":
                return "bg-green-600"
            case "B":
                return "bg-yellow-300"
            case "C":
                return "bg-amber-600"
            default:
                return "bg-gray-600"
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="space-y-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No se encontró la sesión de clasificación</AlertDescription>
                </Alert>
            </div>
        )
    }

    // Calcular la calidad general con múltiples fallbacks
    const getOverallQuality = (): number => {
        const result = session.classification_result

        // Debug: Ver qué datos tenemos
        console.log('Classification Result:', result)

        // 1. Si overall_batch_quality existe y no es null
        if (result?.overall_batch_quality !== undefined && result.overall_batch_quality !== null) {
            const value = result.overall_batch_quality
            // Si está en escala 0-1, convertir a 0-100
            return value <= 1 ? value * 100 : value
        }

        // 2. Si average_score existe (está en escala 0-1)
        if (result?.average_score !== undefined && result.average_score !== null) {
            return result.average_score * 100
        }

        // 3. Calcular manualmente desde los análisis individuales
        if (session.analyses && session.analyses.length > 0) {
            const sum = session.analyses.reduce((acc, analysis) => acc + (analysis.final_score || 0), 0)
            return (sum / session.analyses.length) * 100
        }

        return 0
    }

    const overallQuality = getOverallQuality()

    // Ordenar categorías en el orden correcto
    const categoryOrder = ['Specialty', 'Premium', 'A', 'B', 'C']
    const sortedCategories = Object.entries(session.classification_result?.category_distribution || {})
        .sort(([a], [b]) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/producer/batches/${lotId}/classifications`)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Sesión: {session.session_id_vo}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {new Date(session.created_at).toLocaleDateString('es-PE', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Resumen General */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumen de la Sesión</CardTitle>
                    <CardDescription>Resultados generales del análisis</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Beaker className="h-4 w-4" />
                                <span>Total de Granos</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">
                                {session.total_grains_analyzed}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Award className="h-4 w-4" />
                                <span>Calidad General</span>
                            </div>
                            <p className="text-3xl font-bold text-amber-700">
                                {overallQuality.toFixed(1)}%
                            </p>
                        </div>

                        <div className="space-y-2"></div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span>Tiempo de Proceso</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">
                                {session.processing_time_seconds?.toFixed(1) || 'N/A'}s
                            </p>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Distribución por Categoría */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Distribución por Categoría</h4>
                        <div className="space-y-2">
                            {sortedCategories.map(([category, data]: [string, any]) => {
                                // Solo mostrar categorías que tienen granos
                                if (data.count === 0) return null

                                return (
                                    <div key={category} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge className={getQualityColor(category)} variant="outline">
                                                {category}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-gray-600">
                                                {data.count} granos ({data.percentage?.toFixed(1)}%)
                                            </span>
                                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${getProgressBarColor(category)}`}
                                                    style={{ width: `${data.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Análisis Individual de Granos */}
            <Card>
                <CardHeader>
                    <CardTitle>Análisis Individual de Granos</CardTitle>
                    <CardDescription>Detalle de cada grano analizado</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="grid" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="grid">Vista en Cuadrícula</TabsTrigger>
                            <TabsTrigger value="detail">Vista Detallada</TabsTrigger>
                        </TabsList>

                        <TabsContent value="grid">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {session.analyses.map((analysis, index) => (
                                    <Card
                                        key={analysis.id}
                                        className="cursor-pointer hover:shadow-lg transition-shadow"
                                        onClick={() => setSelectedGrain(analysis)}
                                    >
                                        <CardContent className="p-4">
                                            {analysis.image_url ? (
                                                <img
                                                    src={analysis.image_url}
                                                    alt={`Grano ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded mb-2"
                                                />
                                            ) : (
                                                <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
                                                    <ImageIcon className="h-8 w-8 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold text-gray-900">
                                                    Grano #{index + 1}
                                                </p>
                                                <Badge className={getQualityColor(analysis.final_category)}>
                                                    {analysis.final_category}
                                                </Badge>
                                                <p className="text-xs text-gray-600">
                                                    Score: {(analysis.final_score * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="detail">
                            {selectedGrain && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Imagen */}
                                    <div>
                                        {selectedGrain.image_url ? (
                                            <img
                                                src={selectedGrain.image_url}
                                                alt="Grano seleccionado"
                                                className="w-full rounded-lg shadow-lg"
                                            />
                                        ) : (
                                            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                                                <ImageIcon className="h-16 w-16 text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Detalles */}
                                    <div className="space-y-6">
                                        {/* Calidad */}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <Award className="h-5 w-5" />
                                                Evaluación de Calidad
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Categoría Final:</span>
                                                    <Badge className={getQualityColor(selectedGrain.final_category)}>
                                                        {selectedGrain.final_category}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Puntuación:</span>
                                                    <span className="font-semibold text-amber-700">
                                                        {(selectedGrain.final_score * 100).toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Colores */}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <Palette className="h-5 w-5" />
                                                Distribución de Colores
                                            </h4>
                                            <div className="space-y-2">
                                                {Object.entries(selectedGrain.color_percentages).map(([color, percentage]) => (
                                                    <div key={color} className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600">{color}:</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold">
                                                                {((percentage as number)).toFixed(1)}%
                                                            </span>
                                                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-amber-600"
                                                                    style={{ width: `${(percentage as number) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Características */}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <Ruler className="h-5 w-5" />
                                                Características
                                            </h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <p className="text-xs text-gray-500">Área</p>
                                                    <p className="text-sm font-semibold">
                                                        {selectedGrain.features?.area?.toFixed(0) || 'N/A'} px²
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-gray-500">Perímetro</p>
                                                    <p className="text-sm font-semibold">
                                                        {selectedGrain.features?.perimeter?.toFixed(0) || 'N/A'} px
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-gray-500">Redondez</p>
                                                    <p className="text-sm font-semibold">
                                                        {selectedGrain.features?.circularity?.toFixed(3) || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-gray-500">Fecha de Análisis</p>
                                                    <p className="text-sm font-semibold">
                                                        {selectedGrain.created_at
                                                            ? new Date(selectedGrain.created_at.replace('t', 'T')).toLocaleString("es-PE", {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                                hour12: false
                                                            })
                                                            : "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Factores de Ajuste */}
                                        {selectedGrain.quality_assessment?.adjustments &&
                                            Object.keys(selectedGrain.quality_assessment.adjustments).length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                        <BarChart3 className="h-5 w-5" />
                                                        Factores de Ajuste
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {Object.entries(selectedGrain.quality_assessment.adjustments).map(([factor, value]) => (
                                                            <div key={factor} className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600 capitalize">
                                                                {factor.replace(/_/g, ' ')}:
                                                            </span>
                                                                <span className={`text-sm font-semibold ${
                                                                    (value as number) > 0 ? 'text-green-600' :
                                                                        (value as number) < 0 ? 'text-red-600' :
                                                                            'text-gray-600'
                                                                }`}>
                                                                {(value as number) > 0 ? '+' : ''}{((value as number) * 100).toFixed(2)}%
                                                            </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            )}

                            {/* Navegación entre granos */}
                            <div className="mt-6 flex justify-between items-center">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const currentIndex = session.analyses.findIndex(a => a.id === selectedGrain?.id)
                                        if (currentIndex > 0) {
                                            setSelectedGrain(session.analyses[currentIndex - 1])
                                        }
                                    }}
                                    disabled={session.analyses.findIndex(a => a.id === selectedGrain?.id) === 0}
                                >
                                    Anterior
                                </Button>
                                <span className="text-sm text-gray-600">
                                    Grano {(session.analyses.findIndex(a => a.id === selectedGrain?.id) + 1)} de {session.analyses.length}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const currentIndex = session.analyses.findIndex(a => a.id === selectedGrain?.id)
                                        if (currentIndex < session.analyses.length - 1) {
                                            setSelectedGrain(session.analyses[currentIndex + 1])
                                        }
                                    }}
                                    disabled={session.analyses.findIndex(a => a.id === selectedGrain?.id) === session.analyses.length - 1}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}