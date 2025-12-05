"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Shield,
    CheckCircle2,
    XCircle,
    Loader2,
    Search,
    Coffee,
    Copy,
    Check,
    AlertCircle
} from "lucide-react"
import { certificationService } from "@/lib/services/certification.service"
import { toast } from "sonner"

export default function VerifyPage() {
    const params = useParams()
    const tokenFromUrl = params?.token as string

    const [searchInput, setSearchInput] = useState('')
    const [isVerifying, setIsVerifying] = useState(false)
    const [verificationResult, setVerificationResult] = useState<any>(null)
    const [error, setError] = useState<string>('')
    const [copied, setCopied] = useState(false)

    // Si hay token en la URL, verificar automáticamente
    useEffect(() => {
        if (tokenFromUrl) {
            setSearchInput(tokenFromUrl)
            handleVerify(tokenFromUrl)
        }
    }, [tokenFromUrl])

    const handleVerify = async (input?: string) => {
        const searchValue = input || searchInput

        if (!searchValue.trim()) {
            setError('Por favor ingresa un hash o token de verificación')
            return
        }

        setIsVerifying(true)
        setError('')
        setVerificationResult(null)

        try {
            // Determinar si es hash (64 caracteres) o token (12 caracteres)
            const isHash = searchValue.length === 64

            let result
            if (isHash) {
                result = await certificationService.verifyByHash(searchValue)
            } else {
                result = await certificationService.verifyByToken(searchValue)
            }

            setVerificationResult(result)

        } catch (err: any) {
            setError(err.message || 'Error al verificar el certificado')
        } finally {
            setIsVerifying(false)
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

    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/verify/${searchInput}`
        : ''

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-4">
                        <Shield className="h-10 w-10 text-amber-700" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Verificación de Certificado
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Verifica la autenticidad de certificados de clasificación de café BeanDetect mediante hash
                        blockchain o token de verificación
                    </p>
                </div>

                {/* Search Box */}
                <Card className="mb-6 shadow-lg border-2 border-amber-200">
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
                                placeholder="Ej: a3b5c7d9e1f2g4h6... o ABC123XYZ789"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500">
                                💡 Puedes encontrar este código en el certificado QR o en el certificado PDF
                            </p>
                        </div>

                        <Button
                            onClick={() => handleVerify()}
                            disabled={isVerifying}
                            className="w-full bg-amber-700 hover:bg-amber-800"
                            size="lg"
                        >
                            {isVerifying ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Verificando...
                                </>
                            ) : (
                                <>
                                    <Search className="h-5 w-5 mr-2" />
                                    Verificar Certificado
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Error */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Verification Result */}
                {verificationResult && (
                    <Card className={`shadow-lg border-2 ${
                        verificationResult.verified || verificationResult.is_valid
                            ? 'border-green-500 bg-green-50'
                            : 'border-red-500 bg-red-50'
                    }`}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {verificationResult.verified || verificationResult.is_valid ? (
                                    <>
                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                        <span className="text-green-900">Certificado Válido</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-6 w-6 text-red-600" />
                                        <span className="text-red-900">Certificado Inválido</span>
                                    </>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {(verificationResult.verified || verificationResult.is_valid) ? (
                                <>
                                    {/* Success Message */}
                                    <div className="bg-white rounded-lg p-4 border border-green-200">
                                        <p className="text-sm text-green-900 flex items-start gap-2">
                                            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                            <span>
                                                Este certificado es auténtico y está verificado en el sistema BeanDetect.
                                                Los datos no han sido alterados y la clasificación es válida.
                                            </span>
                                        </p>
                                    </div>

                                    {/* Certification Details */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900">Detalles del Certificado</h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white rounded-lg p-4 border">
                                                <p className="text-xs text-gray-600 mb-1">ID de Certificado</p>
                                                <code className="text-sm font-mono font-semibold text-gray-900 break-all">
                                                    {verificationResult.certification_id}
                                                </code>
                                            </div>

                                            <div className="bg-white rounded-lg p-4 border">
                                                <p className="text-xs text-gray-600 mb-1">Estado</p>
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                                                    verificationResult.status === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {verificationResult.status}
                                                </span>
                                            </div>

                                            <div className="bg-white rounded-lg p-4 border">
                                                <p className="text-xs text-gray-600 mb-1">Calidad</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-bold text-amber-700">
                                                        {verificationResult.quality_score?.toFixed(1)}%
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        {verificationResult.quality_category}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-lg p-4 border">
                                                <p className="text-xs text-gray-600 mb-1">Granos Analizados</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {verificationResult.total_grains_analyzed || 'N/A'}
                                                </p>
                                            </div>

                                            <div className="bg-white rounded-lg p-4 border col-span-2">
                                                <p className="text-xs text-gray-600 mb-1">Certificado el</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {new Date(verificationResult.certified_at).toLocaleDateString('es-PE', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Hash Blockchain */}
                                        {verificationResult.certification_hash && (
                                            <div className="bg-gray-900 rounded-lg p-4">
                                                <p className="text-xs text-gray-400 mb-2">Hash Blockchain SHA-256</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 text-xs font-mono text-green-400 break-all">
                                                        {verificationResult.certification_hash}
                                                    </code>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(verificationResult.certification_hash)}
                                                        className="flex-shrink-0"
                                                    >
                                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Hash Integrity Check */}
                                        {verificationResult.hash_integrity_check !== undefined && (
                                            <div className={`rounded-lg p-4 ${
                                                verificationResult.hash_integrity_check
                                                    ? 'bg-green-100 border border-green-300'
                                                    : 'bg-red-100 border border-red-300'
                                            }`}>
                                                <div className="flex items-center gap-2">
                                                    {verificationResult.hash_integrity_check ? (
                                                        <>
                                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                            <span className="text-sm font-semibold text-green-900">
                                                                Integridad del Hash Verificada
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle className="h-5 w-5 text-red-600" />
                                                            <span className="text-sm font-semibold text-red-900">
                                                                Advertencia: Integridad del Hash Comprometida
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Share */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm font-semibold text-blue-900 mb-2">
                                            Compartir este certificado
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={shareUrl}
                                                readOnly
                                                className="text-xs font-mono bg-white"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(shareUrl)}
                                            >
                                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white rounded-lg p-4 border border-red-200">
                                    <p className="text-sm text-red-900 flex items-start gap-2">
                                        <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                        <span>
                                            {verificationResult.message ||
                                                'Este certificado no es válido o no existe en nuestros registros.'}
                                        </span>
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Info Cards */}
                {!verificationResult && !error && (
                    <div className="grid md:grid-cols-3 gap-4 mt-8">
                        <Card>
                            <CardContent className="pt-6">
                                <Coffee className="h-8 w-8 text-amber-700 mb-3" />
                                <h3 className="font-semibold text-gray-900 mb-2">Trazabilidad</h3>
                                <p className="text-sm text-gray-600">
                                    Verifica el origen y calidad del café con tecnología blockchain
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <Shield className="h-8 w-8 text-green-600 mb-3" />
                                <h3 className="font-semibold text-gray-900 mb-2">Seguro</h3>
                                <p className="text-sm text-gray-600">
                                    Hash inmutable garantiza que los datos no han sido alterados
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <CheckCircle2 className="h-8 w-8 text-blue-600 mb-3" />
                                <h3 className="font-semibold text-gray-900 mb-2">Confiable</h3>
                                <p className="text-sm text-gray-600">
                                    Certificación respaldada por análisis de IA y blockchain
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}