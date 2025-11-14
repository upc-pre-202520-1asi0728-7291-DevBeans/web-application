"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/contexts/auth-context"
import { Coffee } from "lucide-react"

interface ProtectedRouteProps {
    children: React.ReactNode
    allowedUserTypes?: ("PRODUCER" | "COOPERATIVE")[]
}

export function ProtectedRoute({ children, allowedUserTypes }: ProtectedRouteProps) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // Si no está cargando y no hay usuario, redirigir a login
        if (!loading && !user) {
            router.push("/login")
        }

        // Si hay usuario pero no tiene permiso para este tipo de ruta
        if (!loading && user && allowedUserTypes && !allowedUserTypes.includes(user.user_type)) {
            // Redirigir al dashboard correcto según el tipo de usuario
            if (user.user_type === "PRODUCER") {
                router.push("/dashboard/producer")
            } else {
                router.push("/dashboard/cooperative")
            }
        }
    }, [user, loading, router, allowedUserTypes])

    // Mostrar loading mientras se verifica la autenticación
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Coffee className="h-12 w-12 text-amber-700 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        )
    }

    // Si no hay usuario o no tiene los permisos correctos, no renderizar nada
    // (el useEffect se encargará de la redirección)
    if (!user || (allowedUserTypes && !allowedUserTypes.includes(user.user_type))) {
        return null
    }

    // Si todo está bien, renderizar los children
    return <>{children}</>
}