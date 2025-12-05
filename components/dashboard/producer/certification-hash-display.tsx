"use client"

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Shield, Lock, Unlock, ExternalLink, Copy, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { CertificationRecord, certificationService } from "@/lib/services/certification.service"

interface CertificationHashDisplayProps {
    certification: CertificationRecord
    showUnlockButton?: boolean
}

export function CertificationHashDisplay({
                                             certification,
                                             showUnlockButton = true
                                         }: CertificationHashDisplayProps) {
    const [isUnlocked, setIsUnlocked] = useState(false)
    const [showPasswordDialog, setShowPasswordDialog] = useState(false)
    const [password, setPassword] = useState('')
    const [copied, setCopied] = useState(false)

    const handleUnlock = () => {
        // Por seguridad, validar contraseña contra el backend
        // Por ahora usamos una contraseña simple para demostración
        if (password === 'admin123' || password === certification.coffee_lot_id.toString()) {
            setIsUnlocked(true)
            setShowPasswordDialog(false)
            setPassword('')
            toast.success('Hash desbloqueado', {
                description: 'Ahora puedes ver y copiar el hash completo'
            })
        } else {
            toast.error('Contraseña incorrecta', {
                description: 'Verifica tu contraseña e intenta nuevamente'
            })
        }
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            toast.success('Hash copiado al portapapeles')
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            toast.error('Error al copiar el hash')
        }
    }

    const openBlockchainExplorer = () => {
        const url = certificationService.getBlockchainExplorerUrl(certification.certification_hash)
        window.open(url, '_blank')
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'text-green-600 bg-green-50'
            case 'VERIFIED':
                return 'text-blue-600 bg-blue-50'
            case 'REVOKED':
                return 'text-red-600 bg-red-50'
            default:
                return 'text-gray-600 bg-gray-50'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'Activo'
            case 'VERIFIED':
                return 'Verificado'
            case 'REVOKED':
                return 'Revocado'
            default:
                return status
        }
    }

    return (
        <>
            <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-amber-700" />
                                <h3 className="font-semibold text-gray-900">
                                    Certificado de Trazabilidad
                                </h3>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(certification.status)}`}>
                                {getStatusLabel(certification.status)}
                            </span>
                        </div>

                        {/* Certification ID */}
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-600">ID de Certificado</Label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 px-3 py-2 bg-gray-100 rounded font-mono text-sm">
                                    {certification.certification_id}
                                </code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(certification.certification_id)}
                                >
                                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* Hash con blur/desbloqueo */}
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-600">Hash Inmutable (SHA-256)</Label>
                            <div className="relative">
                                <div className={`px-3 py-2 bg-gray-900 rounded font-mono text-xs text-green-400 break-all ${!isUnlocked ? 'blur-sm select-none' : ''}`}>
                                    {certification.certification_hash}
                                </div>
                                {!isUnlocked && showUnlockButton && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Button
                                            onClick={() => setShowPasswordDialog(true)}
                                            size="sm"
                                            className="bg-amber-700 hover:bg-amber-800"
                                        >
                                            <Lock className="h-4 w-4 mr-2" />
                                            Desbloquear Hash
                                        </Button>
                                    </div>
                                )}
                                {isUnlocked && (
                                    <div className="flex gap-2 mt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard(certification.certification_hash)}
                                            className="flex-1"
                                        >
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copiar Hash
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={openBlockchainExplorer}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Ver en Blockchain
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <Label className="text-xs text-gray-600">Calidad</Label>
                                <p className="font-semibold text-gray-900">
                                    {certification.quality_category} ({certification.quality_score.toFixed(1)}%)
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-600">Granos Analizados</Label>
                                <p className="font-semibold text-gray-900">
                                    {certification.total_grains_analyzed}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-600">Certificado</Label>
                                <p className="text-sm text-gray-700">
                                    {new Date(certification.certified_at).toLocaleDateString('es-PE', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-600">Token de Verificación</Label>
                                <code className="text-xs text-gray-700 font-mono">
                                    {certification.verification_token}
                                </code>
                            </div>
                        </div>

                        {/* Info de seguridad */}
                        {isUnlocked && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-900">
                                    <strong>🔒 Seguridad:</strong> Este hash es inmutable y único.
                                    Cualquier modificación en los datos de clasificación generaría un hash diferente,
                                    garantizando la integridad de la información.
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Password Dialog */}
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Unlock className="h-5 w-5 text-amber-700" />
                            Desbloquear Hash de Certificación
                        </DialogTitle>
                        <DialogDescription>
                            Ingresa tu contraseña para ver el hash completo del certificado
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                                placeholder="Ingresa tu contraseña"
                            />
                            <p className="text-xs text-gray-500">
                                💡 Por defecto: "admin123" o el ID del lote
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleUnlock}
                                className="flex-1 bg-amber-700 hover:bg-amber-800"
                            >
                                Desbloquear
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowPasswordDialog(false)
                                    setPassword('')
                                }}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}