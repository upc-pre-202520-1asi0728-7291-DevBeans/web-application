// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CoffeeCertificate
 * @dev Contrato para registrar certificados de café en blockchain
 * @notice Este contrato permite a BeanDetect registrar certificados inmutables
 */
contract CoffeeCertificate {

    // Estructura del certificado
    struct Certificate {
        string certificationHash;  // Hash SHA-256 del certificado
        string ipfsUrl;            // URL de IPFS con datos completos
        uint256 timestamp;         // Timestamp de registro
        address issuer;            // Dirección que emitió el certificado
        bool exists;               // Flag de existencia
    }

    // Mapping: certificateId => Certificate
    mapping(string => Certificate) private certificates;

    // Mapping: certificationHash => certificateId (para búsqueda inversa)
    mapping(string => string) private hashToId;

    // Array de todos los IDs registrados
    string[] private certificateIds;

    // Address del owner (puede ser cooperativa)
    address public owner;

    // Addresses autorizadas para emitir certificados
    mapping(address => bool) public authorizedIssuers;

    // Eventos
    event CertificateRegistered(
        string indexed certId,
        string certHash,
        string ipfsUrl,
        uint256 timestamp,
        address issuer
    );

    event IssuerAuthorized(address indexed issuer, address indexed authorizedBy);
    event IssuerRevoked(address indexed issuer, address indexed revokedBy);

    // Modificadores
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedIssuers[msg.sender] || msg.sender == owner,
            "Not authorized to issue certificates"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    /**
     * @dev Registra un nuevo certificado en blockchain
     * @param certId ID único del certificado
     * @param certHash Hash SHA-256 del certificado
     * @param ipfsUrl URL de IPFS con datos completos
     */
    function registerCertificate(
        string memory certId,
        string memory certHash,
        string memory ipfsUrl
    ) public onlyAuthorized {
        require(!certificates[certId].exists, "Certificate already exists");
        require(bytes(certId).length > 0, "Certificate ID cannot be empty");
        require(bytes(certHash).length == 64, "Invalid hash length (must be 64 chars)");

        certificates[certId] = Certificate({
            certificationHash: certHash,
            ipfsUrl: ipfsUrl,
            timestamp: block.timestamp,
            issuer: msg.sender,
            exists: true
        });

        hashToId[certHash] = certId;
        certificateIds.push(certId);

        emit CertificateRegistered(
            certId,
            certHash,
            ipfsUrl,
            block.timestamp,
            msg.sender
        );
    }

    /**
     * @dev Obtiene la información de un certificado
     * @param certId ID del certificado
     * @return certHash Hash del certificado
     * @return ipfsUrl URL de IPFS
     * @return timestamp Timestamp de registro
     * @return issuer Dirección que emitió el certificado
     */
    function getCertificate(string memory certId)
        public
        view
        returns (
            string memory certHash,
            string memory ipfsUrl,
            uint256 timestamp,
            address issuer
        )
    {
        require(certificates[certId].exists, "Certificate does not exist");

        Certificate memory cert = certificates[certId];
        return (
            cert.certificationHash,
            cert.ipfsUrl,
            cert.timestamp,
            cert.issuer
        );
    }

    /**
     * @dev Verifica si un certificado es válido
     * @param certId ID del certificado
     * @param certHash Hash a verificar
     * @return isValid True si el hash coincide
     */
    function verifyCertificate(
        string memory certId,
        string memory certHash
    ) public view returns (bool isValid) {
        if (!certificates[certId].exists) {
            return false;
        }

        return keccak256(bytes(certificates[certId].certificationHash)) ==
               keccak256(bytes(certHash));
    }

    /**
     * @dev Busca certificado por hash
     * @param certHash Hash del certificado
     * @return certId ID del certificado
     */
    function getCertificateIdByHash(string memory certHash)
        public
        view
        returns (string memory certId)
    {
        return hashToId[certHash];
    }

    /**
     * @dev Verifica si un certificado existe
     * @param certId ID del certificado
     * @return exists True si existe
     */
    function certificateExists(string memory certId)
        public
        view
        returns (bool exists)
    {
        return certificates[certId].exists;
    }

    /**
     * @dev Obtiene el total de certificados registrados
     * @return total Número total de certificados
     */
    function getTotalCertificates() public view returns (uint256 total) {
        return certificateIds.length;
    }

    /**
     * @dev Obtiene un certificado por índice
     * @param index Índice en el array
     * @return certId ID del certificado
     */
    function getCertificateIdByIndex(uint256 index)
        public
        view
        returns (string memory certId)
    {
        require(index < certificateIds.length, "Index out of bounds");
        return certificateIds[index];
    }

    /**
     * @dev Autoriza una dirección para emitir certificados
     * @param issuer Dirección a autorizar
     */
    function authorizeIssuer(address issuer) public onlyOwner {
        require(issuer != address(0), "Invalid address");
        require(!authorizedIssuers[issuer], "Already authorized");

        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer, msg.sender);
    }

    /**
     * @dev Revoca autorización de una dirección
     * @param issuer Dirección a revocar
     */
    function revokeIssuer(address issuer) public onlyOwner {
        require(issuer != owner, "Cannot revoke owner");
        require(authorizedIssuers[issuer], "Not authorized");

        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer, msg.sender);
    }

    /**
     * @dev Transfiere ownership del contrato
     * @param newOwner Nueva dirección owner
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid address");
        require(newOwner != owner, "Already owner");

        owner = newOwner;
        authorizedIssuers[newOwner] = true;
    }
}

/*
==============================================================================
GUÍA DE DESPLIEGUE
==============================================================================

1. TESTNET (Polygon Mumbai - GRATIS):

   a) Obtén MATIC gratis:
      - Ve a: https://faucet.polygon.technology/
      - Conecta tu wallet
      - Solicita MATIC de prueba

   b) Despliega con Remix:
      - Ve a: https://remix.ethereum.org/
      - Crea nuevo archivo: CoffeeCertificate.sol
      - Pega este código
      - Compila con Solidity 0.8.19
      - Deploy & Run > Environment: "Injected Provider - MetaMask"
      - Asegúrate de estar en Mumbai Testnet
      - Deploy!

   c) Copia la dirección del contrato desplegado
      - Ejemplo: 0x1234567890abcdef...
      - Guárdala en tu .env como CERTIFICATE_CONTRACT_ADDRESS

2. MAINNET (Polygon Mainnet - Muy barato):

   a) Compra MATIC:
      - Necesitas ~0.1 MATIC (~$0.10 USD)
      - Cómpralo en Binance, Coinbase, etc.
      - Envíalo a tu wallet MetaMask en Polygon

   b) Despliega igual que testnet pero en Mainnet
      - Cambia red en MetaMask a "Polygon Mainnet"
      - El resto es igual

3. ALTERNATIVA: Hardhat (Para desarrolladores)

   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   npx hardhat init

   # Crea scripts/deploy.js:
   const hre = require("hardhat");

   async function main() {
     const CoffeeCertificate = await hre.ethers.getContractFactory("CoffeeCertificate");
     const certificate = await CoffeeCertificate.deploy();
     await certificate.deployed();
     console.log("Contract deployed to:", certificate.address);
   }

   main().catch((error) => {
     console.error(error);
     process.exit(1);
   });
   ```

   ```bash
   npx hardhat run scripts/deploy.js --network polygonMumbai
   ```

==============================================================================
COSTOS REALES
==============================================================================

Polygon Mumbai (Testnet):
- Deploy: GRATIS (con faucet)
- Cada certificado: GRATIS
- Transacciones: GRATIS

Polygon Mainnet (Producción):
- Deploy: ~$0.50 USD (una sola vez)
- Cada certificado: ~$0.001 - $0.002 USD
- 1000 certificados: ~$2 USD

Ethereum Mainnet (NO RECOMENDADO):
- Deploy: ~$100 - $500 USD
- Cada certificado: ~$5 - $50 USD
- ❌ Muy caro para certificados

==============================================================================
*/