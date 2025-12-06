// lib/services/blockchain.service.ts
// Servicio para publicar certificados en blockchain (Polygon + IPFS)

import { ethers } from 'ethers'

// Configuración de redes
const NETWORKS = {
    // TESTNET (Gratis con faucet)
    POLYGON_MUMBAI: {
        name: 'Polygon Mumbai Testnet',
        rpcUrl: 'https://rpc-mumbai.maticvigil.com',
        chainId: 80001,
        explorer: 'https://mumbai.polygonscan.com',
        currency: 'MATIC',
        faucet: 'https://faucet.polygon.technology/'
    },
    // MAINNET (Producción, muy barato)
    POLYGON_MAINNET: {
        name: 'Polygon Mainnet',
        rpcUrl: 'https://polygon-rpc.com',
        chainId: 137,
        explorer: 'https://polygonscan.com',
        currency: 'MATIC',
        cost: '~$0.002 USD per tx'
    }
}

// ABI del contrato inteligente para certificados
const CERTIFICATE_CONTRACT_ABI = [
    "function registerCertificate(string memory certId, string memory certHash, string memory ipfsUrl) public",
    "function getCertificate(string memory certId) public view returns (string memory certHash, string memory ipfsUrl, uint256 timestamp, address issuer)",
    "function verifyCertificate(string memory certId, string memory certHash) public view returns (bool)",
    "event CertificateRegistered(string indexed certId, string certHash, string ipfsUrl, uint256 timestamp, address issuer)"
]

export interface BlockchainConfig {
    network: 'MUMBAI' | 'MAINNET'
    privateKey?: string // Solo para backend
    contractAddress?: string
}

export interface BlockchainCertificate {
    certificationId: string
    certificationHash: string
    ipfsUrl?: string
    transactionHash?: string
    blockNumber?: number
    timestamp: number
    explorerUrl?: string
}

export interface IPFSUploadResult {
    ipfsHash: string
    ipfsUrl: string
    size: number
}

class BlockchainService {
    private config: BlockchainConfig
    private provider: ethers.JsonRpcProvider | null = null
    private contract: ethers.Contract | null = null

    constructor(config?: BlockchainConfig) {
        this.config = config || {
            network: 'MUMBAI', // Por defecto testnet
        }
    }

    /**
     * Inicializa la conexión con blockchain
     */
    async initialize(): Promise<void> {
        const network = this.config.network === 'MAINNET'
            ? NETWORKS.POLYGON_MAINNET
            : NETWORKS.POLYGON_MUMBAI

        this.provider = new ethers.JsonRpcProvider(network.rpcUrl)

        // Si hay contractAddress, inicializar contrato
        if (this.config.contractAddress) {
            this.contract = new ethers.Contract(
                this.config.contractAddress,
                CERTIFICATE_CONTRACT_ABI,
                this.provider
            )
        }
    }

    /**
     * Sube datos a IPFS usando Pinata
     */
    async uploadToIPFS(data: any): Promise<IPFSUploadResult> {
        const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY
        const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY

        if (!pinataApiKey || !pinataSecretKey) {
            throw new Error('Pinata credentials not configured')
        }

        const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'

        const payload = {
            pinataContent: data,
            pinataMetadata: {
                name: `BeanDetect-Certificate-${data.certification_id}`,
                keyvalues: {
                    type: 'coffee_certificate',
                    lot_id: data.coffee_lot_id?.toString(),
                    quality: data.quality_category
                }
            }
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretKey
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`IPFS upload failed: ${error.message}`)
        }

        const result = await response.json()

