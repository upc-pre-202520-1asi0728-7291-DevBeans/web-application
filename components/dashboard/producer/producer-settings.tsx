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
import { userService, type ProducerProfile, type UpdateProfileData, type ChangePasswordData } from "@/lib/services/user.service"

export function ProducerSettings() {
  const { user, profile, refreshProfile } = useAuth()
  const producerProfile = profile as ProducerProfile | null

  // Estados de formularios
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    farm_name: "",
    city: "",
    hectares: 0,
    production_capacity: 0,
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  // Estados de notificaciones y configuración (localStorage)
  const [notifications, setNotifications] = useState({
    email: true,
    whatsapp: true,
    classification: true,
  })

  const [systemSettings, setSystemSettings] = useState({
    offline: false,
    autoSync: true,
  })

  // Estados de carga y mensajes
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isLoadingPassword, setIsLoadingPassword] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Cargar datos del perfil al montar
  useEffect(() => {
    if (producerProfile) {
      setProfileForm({
        first_name: producerProfile.first_name,
        last_name: producerProfile.last_name,
        phone_number: producerProfile.phone_number,
        farm_name: producerProfile.farm_name,
        city: producerProfile.city,
        hectares: producerProfile.hectares,
        production_capacity: producerProfile.production_capacity || 0,
      })
    }

    // Cargar preferencias de localStorage
    const savedNotifications = localStorage.getItem('notifications')
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications))
    }

    const savedSystemSettings = localStorage.getItem('systemSettings')
    if (savedSystemSettings) {
      setSystemSettings(JSON.parse(savedSystemSettings))
    }
  }, [producerProfile])

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
        farm_name: profileForm.farm_name,
        city: profileForm.city,
        hectares: profileForm.hectares,
        production_capacity: profileForm.production_capacity || undefined,
      }

      await userService.updateProfile(user.id, updateData)
      await refreshProfile()

      setProfileMessage({ type: 'success', text: 'Perfil actualizado exitosamente' })

      // Limpiar mensaje después de 5 segundos
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

    // Validaciones
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

      // Limpiar formulario
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      })

      // Limpiar mensaje después de 5 segundos
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

  // Gestionar notificaciones
  const handleNotificationChange = (key: keyof typeof notifications) => {
    const newNotifications = { ...notifications, [key]: !notifications[key] }
    setNotifications(newNotifications)
    localStorage.setItem('notifications', JSON.stringify(newNotifications))
  }

  // Gestionar configuración del sistema
  const handleSystemSettingChange = (key: keyof typeof systemSettings) => {
    const newSettings = { ...systemSettings, [key]: !systemSettings[key] }
    setSystemSettings(newSettings)
    localStorage.setItem('systemSettings', JSON.stringify(newSettings))
  }

  if (!producerProfile) {
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
          <p className="text-sm text-gray-500 mt-1">Administra tu perfil y preferencias</p>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Actualiza tu información de perfil</CardDescription>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input
                      id="first_name"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellido</Label>
                  <Input
                      id="last_name"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Teléfono / WhatsApp</Label>
                  <Input
                      id="phone_number"
                      value={profileForm.phone_number}
                      onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                      required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="farm_name">Nombre de la Finca</Label>
                  <Input
                      id="farm_name"
                      value={profileForm.farm_name}
                      onChange={(e) => setProfileForm({ ...profileForm, farm_name: e.target.value })}
                      required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                      id="city"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hectares">Hectáreas</Label>
                  <Input
                      id="hectares"
                      type="number"
                      step="0.01"
                      value={profileForm.hectares}
                      onChange={(e) => setProfileForm({ ...profileForm, hectares: parseFloat(e.target.value) || 0 })}
                      required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="production_capacity">Capacidad de Producción (kg/año)</Label>
                  <Input
                      id="production_capacity"
                      type="number"
                      value={profileForm.production_capacity}
                      onChange={(e) => setProfileForm({ ...profileForm, production_capacity: parseInt(e.target.value) || 0 })}
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
            <CardTitle>Notificaciones</CardTitle>
            <CardDescription>Configura cómo quieres recibir notificaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info sobre email */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                Los reportes por email se enviarán a: <strong>{user?.email}</strong>
                <br />
                <span className="text-xs">El administrador debe configurar el servidor SMTP en el backend para habilitar el envío automático.</span>
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones por Email</Label>
                <p className="text-sm text-gray-500">Recibe actualizaciones por correo electrónico</p>
              </div>
              <Switch
                  checked={notifications.email}
                  onCheckedChange={() => handleNotificationChange('email')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compartir por WhatsApp</Label>
                <p className="text-sm text-gray-500">Habilitar botón de compartir reportes en WhatsApp</p>
              </div>
              <Switch
                  checked={notifications.whatsapp}
                  onCheckedChange={() => handleNotificationChange('whatsapp')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Clasificación</Label>
                <p className="text-sm text-gray-500">Notificar cuando se complete una clasificación</p>
              </div>
              <Switch
                  checked={notifications.classification}
                  onCheckedChange={() => handleNotificationChange('classification')}
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

        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración del Sistema</CardTitle>
            <CardDescription>Ajusta las preferencias de la aplicación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo Offline</Label>
                <p className="text-sm text-gray-500">Permite usar la app sin conexión a internet</p>
              </div>
              <Switch
                  checked={systemSettings.offline}
                  onCheckedChange={() => handleSystemSettingChange('offline')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sincronización Automática</Label>
                <p className="text-sm text-gray-500">Sincroniza datos automáticamente cuando hay conexión</p>
              </div>
              <Switch
                  checked={systemSettings.autoSync}
                  onCheckedChange={() => handleSystemSettingChange('autoSync')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
  )
}