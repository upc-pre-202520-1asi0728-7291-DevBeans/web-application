"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Loader2,
    Shield,
    CheckCircle2,
    ExternalLink,
    AlertCircle,
    Database,
    Link as LinkIcon
} from "lucide-react"
import { blockchainService } from "@/lib/services/blockchain.service"
import { toast } from "sonner"

interface PublishToBlockchainProps {
    certification: any // CertificationRecord
    onPublished?: (result: any) => void
}

export function PublishToBlockchain({ certification, onPublished }: PublishToBlockchainProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const [publishResult, setPublishResult] = useState<any>(null)
    const [error, setError] = useState<string>('')
    const [step, setStep] = useState<'idle' | 'ipfs' | 'blockchain' | 'complete'>('idle')

    const handlePublish = async () => {
        setIsPublishing(true)
        setError('')
        setPublishResult(null)

        try {
            // Preparar datos para IPFS
            const certData = {
                certification_id: certification.certification_id,
                certification_hash: certification.certification_hash,
                coffee_lot_id: certification.coffee_lot_id,
                quality_score: certification.quality_score,
                quality_category: certification.quality_category,
                total_grains_analyzed: certification.total_grains_analyzed,
                certified_at: certification.certified_at,
                status: certification.status,
                verification_token: certification.verification_token,
                metadata: {
                    issuer: 'BeanDetect AI',
                    version: '1.0',
                    standard: 'Coffee Certificate v1.0'
                }
            }

            // Paso 1: Subir a IPFS
            setStep('ipfs')
            toast.info('Subiendo certificado a IPFS...')

            await blockchainService.initialize()
            const ipfsResult = await blockchainService.uploadToIPFS(certData)

            toast.success('Certificado subido a IPFS', {
                description: `IPFS Hash: ${ipfsResult.ipfsHash.substring(0, 16)}...`
            })

            // Paso 2: Publicar en Blockchain
            setStep('blockchain')
            toast.info('Publicando en Polygon blockchain...')

            const blockchainResult = await blockchainService.publishCertificateToBlockchain(
                certification.certification_id,
                certification.certification_hash,
                ipfsResult.ipfsUrl
            )

            // Paso 3: Completado
            setStep('complete')
            setPublishResult({
                ...blockchainResult,
                ipfsHash: ipfsResult.ipfsHash,
                ipfsUrl: ipfsResult.ipfsUrl
            })

            toast.success('¡Certificado publicado en blockchain!', {
                description: 'El certificado es ahora inmutable y verificable públicamente',
                duration: 5000
            })

            if (onPublished) {
                onPublished(blockchainResult)
            }

        } catch (err: any) {
            console.error('Error publishing to blockchain:', err)
            setError(err.message || 'Error al publicar en blockchain')
            toast.error('Error al publicar', {
                description: err.message
            })
            setStep('idle')
        } finally {
            setIsPublishing(false)
        }
    }

    const getStepIcon = () => {
        switch (step) {
            case 'ipfs':
                return <Database className="h-5 w-5 animate-pulse" />
            case 'blockchain':
                return <LinkIcon className="h-5 w-5 animate-pulse" />
            case 'complete':
                return <CheckCircle2 className="h-5 w-5 text-green-600" />
            default:
                return <Shield className="h-5 w-5" />
        }
    }

    const getStepMessage = () => {
        switch (step) {
            case 'ipfs':
                return 'Subiendo a IPFS (almacenamiento descentralizado)...'
            case 'blockchain':
                return 'Registrando en blockchain Polygon...'
            case 'complete':
                return '¡Publicación completada exitosamente!'
            default:
                return 'Listo para publicar'
        }
    }

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 w-full"
                size="lg"
            >
                <Shield className="h-4 w-4 mr-2" />
                Publicar en Blockchain
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-6 w-6 text-purple-600" />
                            Publicar Certificado en Blockchain
                        </DialogTitle>
                        <DialogDescription>
                            El certificado será almacenado de forma permanente e inmutable en Polygon blockchain e IPFS
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Certificate Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Información del Certificado</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">ID:</span>
                                    <code className="font-mono">{certification.certification_id}</code>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Calidad:</span>
                                    <span className="font-semibold">{certification.quality_category} ({certification.quality_score.toFixed(1)}%)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Hash SHA-256:</span>
                                    <code className="font-mono text-xs">{certification.certification_hash.substring(0, 16)}...</code>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status */}
                        {!publishResult && !error && (
                            <Card className={step !== 'idle' ? 'border-purple-300 bg-purple-50' : ''}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        {getStepIcon()}
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{getStepMessage()}</p>
                                            {step !== 'idle' && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Por favor espera, esto puede tomar unos segundos...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Error */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Success Result */}
                        {publishResult && (
                            <Card className="border-green-300 bg-green-50">
                                <CardContent className="pt-6 space-y-4">
                                    <div className="flex items-center gap-2 text-green-900">
                                        <CheckCircle2 className="h-6 w-6" />
                                        <span className="font-semibold">Certificado Publicado Exitosamente</span>
                                    </div>

                                    <div className="space-y-3 bg-white rounded-lg p-4">
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">Transacción Blockchain:</p>
                                            <code className="text-xs font-mono text-gray-900 break-all">
                                                {publishResult.transactionHash}
                                            </code>
                                            {publishResult.explorerUrl && (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="mt-1 h-auto p-0 text-purple-600"
                                                    onClick={() => window.open(publishResult.explorerUrl, '_blank')}
                                                >
                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                    Ver en Polygonscan
                                                </Button>
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">IPFS Hash:</p>
                                            <code className="text-xs font-mono text-gray-900 break-all">
                                                {publishResult.ipfsHash}
                                            </code>
                                            {publishResult.ipfsUrl && (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="mt-1 h-auto p-0 text-purple-600"
                                                    onClick={() => window.open(publishResult.ipfsUrl, '_blank')}
                                                >
                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                    Ver datos en IPFS
                                                </Button>
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">Bloque:</p>
                                            <code className="text-xs font-mono text-gray-900">
                                                #{publishResult.blockNumber}
                                            </code>
                                        </div>
                                    </div>

                                    <Alert>
                                        <Shield className="h-4 w-4" />
                                        <AlertDescription className="text-xs">
                                            <strong>Inmutable:</strong> Este certificado ahora existe permanentemente en blockchain
                                            y no puede ser modificado ni eliminado. Los datos completos están respaldados en IPFS.
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>
                        )}

                        {/* Info sobre costos */}
                        {!publishResult && (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    <strong>Costos:</strong> Testnet (Amoy) es gratis. Mainnet cuesta ~$0.002 USD por certificado.
                                    La publicación es permanente e irreversible.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            {!publishResult && (
                                <Button
                                    onClick={handlePublish}
                                    disabled={isPublishing}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                >
                                    {isPublishing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Publicando...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="h-4 w-4 mr-2" />
                                            Publicar en Blockchain
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                disabled={isPublishing}
                            >
                                {publishResult ? 'Cerrar' : 'Cancelar'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}