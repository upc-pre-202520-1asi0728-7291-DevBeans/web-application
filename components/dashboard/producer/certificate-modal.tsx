"use client"

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, FileText, Copy, Check } from "lucide-react"
import { ClassificationSession } from "@/lib/services/classification.service"
import { certificateService } from "@/lib/services/certificate.service"

interface CertificateModalProps {
    session: ClassificationSession | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CertificateModal({ session, open, onOpenChange }: CertificateModalProps) {
    const [copied, setCopied] = useState(false)

    if (!session) return null

    const qrData = certificateService.generateQRData(session)
    const qrImageUrl = certificateService.generateQRImageURL(session, 300)

    const handleDownloadPDF = () => {
        certificateService.generatePDF(session)
    }

    const handleDownloadCSV = () => {
        certificateService.generateCSV(session)
    }

    const handleCopyQRData = () => {
        navigator.clipboard.writeText(qrData)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownloadQR = async () => {
        try {
            const response = await fetch(qrImageUrl)
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `qr-${session.session_id_vo}.png`
            link.click()
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error downloading QR:', error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Certificado de Clasificación</DialogTitle>
                    <DialogDescription>
                        Sesión {session.session_id_vo} - Lote #{session.coffee_lot_id}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* QR Code Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Código QR</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopyQRData}
                                className="text-xs"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-3 w-3 mr-1" />
                                        Copiado
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3 w-3 mr-1" />
                                        Copiar datos
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="flex flex-col items-center bg-white p-6 border border-gray-200 rounded-lg">
                            <img
                                src={qrImageUrl}
                                alt="QR Code"
                                className="w-[200px] h-[200px]"
                            />
                            <p className="text-xs text-gray-500 mt-3 text-center">
                                Escanea para ver el certificado
                            </p>
                        </div>

                        <Button
                            onClick={handleDownloadQR}
                            variant="outline"
                            className="w-full"
                            size="sm"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar QR
                        </Button>
                    </div>

                    {/* Certificate Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Información del Certificado</h3>

                        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total de granos:</span>
                                <span className="font-medium">{session.total_grains_analyzed}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Calidad del lote:</span>
                                <span className="font-medium">{session.classification_result?.lot_quality}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Puntuación promedio:</span>
                                <span className="font-medium">
                  {(session.classification_result?.average_quality_score * 100)?.toFixed(1)}%
                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Fecha:</span>
                                <span className="font-medium">
                  {new Date(session.created_at).toLocaleDateString('es-PE')}
                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Distribución de Calidad</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-emerald-50 p-2 rounded">
                                    <div className="text-gray-600">Especial</div>
                                    <div className="font-semibold text-emerald-700">
                                        {session.classification_result?.category_distribution?.Specialty || 0}
                                    </div>
                                </div>
                                <div className="bg-green-50 p-2 rounded">
                                    <div className="text-gray-600">Premium</div>
                                    <div className="font-semibold text-green-700">
                                        {session.classification_result?.category_distribution?.Premium || 0}
                                    </div>
                                </div>
                                <div className="bg-blue-50 p-2 rounded">
                                    <div className="text-gray-600">Calidad A</div>
                                    <div className="font-semibold text-blue-700">
                                        {session.classification_result?.category_distribution?.A || 0}
                                    </div>
                                </div>
                                <div className="bg-amber-50 p-2 rounded">
                                    <div className="text-gray-600">Calidad B</div>
                                    <div className="font-semibold text-amber-700">
                                        {session.classification_result?.category_distribution?.B || 0}
                                    </div>
                                </div>
                                <div className="bg-red-50 p-2 rounded col-span-2">
                                    <div className="text-gray-600">Calidad C</div>
                                    <div className="font-semibold text-red-700">
                                        {session.classification_result?.category_distribution?.C || 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Download Buttons */}
                <div className="grid md:grid-cols-2 gap-3 pt-4 border-t">
                    <Button
                        onClick={handleDownloadPDF}
                        className="bg-amber-700 hover:bg-amber-800"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Descargar PDF
                    </Button>
                    <Button
                        onClick={handleDownloadCSV}
                        variant="outline"
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Descargar CSV
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}