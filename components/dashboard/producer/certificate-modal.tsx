// components/dashboard/producer/certificate-modal.tsx

"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Mail } from "lucide-react"
import { ClassificationSession } from "@/lib/services/classification.service"
import { certificateService } from "@/lib/services/certificate.service"
import { useState } from "react"

interface CertificateModalProps {
    sessions: ClassificationSession[] // Ahora acepta múltiples sesiones
    coffeeLotId: number
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CertificateModal({ sessions, coffeeLotId, open, onOpenChange }: CertificateModalProps) {
    const [qrImageUrl, setQrImageUrl] = useState<string>("")

    // Generar datos consolidados cuando se abre el modal
    const handleOpen = (isOpen: boolean) => {
        if (isOpen && sessions && sessions.length > 0) {
            const lotData = certificateService.consolidateLotData(sessions)
            const url = certificateService.generateConsolidatedQRImageURL(lotData, 400)
            setQrImageUrl(url)
        }
        onOpenChange(isOpen)
    }

    const handleDownloadPDF = () => {
        if (sessions && sessions.length > 0) {
            const lotData = certificateService.consolidateLotData(sessions)
            certificateService.generateConsolidatedPDF(lotData)
        }
    }

    const handleDownloadCSV = () => {
        if (sessions && sessions.length > 0) {
            const lotData = certificateService.consolidateLotData(sessions)
            certificateService.generateConsolidatedCSV(lotData)
        }
    }

    if (!sessions || sessions.length === 0) {
        return null
    }

    // Calcular datos consolidados para mostrar
    const lotData = certificateService.consolidateLotData(sessions)

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Certificado del Lote #{coffeeLotId}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* QR Code */}
                    <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                            {qrImageUrl ? (
                                <img
                                    src={qrImageUrl}
                                    alt="QR Code del Lote"
                                    className="w-64 h-64"
                                />
                            ) : (
                                <div className="w-64 h-64 bg-gray-100 animate-pulse rounded" />
                            )}
                        </div>
                    </div>

                    {/* Información Consolidada */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500">Lote de Café</p>
                                <p className="font-semibold text-gray-900">#{coffeeLotId}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total de Granos</p>
                                <p className="font-semibold text-gray-900">{lotData.totalGrainsAnalyzed}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Sesiones Realizadas</p>
                                <p className="font-semibold text-gray-900">{lotData.totalSessions}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Calidad Promedio</p>
                                <p className="font-semibold text-amber-700">{lotData.averageQuality.toFixed(1)}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Categoría Predominante</p>
                                <p className="font-semibold text-gray-900">{lotData.predominantCategory}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Período de Análisis</p>
                                <p className="font-semibold text-gray-900 text-xs">
                                    {new Date(lotData.firstClassificationDate).toLocaleDateString('es-PE', {
                                        day: '2-digit',
                                        month: 'short'
                                    })} - {new Date(lotData.lastClassificationDate).toLocaleDateString('es-PE', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Distribución de Calidad */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900">Distribución de Calidad</h4>
                        <div className="grid grid-cols-5 gap-2">
                            <div className="text-center p-2 bg-emerald-50 rounded border border-emerald-200">
                                <p className="text-xs text-gray-600">Specialty</p>
                                <p className="font-bold text-emerald-700">{lotData.categoryDistribution.Specialty.count}</p>
                                <p className="text-xs text-gray-500">{lotData.categoryDistribution.Specialty.percentage.toFixed(1)}%</p>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                                <p className="text-xs text-gray-600">Premium</p>
                                <p className="font-bold text-green-700">{lotData.categoryDistribution.Premium.count}</p>
                                <p className="text-xs text-gray-500">{lotData.categoryDistribution.Premium.percentage.toFixed(1)}%</p>
                            </div>
                            <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                                <p className="text-xs text-gray-600">A</p>
                                <p className="font-bold text-blue-700">{lotData.categoryDistribution.A.count}</p>
                                <p className="text-xs text-gray-500">{lotData.categoryDistribution.A.percentage.toFixed(1)}%</p>
                            </div>
                            <div className="text-center p-2 bg-amber-50 rounded border border-amber-200">
                                <p className="text-xs text-gray-600">B</p>
                                <p className="font-bold text-amber-700">{lotData.categoryDistribution.B.count}</p>
                                <p className="text-xs text-gray-500">{lotData.categoryDistribution.B.percentage.toFixed(1)}%</p>
                            </div>
                            <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                                <p className="text-xs text-gray-600">C</p>
                                <p className="font-bold text-red-700">{lotData.categoryDistribution.C.count}</p>
                                <p className="text-xs text-gray-500">{lotData.categoryDistribution.C.percentage.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        <p className="font-medium text-blue-900 mb-1">💡 Sobre este certificado</p>
                        <p className="text-xs">
                            Este certificado consolida el análisis de <strong>{lotData.totalGrainsAnalyzed} granos</strong> del Lote #{coffeeLotId},
                            procesados en <strong>{lotData.totalSessions} sesiones de clasificación</strong>.
                            El código QR contiene información detallada del lote y puede ser escaneado para verificar la autenticidad.
                        </p>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleDownloadPDF}
                            className="flex-1 bg-amber-700 hover:bg-amber-800"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar PDF
                        </Button>
                        <Button
                            onClick={handleDownloadCSV}
                            variant="outline"
                            className="flex-1"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar CSV
                        </Button>
                    </div>

                    {/* Nota sobre el QR */}
                    <p className="text-xs text-gray-500 text-center">
                        Escanea el código QR para ver los detalles completos del lote
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}