"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AlertCircle, ArrowLeft, Upload, Loader2, CheckCircle2, Calendar, Beaker, Award } from "lucide-react"
import { classificationService, type ClassificationSession } from "@/lib/services/classification.service"
import { coffeeLotService, type CoffeeLot } from "@/lib/services/coffee-lot.service"
import { toast } from "sonner"

interface LotClassificationsProps {
    lotId: number
}

export function LotClassifications({ lotId }: LotClassificationsProps) {
    const router = useRouter()
    const [lot, setLot] = useState<CoffeeLot | null>(null)
    const [sessions, setSessions] = useState<ClassificationSession[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string>("")
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [completedSession, setCompletedSession] = useState<ClassificationSession | null>(null)
    const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false)

    useEffect(() => {
        loadData()
    }, [lotId])

    // Verificar estado de notificaciones por email
    useEffect(() => {
        const checkEmailNotifications = () => {
            const savedNotifications = localStorage.getItem('notifications')
            if (savedNotifications) {
                const prefs = JSON.parse(savedNotifications)
                setEmailNotificationsEnabled(prefs.email && prefs.classification)
            } else {
                setEmailNotificationsEnabled(false)
            }
        }

        checkEmailNotifications()

        // Actualizar cuando se abre el diálogo
        if (isUploadOpen) {
            checkEmailNotifications()
        }
    }, [isUploadOpen])

    // Reset completo cuando se cierra el diálogo
    useEffect(() => {
        if (!isUploadOpen) {
            setSelectedFile(null)
            setIsProcessing(false)
            setShowSuccess(false)
            setCompletedSession(null)
            setError("")
        }
    }, [isUploadOpen])

    const loadData = async () => {
        setIsLoading(true)
        setError("")

        try {
            // Cargar información del lote
            const lotData = await coffeeLotService.getLotById(lotId)
            setLot(lotData)

            // Cargar sesiones de clasificación
            try {
                const sessionsData = await classificationService.getSessionsByCoffeeLot(lotId)
                setSessions(sessionsData)
            } catch (err: any) {
                // Si no hay sesiones, no es un error crítico
                if (err.message.includes("404")) {
                    setSessions([])
                } else {
                    throw err
                }
            }
        } catch (err: any) {
            setError(err.message || "Error al cargar la información")
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError("Por favor selecciona un archivo de imagen válido")
                return
            }
            setSelectedFile(file)
            setError("")
        }
    }

    const handleUploadAndProcess = async () => {
        if (!selectedFile) {
            setError("Por favor selecciona una imagen")
            return
        }

        setIsProcessing(true)
        setError("")

        try {
            // Leer preferencias de notificación desde localStorage
            const savedNotifications = localStorage.getItem('notifications')
            let sendEmail = false
            let userEmail: string | undefined

            if (savedNotifications) {
                const prefs = JSON.parse(savedNotifications)
                // Enviar email solo si ambas opciones están habilitadas
                sendEmail = prefs.email && prefs.classification
            }

            // Obtener email del usuario si se debe enviar notificación
            if (sendEmail) {
                const userStr = localStorage.getItem('user')
                if (userStr) {
                    const user = JSON.parse(userStr)
                    userEmail = user.email
                }
            }

            const session = await classificationService.startClassificationSession(
                lotId,
                selectedFile,
                {
                    userEmail,
                    sendEmailNotification: sendEmail
                }
            )

            // Guardar sesión completada para mostrar opciones
            setCompletedSession(session)

            // Mostrar éxito
            setShowSuccess(true)

            // Mostrar toast de éxito
            toast.success('¡Clasificación completada!', {
                description: `Se analizó el grano con éxito`,
            })

            // Si se envió email, mostrar notificación
            if (sendEmail && userEmail) {
                toast.success('📧 Reporte enviado por email', {
                    description: `El reporte fue enviado a ${userEmail}`,
                })
            }

            // Esperar 3 segundos antes de recargar
            setTimeout(() => {
                setIsUploadOpen(false)
                loadData()
            }, 3000)
        } catch (err: any) {
            setError(err.message || "Error al procesar la imagen")
            setIsProcessing(false)
            toast.error('Error al procesar la clasificación', {
                description: err.message
            })
        }
    }

    const handleOpenUploadDialog = () => {
        setSelectedFile(null)
        setIsProcessing(false)
        setShowSuccess(false)
        setCompletedSession(null)
        setError("")
        setIsUploadOpen(true)
    }

    const handleCloseUploadDialog = () => {
        if (!isProcessing) {
            setIsUploadOpen(false)
        }
    }

    const handleViewSession = (sessionId: number) => {
        router.push(`/dashboard/producer/batches/${lotId}/classification/${sessionId}`)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return "bg-green-100 text-green-800"
            case "IN_PROGRESS":
                return "bg-yellow-100 text-yellow-800"
            case "FAILED":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const getSessionQuality = (session: ClassificationSession): number => {
        // Prioridad 1: Obtener el score del primer análisis (grano individual)
        if (session.analyses && session.analyses.length > 0) {
            const firstAnalysis = session.analyses[0]
            if (firstAnalysis.final_score !== undefined && firstAnalysis.final_score !== null) {
                return firstAnalysis.final_score * 100
            }
        }

        // Prioridad 2: overall_batch_quality
        const result = session.classification_result
        if (result?.overall_batch_quality !== undefined && result.overall_batch_quality !== null) {
            const value = result.overall_batch_quality
            return value <= 1 ? value * 100 : value
        }

        // Prioridad 3: average_score
        if (result?.average_score !== undefined && result.average_score !== null) {
            return result.average_score * 100
        }

        return 0
    }

    const totalGrains = sessions.reduce((acc, s) => acc + s.total_grains_analyzed, 0)
    const averageQuality = sessions.length > 0
        ? sessions.reduce((acc, s) => acc + getSessionQuality(s), 0) / sessions.length
        : 0
    const lastSession = sessions.length > 0 ? sessions[0] : null

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
            <div className="flex items-center justify-between">
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
                            Clasificaciones - {lot?.lot_number}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {lot?.coffee_variety} · {new Date(lot?.harvest_date || "").toLocaleDateString('es-PE')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Error global */}
            {error && !isUploadOpen && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Resumen de calidad */}
            {sessions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen de Calidad</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Total Sesiones</p>
                                <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Granos Analizados</p>
                                <p className="text-2xl font-bold text-gray-900">{totalGrains}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Calidad Promedio</p>
                                <p className="text-2xl font-bold text-amber-700">
                                    {averageQuality.toFixed(1)}%
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Última Clasificación</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {lastSession ? new Date(lastSession.completed_at || "").toLocaleDateString('es-PE') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Lista de sesiones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map((session) => {
                    const quality = getSessionQuality(session)
                    const grainAnalysis = session.analyses?.[0]

                    return (
                        <Card
                            key={session.id}
                            className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => handleViewSession(session.id)}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{session.session_id_vo}</CardTitle>
                                        <CardDescription>
                                            {new Date(session.created_at).toLocaleDateString('es-PE', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </CardDescription>
                                    </div>
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(session.status)}`}>
                                        {session.status}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Beaker className="h-4 w-4" />
                                            <span>Grano ID</span>
                                        </div>
                                        <span className="font-semibold">#{grainAnalysis?.id || 'N/A'}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Award className="h-4 w-4" />
                                            <span>Puntaje</span>
                                        </div>
                                        <span className="font-semibold text-amber-700">
                                            {quality.toFixed(1)}%
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="h-4 w-4" />
                                            <span>Categoría</span>
                                        </div>
                                        <span className="font-semibold">
                                            {grainAnalysis?.final_category || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Mensaje si no hay sesiones */}
            {sessions.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Beaker className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-2">No hay clasificaciones realizadas para este lote</p>
                        <p className="text-sm text-gray-500">
                            Comienza subiendo una imagen de un grano de café
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Call to Action */}
            <Card className="border-2 border-amber-200 bg-amber-50">
                <CardContent className="py-8 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        ¿Desea evaluar la calidad de un nuevo grano de café?
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Sube una imagen y obtén resultados de clasificación en segundos
                    </p>
                    <Button
                        className="bg-amber-700 hover:bg-amber-800"
                        size="lg"
                        onClick={handleOpenUploadDialog}
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Click Aquí
                    </Button>
                </CardContent>
            </Card>

            {/* Upload Dialog */}
            <Dialog open={isUploadOpen} onOpenChange={handleCloseUploadDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Nueva Clasificación de Grano</DialogTitle>
                        <DialogDescription>
                            Sube una imagen de un grano de café para análisis de calidad
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {showSuccess ? (
                        <div className="py-6 space-y-6">
                            <div className="text-center">
                                <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    ¡Clasificación Completada!
                                </h3>
                                {completedSession && completedSession.analyses?.[0] && (
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>Grano ID: <strong>#{completedSession.analyses[0].id}</strong></p>
                                        <p>Puntaje: <strong className="text-amber-700">{getSessionQuality(completedSession).toFixed(1)}%</strong></p>
                                        <p>Categoría: <strong>{completedSession.analyses[0].final_category}</strong></p>
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-center text-gray-500">
                                Redirigiendo a los resultados...
                            </p>
                        </div>
                    ) : isProcessing ? (
                        <div className="py-8 text-center">
                            <Loader2 className="h-16 w-16 mx-auto animate-spin text-amber-700 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Procesando imagen...
                            </h3>
                            <p className="text-sm text-gray-600">
                                Esto puede tomar algunos segundos
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="image">Imagen del Grano *</Label>
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                    />
                                    {selectedFile && (
                                        <p className="text-sm text-gray-600">
                                            Archivo seleccionado: {selectedFile.name}
                                        </p>
                                    )}
                                </div>

                                {selectedFile && (
                                    <div className="border rounded-lg p-4">
                                        <img
                                            src={URL.createObjectURL(selectedFile)}
                                            alt="Preview"
                                            className="max-h-64 mx-auto rounded"
                                        />
                                    </div>
                                )}

                                {/* Estado de notificaciones por email */}
                                {emailNotificationsEnabled ? (
                                    <Alert className="bg-green-50 border-green-200">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <AlertDescription className="text-sm text-green-900">
                                            Las notificaciones por correo están <strong>activadas</strong> en la configuración
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Alert className="bg-amber-50 border-amber-200">
                                        <AlertCircle className="h-4 w-4 text-amber-600" />
                                        <AlertDescription className="text-sm text-amber-900">
                                            Las notificaciones por correo están <strong>desactivadas</strong> en la configuración
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={handleCloseUploadDialog}
                                    disabled={isProcessing}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="bg-amber-700 hover:bg-amber-800"
                                    onClick={handleUploadAndProcess}
                                    disabled={!selectedFile || isProcessing}
                                >
                                    Continuar
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}