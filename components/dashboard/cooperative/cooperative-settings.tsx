"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/hooks/contexts/auth-context"
import { userService, type UpdateProfileData, type ChangePasswordData } from "@/lib/services/user.service"

export function CooperativeSettings() {
  const { user, profile, refreshProfile } = useAuth()

  // Estados de formularios
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    organization_name: "",
    city: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  // Estados de configuración de cooperativa (localStorage)
  const [cooperativeSettings, setCooperativeSettings] = useState({
    allowAutoRegistration: false,
    requireBatchApproval: true,
    enableBlockchain: false,
    enableExternalAPI: false,
  })

  // Estados de notificaciones (localStorage)
  const [notifications, setNotifications] = useState({
    dailySummary: true,
    lowQualityAlerts: true,
    newProducerAlerts: true,
  })

  // Estados de carga y mensajes
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isLoadingPassword, setIsLoadingPassword] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Cargar datos al montar
  useEffect(() => {
    if (profile && user) {
      // Type guard para manejar ambos tipos de perfil
      const isProducerProfile = 'first_name' in profile
      const isCooperativeProfile = 'cooperative_name' in profile

      setProfileForm({
        first_name: isProducerProfile ? profile.first_name :
            isCooperativeProfile ? (profile as any).legal_representative_name?.split(' ')[0] || '' : '',
        last_name: isProducerProfile ? profile.last_name :
            isCooperativeProfile ? (profile as any).legal_representative_name?.split(' ').slice(1).join(' ') || '' : '',
        phone_number: profile.phone_number || "",
        email: user.email,
        organization_name: isCooperativeProfile ? (profile as any).cooperative_name || '' : '',
        city: profile.city || "",
      })
    }

    // Cargar configuraciones de localStorage
    const savedCoopSettings = localStorage.getItem('cooperativeSettings')
    if (savedCoopSettings) {
      setCooperativeSettings(JSON.parse(savedCoopSettings))
    }

    const savedNotifications = localStorage.getItem('cooperativeNotifications')
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications))
    }
  }, [profile, user])

  // Actualizar perfil
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoadingProfile(true)
    setProfileMessage(null)

    try {
      const updateData: UpdateProfileData = {
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        phone_number: profileForm.phone_number,
        city: profileForm.city,
      }

      await userService.updateProfile(user.id, updateData)
      await refreshProfile()

      setProfileMessage({ type: 'success', text: 'Perfil actualizado exitosamente' })
      setTimeout(() => setProfileMessage(null), 5000)
    } catch (error) {
      setProfileMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'No se pudo actualizar el perfil'
      })
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Cambiar contraseña
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setPasswordMessage(null)

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage({ type: 'error', text: 'Las contraseñas no coinciden' })
      return
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordMessage({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres' })
      return
    }

    setIsLoadingPassword(true)

    try {
      const changePasswordData: ChangePasswordData = {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      }

      await userService.changePassword(user.id, changePasswordData)
      setPasswordMessage({ type: 'success', text: 'Contraseña actualizada exitosamente' })

      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      })

      setTimeout(() => setPasswordMessage(null), 5000)
    } catch (error) {
      setPasswordMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'No se pudo cambiar la contraseña'
      })
    } finally {
      setIsLoadingPassword(false)
    }
  }

  // Guardar configuraciones de cooperativa
  const handleCooperativeSettingChange = (key: keyof typeof cooperativeSettings) => {
    const newSettings = { ...cooperativeSettings, [key]: !cooperativeSettings[key] }
    setCooperativeSettings(newSettings)
    localStorage.setItem('cooperativeSettings', JSON.stringify(newSettings))
  }

  // Guardar notificaciones
  const handleNotificationChange = (key: keyof typeof notifications) => {
    const newNotifications = { ...notifications, [key]: !notifications[key] }
    setNotifications(newNotifications)
    localStorage.setItem('cooperativeNotifications', JSON.stringify(newNotifications))
  }

  if (!profile) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
    )
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
          <p className="text-sm text-gray-500 mt-1">Administra la configuración de la cooperativa</p>
        </div>

        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Organización</CardTitle>
            <CardDescription>Actualiza la información de la cooperativa</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {profileMessage && (
                  <Alert variant={profileMessage.type === 'error' ? 'destructive' : 'default'}>
                    {profileMessage.type === 'error' ? (
                        <AlertCircle className="h-4 w-4" />
                    ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    <AlertDescription>{profileMessage.text}</AlertDescription>
                  </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Nombre de la Cooperativa</Label>
                  <Input
                      id="org-name"
                      value={profileForm.organization_name}
                      onChange={(e) => setProfileForm({ ...profileForm, organization_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-email">Correo Electrónico</Label>
                  <Input
                      id="org-email"
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Representante Legal (Nombre)</Label>
                  <Input
                      id="first_name"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Representante Legal (Apellido)</Label>
                  <Input
                      id="last_name"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Teléfono</Label>
                  <Input
                      id="phone_number"
                      value={profileForm.phone_number}
                      onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                      required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ubicación</Label>
                  <Input
                      id="city"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      required
                  />
                </div>
              </div>

              <Button
                  type="submit"
                  className="bg-amber-700 hover:bg-amber-800"
                  disabled={isLoadingProfile}
              >
                {isLoadingProfile ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </form>
          </CardContent>
        </Card>



        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notificaciones Consolidadas</CardTitle>
            <CardDescription>Configura las notificaciones para administradores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Resumen Diario por Email</Label>
                <p className="text-sm text-gray-500">Recibe un resumen de actividad cada día</p>
              </div>
              <Switch
                  checked={notifications.dailySummary}
                  onCheckedChange={() => handleNotificationChange('dailySummary')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Calidad Baja</Label>
                <p className="text-sm text-gray-500">
                  Notificar cuando un lote tiene calidad inferior al 70%
                </p>
              </div>
              <Switch
                  checked={notifications.lowQualityAlerts}
                  onCheckedChange={() => handleNotificationChange('lowQualityAlerts')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones de Nuevos Productores</Label>
                <p className="text-sm text-gray-500">
                  Alertar cuando un nuevo productor se registra
                </p>
              </div>
              <Switch
                  checked={notifications.newProducerAlerts}
                  onCheckedChange={() => handleNotificationChange('newProducerAlerts')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Seguridad</CardTitle>
            <CardDescription>Administra tu contraseña y seguridad de la cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordMessage && (
                  <Alert variant={passwordMessage.type === 'error' ? 'destructive' : 'default'}>
                    {passwordMessage.type === 'error' ? (
                        <AlertCircle className="h-4 w-4" />
                    ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    <AlertDescription>{passwordMessage.text}</AlertDescription>
                  </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="current_password">Contraseña Actual</Label>
                <Input
                    id="current_password"
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">Nueva Contraseña</Label>
                <Input
                    id="new_password"
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmar Nueva Contraseña</Label>
                <Input
                    id="confirm_password"
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    required
                />
              </div>
              <Button
                  type="submit"
                  className="bg-amber-700 hover:bg-amber-800"
                  disabled={isLoadingPassword}
              >
                {isLoadingPassword ? "Cambiando..." : "Cambiar Contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
  )
}