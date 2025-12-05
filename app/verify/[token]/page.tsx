// app/verify/[token]/page.tsx
// Página pública de verificación de certificados blockchain

import PublicVerificationPage from '@/components/verification/public-verification'

export default function VerifyTokenPage() {
    return <PublicVerificationPage />
}

// Metadata para SEO
export const metadata = {
    title: 'Verificación de Certificado | BeanDetect AI',
    description: 'Verifica la autenticidad de certificados de clasificación de café mediante blockchain',
}