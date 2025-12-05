"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Shield,
    CheckCircle2,
    XCircle,
    Loader2,
    Search,
    ExternalLink,
    Copy
} from "lucide-react"
import { useCertification } from "@/hooks/use-certification"
import { toast } from "sonner"

export default function PublicVerificationPage() {
    const params = useParams()
    const tokenFromUrl = params?.token as string | undefined

    const [searchInput, setSearchInput] = useState('')
    const [verificationResult, setVerificationResult] = useState<any>(null)
    const { verifyByToken, verifyByHash, loading } = useCertification()

    // Auto-verificar si hay token en la URL
    useEffect(() => {
        if (tokenFromUrl) {
            handleVerify(tokenFromUrl)
        }
    }, [tokenFromUrl])

    const handleVerify = async (input: string = searchInput) => {
        if (!input) {
            toast.error('Ingresa un hash o token de verificación')
            return
        }

        const trimmedInput = input.trim()

        // Determinar si es hash (64 caracteres) o token (12 caracteres)
        if (trimmedInput.length === 64) {
            // Es un hash
            const result = await verifyByHash(trimmedInput)
            setVerificationResult(result)
        } else if (trimmedInput.length === 12) {
            // Es un token
            const result = await verifyByToken(trimmedInput)
            setVerificationResult(result)
        } else {
            toast.error('Formato inválido. Debe ser un hash de 64 caracteres o un token de 12 caracteres')
        }
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success('Copiado al portapapeles')
        } catch (error) {
            toast.error('Error al copiar')
        }
    }

    const getStatusBadge = (isValid: boolean) => {
        if (isValid) {
            return (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-2 border-green-200 rounded-full">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-700">Certificado Válido</span>
                </div>
            )
        } else {
            return (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-2 border-red-200 rounded-full">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-700">Certificado Inválido</span>
                </div>
            )
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50">
            <div className="container mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
                        <Shield className="h-8 w-8 text-amber-700" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Verificación de Certificado
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Verifica la autenticidad de certificados de clasificación de café BeanDetect
                        mediante hash blockchain o token de verificación
                    </p>
                </div>

                {/* Search Card */}
                <Card className="max-w-3xl mx-auto mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5 text-amber-700" />
                            Buscar Certificado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="search">
                                Hash de Certificación (64 caracteres) o Token de Verificación (12 caracteres)
                            </Label>
                            <Input
                                id="search"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                                placeholder="Ej: a3b5c7d9e1f2g4h6... o ABC123XYZ789"
                                className="font-mono"
                            />
                        </div>
                        <Button
                            onClick={() => handleVerify()}
                            disabled={loading}
                            className="w-full bg-amber-700 hover:bg-amber-800"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Verificando...
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4 mr-2" />
                                    Verificar Certificado
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Results */}
                {verificationResult && (
                    <Card className="max-w-3xl mx-auto">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Resultado de Verificación</CardTitle>
                                {verificationResult.verified !== undefined &&
                                    getStatusBadge(verificationResult.verified || verificationResult.is_valid)}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Verificado por Hash */}
                            {verificationResult.verified !== undefined && (
                                <>
                                    {verificationResult.verified ? (
                                        <div className="space-y-4">
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <p className="text-sm text-green-900">
                                                    ✅ Este certificado es válido y su integridad ha sido verificada.
                                                    {verificationResult.hash_integrity_check &&
                                                        " El hash coincide con los datos originales."}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-xs text-gray-600">ID de Certificado</Label>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                                            {verificationResult.certification_id}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(verificationResult.certification_id)}
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-gray-600">Estado</Label>
                                                    <p className="text-sm font-medium mt-1">{verificationResult.status}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-gray-600">Calidad</Label>
                                                    <p className="text-sm font-medium mt-1">
                                                        {verificationResult.quality_category} ({verificationResult.quality_score?.toFixed(1)}%)
                                                    </p>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-gray-600">Certificado</Label>
                                                    <p className="text-sm font-medium mt-1">
                                                        {new Date(verificationResult.certified_at).toLocaleDateString('es-PE')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-xs text-gray-600 mb-2 block">Hash de Certificación</Label>
                                                <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400 break-all">
                                                    {verificationResult.certification_hash}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <p className="text-sm text-red-900">
                                                ❌ {verificationResult.message || 'Este certificado no es válido o no existe en nuestros registros.'}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Verificado por Token */}
                            {verificationResult.is_valid !== undefined && (
                                <>
                                    {verificationResult.is_valid ? (
                                        <div className="space-y-4">
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <p className="text-sm text-green-900">
                                                    ✅ Este certificado es válido y está registrado en blockchain.
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-xs text-gray-600">ID de Certificado</Label>
                                                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded block mt-1">
                                                        {verificationResult.certification_id}
                                                    </code>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-gray-600">Granos Analizados</Label>
                                                    <p className="text-sm font-medium mt-1">
                                                        {verificationResult.total_grains_analyzed}
                                                    </p>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-gray-600">Calidad</Label>
                                                    <p className="text-sm font-medium mt-1">
                                                        {verificationResult.quality_category} ({verificationResult.quality_score?.toFixed(1)}%)
                                                    </p>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-gray-600">Estado</Label>
                                                    <p className="text-sm font-medium mt-1">{verificationResult.status}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-xs text-gray-600 mb-2 block">Hash Blockchain</Label>
                                                <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400 break-all">
                                                    {verificationResult.certification_hash}
                                                </div>
                                            </div>

                                            <Button
                                                onClick={() => window.open(`/verify/${verificationResult.certification_hash}`, '_blank')}
                                                variant="outline"
                                                className="w-full"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Ver en Blockchain Explorer
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <p className="text-sm text-red-900">
                                                ❌ Este certificado no es válido o ha sido revocado.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Info */}
                {!verificationResult && (
                    <div className="max-w-3xl mx-auto mt-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>¿Cómo verificar un certificado?</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        1
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Obtén el hash o token</p>
                                        <p className="text-sm text-gray-600">
                                            El hash de certificación (64 caracteres) o el token de verificación (12 caracteres)
                                            se encuentra en el certificado PDF o en el código QR
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        2
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Ingresa el código</p>
                                        <p className="text-sm text-gray-600">
                                            Copia y pega el hash o token en el campo de búsqueda
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        3
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Verifica la autenticidad</p>
                                        <p className="text-sm text-gray-600">
                                            El sistema verificará la integridad del certificado usando blockchain
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}