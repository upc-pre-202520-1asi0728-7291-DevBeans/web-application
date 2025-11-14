"use client"

import { useState, useEffect } from 'react'
import { ImageIcon } from 'lucide-react'

interface GrainImageProps {
    src: string | null | undefined
    alt: string
    className?: string
    fallbackClassName?: string
}

/**
 * Componente que corrige automáticamente las imágenes BGR de Cloudinary
 * Las imágenes de granos vienen en BGR porque OpenCV usa ese formato,
 * este componente las convierte a RGB en el cliente usando Canvas
 */
export function GrainImage({ src, alt, className = "", fallbackClassName = "" }: GrainImageProps) {
    const [correctedSrc, setCorrectedSrc] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    useEffect(() => {
        if (!src) {
            setIsLoading(false)
            return
        }

        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
            try {
                // Crear canvas con las dimensiones de la imagen
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')

                if (!ctx) {
                    setHasError(true)
                    setIsLoading(false)
                    return
                }

                // Dibujar la imagen original
                ctx.drawImage(img, 0, 0)

                // Obtener los datos de píxeles
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const data = imageData.data

                // Intercambiar canales R y B (BGR -> RGB)
                for (let i = 0; i < data.length; i += 4) {
                    const temp = data[i]       // Guardar R
                    data[i] = data[i + 2]      // R = B
                    data[i + 2] = temp         // B = R
                    // data[i + 1] se mantiene (G)
                    // data[i + 3] se mantiene (A)
                }

                // Poner los datos corregidos de vuelta
                ctx.putImageData(imageData, 0, 0)

                // Convertir a blob y crear URL
                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob)
                        setCorrectedSrc(url)
                    } else {
                        setHasError(true)
                    }
                    setIsLoading(false)
                }, 'image/jpeg', 0.95)

            } catch (error) {
                console.error('Error al corregir imagen BGR:', error)
                setHasError(true)
                setIsLoading(false)
            }
        }

        img.onerror = () => {
            setHasError(true)
            setIsLoading(false)
        }

        img.src = src

        // Cleanup
        return () => {
            if (correctedSrc) {
                URL.revokeObjectURL(correctedSrc)
            }
        }
    }, [src])

    if (!src || hasError) {
        return (
            <div className={`bg-gray-200 rounded flex items-center justify-center ${fallbackClassName || className}`}>
                <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className={`bg-gray-100 rounded flex items-center justify-center ${fallbackClassName || className}`}>
                <div className="animate-pulse">
                    <ImageIcon className="h-8 w-8 text-gray-300" />
                </div>
            </div>
        )
    }

    return (
        <img
            src={correctedSrc || src}
            alt={alt}
            className={className}
        />
    )
}