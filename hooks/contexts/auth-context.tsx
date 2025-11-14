"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authService, type UserResource } from '@/lib/services/auth.service'
import { userService, type ProducerProfile, type CooperativeProfile } from '@/lib/services/user.service'

interface AuthContextType {
    user: UserResource | null
    profile: ProducerProfile | CooperativeProfile | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    refreshProfile: () => Promise<void>
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserResource | null>(null)
    const [profile, setProfile] = useState<ProducerProfile | CooperativeProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    // Cargar datos del usuario al montar el componente
    const loadUserData = async () => {
        try {
            const savedUser = authService.getUser()
            const token = authService.getToken()

            if (token && savedUser) {
                setUser(savedUser)

                // Cargar perfil desde el backend
                const profileData = await userService.getProfile(savedUser.id)
                setProfile(profileData)
            }
        } catch (error) {
            console.error('Error loading user data:', error)
            // Si hay error, limpiar todo
            authService.logout()
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUserData()
    }, [])

    // Login: usa authService y luego carga el perfil con userService
    const login = async (email: string, password: string) => {
        setLoading(true)
        try {
            const response = await authService.login({ email, password })

            // Guardar token y usuario
            authService.saveToken(response.access_token)
            authService.saveUser(response.user)

            setUser(response.user)

            // Cargar perfil completo
            const profileData = await userService.getProfile(response.user.id)
            setProfile(profileData)

            // Redirigir según tipo de usuario
            if (response.user.user_type === 'PRODUCER') {
                router.push('/dashboard/producer')
            } else {
                router.push('/dashboard/cooperative')
            }
        } catch (error) {
            throw error
        } finally {
            setLoading(false)
        }
    }

    // Logout: limpia todo
    const logout = async () => {
        try {
            authService.logout()
        } finally {
            setUser(null)
            setProfile(null)
            router.push('/login')
        }
    }

    // Recargar perfil después de actualizaciones
    const refreshProfile = async () => {
        if (user) {
            try {
                const profileData = await userService.getProfile(user.id)
                setProfile(profileData)
            } catch (error) {
                console.error('Error refreshing profile:', error)
            }
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                login,
                logout,
                refreshProfile,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}