        return {
            ipfsHash: result.IpfsHash,
            ipfsUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
            size: result.PinSize
        }
    }

    /**
     * Publica certificado en blockchain
     * NOTA: Esta función debe ejecutarse en el BACKEND por seguridad
     */
    async publishCertificateToBlockchain(
        certificationId: string,
        certificationHash: string,
        ipfsUrl?: string
    ): Promise<BlockchainCertificate> {
        if (!this.contract) {
            throw new Error('Contract not initialized')
        }

        if (!this.config.privateKey) {
            throw new Error('Private key required for blockchain transactions')
        }

        // Crear wallet con la private key
        const wallet = new ethers.Wallet(this.config.privateKey, this.provider!)
        const contractWithSigner = this.contract.connect(wallet) as any

        // Registrar en blockchain
        const tx = await contractWithSigner.registerCertificate(
            certificationId,
            certificationHash,
            ipfsUrl || ''
        )

        // Esperar confirmación
        const receipt = await tx.wait()

        const network = this.config.network === 'MAINNET'
            ? NETWORKS.POLYGON_MAINNET
            : NETWORKS.POLYGON_MUMBAI

        return {
            certificationId,
            certificationHash,
            ipfsUrl,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            timestamp: Date.now(),
            explorerUrl: `${network.explorer}/tx/${receipt.hash}`
        }
    }

    /**
     * Verifica certificado en blockchain
     */
    async verifyCertificateOnBlockchain(
        certificationId: string,
        certificationHash: string
    ): Promise<boolean> {
        if (!this.contract) {
            throw new Error('Contract not initialized')
        }

        try {
            const contractAny = this.contract as any
            const isValid = await contractAny.verifyCertificate(
                certificationId,
                certificationHash
            )
            return isValid
        } catch (error) {
            console.error('Blockchain verification error:', error)
            return false
        }
    }

    /**
     * Obtiene información del certificado desde blockchain
     */
    async getCertificateFromBlockchain(certificationId: string): Promise<any> {
        if (!this.contract) {
            throw new Error('Contract not initialized')
        }

        try {
            const contractAny = this.contract as any
            const [certHash, ipfsUrl, timestamp, issuer] = await contractAny.getCertificate(
                certificationId
            )

            return {
                certificationHash: certHash,
                ipfsUrl,
                timestamp: Number(timestamp),
                issuer,
                issuedAt: new Date(Number(timestamp) * 1000).toISOString()
            }
        } catch (error) {
            console.error('Error fetching certificate from blockchain:', error)
            return null
        }
    }

    /**
     * Obtiene el balance de MATIC
     */
    async getBalance(address: string): Promise<string> {
        if (!this.provider) {
            throw new Error('Provider not initialized')
        }

        const balance = await this.provider.getBalance(address)
        return ethers.formatEther(balance)
    }

    /**
     * Estima el costo de gas para publicar
     */
    async estimatePublishCost(): Promise<string> {
        if (!this.contract) {
            throw new Error('Contract not initialized')
        }

        try {
            // Estimar gas para la función registerCertificate
            const gasEstimate = await this.contract.getFunction('registerCertificate').estimateGas(
                'TEST-ID',
                'TEST-HASH',
                'TEST-IPFS-URL'
            )

            // Obtener precio del gas
            const feeData = await this.provider!.getFeeData()
            const gasCost = gasEstimate * (feeData.gasPrice || BigInt(0))

            return ethers.formatEther(gasCost)
        } catch (error) {
            console.error('Error estimating cost:', error)
            return '0.002' // Estimación por defecto
        }
    }

    /**
     * Genera URL de explorador para una transacción
     */
    getExplorerUrl(txHash: string): string {
        const network = this.config.network === 'MAINNET'
            ? NETWORKS.POLYGON_MAINNET
            : NETWORKS.POLYGON_MUMBAI

        return `${network.explorer}/tx/${txHash}`
    }

    /**
     * Workflow completo: Subir a IPFS + Publicar en Blockchain
     */
    async publishCertificateComplete(
        certificationData: any
    ): Promise<BlockchainCertificate> {
        // 1. Subir datos completos a IPFS
        console.log('[BLOCKCHAIN] Uploading to IPFS...')
        const ipfsResult = await this.uploadToIPFS(certificationData)
        console.log('[BLOCKCHAIN] IPFS upload successful:', ipfsResult.ipfsUrl)

        // 2. Publicar hash + IPFS URL en blockchain
        console.log('[BLOCKCHAIN] Publishing to blockchain...')
        const blockchainResult = await this.publishCertificateToBlockchain(
            certificationData.certification_id,
            certificationData.certification_hash,
            ipfsResult.ipfsUrl
        )
        console.log('[BLOCKCHAIN] Blockchain publish successful:', blockchainResult.explorerUrl)

        return blockchainResult
    }
}

// Exportar instancia singleton
export const blockchainService = new BlockchainService()

// Exportar clase para instancias personalizadas
export { BlockchainService }

// ============================================
// EJEMPLO DE USO EN TU APLICACIÓN
// ============================================

/*
// 1. Configurar variables de entorno (.env.local):

NEXT_PUBLIC_PINATA_API_KEY=tu_api_key_de_pinata
NEXT_PUBLIC_PINATA_SECRET_KEY=tu_secret_key_de_pinata
BLOCKCHAIN_PRIVATE_KEY=tu_private_key_para_firmar_transacciones
CERTIFICATE_CONTRACT_ADDRESS=0x... (dirección del contrato desplegado)

// 2. Uso básico:

import { blockchainService } from '@/lib/services/blockchain.service'

// Inicializar
await blockchainService.initialize()

// Publicar certificado completo
const result = await blockchainService.publishCertificateComplete({
    certification_id: 'CERT-123',
    certification_hash: '1719c492...',
    coffee_lot_id: 3,
    quality_score: 92.5,
    quality_category: 'Specialty',
    // ... más datos
})

console.log('Certificado en blockchain:', result.explorerUrl)
console.log('Datos en IPFS:', result.ipfsUrl)

// 3. Verificar certificado:

const isValid = await blockchainService.verifyCertificateOnBlockchain(
    'CERT-123',
    '1719c492...'
)

console.log('Certificado válido:', isValid)
*/