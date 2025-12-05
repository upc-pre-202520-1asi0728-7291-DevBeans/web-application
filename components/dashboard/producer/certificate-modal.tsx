"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, Loader2, Copy, Check, Package, Eye, Shield } from "lucide-react"
import { ClassificationSession } from "@/lib/services/classification.service"
import { certificateService } from "@/lib/services/certificate.service"
import { certificationService } from "@/lib/services/certification.service"
import { authService } from "@/lib/services/auth.service"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'

interface CertificateModalProps {
    sessions: ClassificationSession[]
    coffeeLotId: number
    open: boolean
    onOpenChangeAction: (open: boolean) => void
}

export function CertificateModal({ sessions, coffeeLotId, open, onOpenChangeAction }: CertificateModalProps) {
    const router = useRouter()
    const [qrUrl, setQrUrl] = useState<string>('')
    const [copied, setCopied] = useState(false)
    const [lotData, setLotData] = useState<any>(null)
    const [hashUnlocked, setHashUnlocked] = useState(false)
    const [certification, setCertification] = useState<any>(null)
    const [userRole, setUserRole] = useState<string>('')

    // Obtener rol del usuario
    useEffect(() => {
        const user = authService.getUser()
        if (user) {
            setUserRole(user.user_type)
        }
    }, [])

    // Consolidar datos del lote cuando se abre el modal
    useEffect(() => {
        if (open && sessions.length > 0) {
            loadCertificationData()
        }
    }, [open, sessions])

    const loadCertificationData = async () => {
        const consolidated = certificateService.consolidateLotData(sessions)
        setLotData(consolidated)

        // Cargar certificación si existe
        try {
            const certs = await certificationService.getCertificationsByLot(coffeeLotId)
            if (certs.length > 0) {
                setCertification(certs[0])
                consolidated.certification = certs[0]
            }
        } catch (error) {
            console.error('Error loading certification:', error)
        }

        // Generar QR con datos del lote
        generateQRCode(consolidated)
    }

    const generateQRCode = (data: any) => {
        // Crear URL con datos del lote para el QR
        const qrData = {
            type: 'BeanDetect_Certificate',
            lot_id: data.coffeeLotId,
            total_grains: data.totalGrainsAnalyzed,
            sessions: data.totalSessions,
            quality: data.averageQuality.toFixed(1),
            category: data.predominantCategory,
            date: new Date().toISOString(),
            // URL para ver detalles completos (solo para productores)
            details_url: userRole === 'PRODUCER'
                ? `${window.location.origin}/dashboard/producer/batches/${data.coffeeLotId}/classifications`
                : undefined
        }

        const encoded = encodeURIComponent(JSON.stringify(qrData))
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encoded}`
        setQrUrl(qrImageUrl)
    }

    const handleDownloadPDF = async () => {
        if (lotData) {
            await certificateService.generateConsolidatedPDF(lotData)
        }
    }

    const handleDownloadCSV = () => {
        if (lotData) {
            certificateService.generateConsolidatedCSV(lotData)
        }
    }

    const handleViewDetails = () => {
        // Solo disponible para productores
        if (userRole === 'PRODUCER') {
            router.push(`/dashboard/producer/batches/${coffeeLotId}/classifications`)
            onOpenChangeAction(false)
        }
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            toast.success('Copiado al portapapeles')
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast.error('Error al copiar')
        }
    }

    if (!lotData) {
        return (
            <Dialog open={open} onOpenChange={onOpenChangeAction}>
                <DialogContent className="max-w-2xl">
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-amber-700 mb-4" />
                        <p className="text-sm text-gray-600">Cargando certificado...</p>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    // Generar ID único del certificado
    const certificateId = certification?.certification_id || `CERT-${lotData.coffeeLotId}-${Date.now().toString(36).toUpperCase()}`

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Certificado de Trazabilidad</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* QR Code */}
                    <div className="flex justify-center">
                        <div className="border-4 border-amber-700 rounded-lg p-4 bg-white">
                            {qrUrl ? (
                                <img
                                    src={qrUrl}
                                    alt="QR de certificación"
                                    className="w-64 h-64"
                                />
                            ) : (
                                <div className="w-64 h-64 bg-gray-100 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Certificate Info */}
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Package className="h-5 w-5 text-green-600" />
                                <span className="font-semibold text-green-900">Certificado Activo</span>
                            </div>
                            <p className="text-sm text-green-800">
                                Este certificado contiene información verificable del lote de café
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-600 mb-1">ID de Certificado</p>
                                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded block break-all">
                                    {certificateId}
                                </code>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Lote de Café</p>
                                <p className="text-sm font-semibold">#{lotData.coffeeLotId}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Granos Analizados</p>
                                <p className="text-sm font-semibold">{lotData.totalGrainsAnalyzed}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Sesiones</p>
                                <p className="text-sm font-semibold">{lotData.totalSessions}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Calidad Promedio</p>
                                <p className="text-sm font-semibold text-amber-700">
                                    {lotData.averageQuality.toFixed(1)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Categoría</p>
                                <p className="text-sm font-semibold">
                                    {lotData.predominantCategory}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Primera Clasificación</p>
                                <p className="text-sm font-semibold">
                                    {new Date(lotData.firstClassification).toLocaleDateString('es-PE')}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Última Clasificación</p>
                                <p className="text-sm font-semibold">
                                    {new Date(lotData.lastClassification).toLocaleDateString('es-PE')}
                                </p>
                            </div>
                        </div>

                        {/* Distribution */}
                        <div>
                            <p className="text-sm font-semibold text-gray-900 mb-3">Distribución de Calidad</p>
                            <div className="space-y-2">
                                {Object.entries(lotData.categoryDistribution).map(([category, data]: [string, any]) => {
                                    if (data.count === 0) return null
                                    return (
                                        <div key={category} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-700">{category}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-600">{data.count} granos</span>
                                                <span className="font-semibold text-gray-900">{data.percentage.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Hash de Certificación - Solo para COOPERATIVE */}
                        {userRole === 'COOPERATIVE' && certification && (
                            <div className="space-y-3 border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-amber-700" />
                                        <p className="text-sm font-semibold text-gray-900">Hash de Certificación</p>
                                    </div>
                                    {!hashUnlocked && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setHashUnlocked(true)}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Ver Código Hash
                                        </Button>
                                    )}
                                </div>

                                <div className="relative">
                                    <div className={`px-3 py-2 bg-gray-900 rounded font-mono text-xs text-green-400 break-all ${!hashUnlocked ? 'blur-sm select-none' : ''}`}>
                                        {certification.certification_hash}
                                    </div>
                                    {hashUnlocked && (
                                        <div className="flex gap-2 mt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(certification.certification_hash)}
                                                className="flex-1"
                                            >
                                                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                                Copiar Hash
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    const url = certificationService.getBlockchainExplorerUrl(certification.certification_hash)
                                                    window.open(url, '_blank')
                                                }}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Ver en Blockchain
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs text-blue-900">
                                        <strong>🔒 Seguridad:</strong> Este hash es inmutable y único.
                                        Cualquier modificación en los datos de clasificación generaría un hash diferente,
                                        garantizando la integridad de la información.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* URL de Acceso Rápido - Solo para PRODUCER */}
                        {userRole === 'PRODUCER' && (
                            <div>
                                <p className="text-xs text-gray-600 mb-2">URL de Acceso Rápido</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-xs font-mono bg-gray-100 px-3 py-2 rounded break-all">
                                        {`${window.location.origin}/dashboard/producer/batches/${lotData.coffeeLotId}/classifications`}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(`${window.location.origin}/dashboard/producer/batches/${lotData.coffeeLotId}/classifications`)}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                        {/* Botón Ver Clasificaciones - Solo para PRODUCER */}
                        {userRole === 'PRODUCER' && (
                            <Button
                                onClick={handleViewDetails}
                                className="w-full bg-amber-700 hover:bg-amber-800"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Ver Todas las Clasificaciones del Lote
                            </Button>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                onClick={handleDownloadPDF}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                PDF Consolidado
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDownloadCSV}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                CSV Consolidado
                            </Button>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-xs text-blue-900">
                            <strong>Trazabilidad:</strong> Este certificado consolida todas las clasificaciones
                            realizadas para este lote de café. El código QR contiene información verificable
                            que puede ser escaneada para acceder a los detalles completos.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}