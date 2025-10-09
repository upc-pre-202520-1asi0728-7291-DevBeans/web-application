"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export function ProducerSettings() {
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input id="name" defaultValue="Juan Pérez" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" defaultValue="juan@email.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono / WhatsApp</Label>
              <Input id="phone" defaultValue="+57 300 123 4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm">Nombre de la Finca</Label>
              <Input id="farm" defaultValue="Finca El Cafetal" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Ubicación</Label>
            <Input id="location" defaultValue="Chinchiná, Caldas" />
          </div>
          <Button className="bg-amber-700 hover:bg-amber-800">Guardar Cambios</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>Configura cómo quieres recibir notificaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificaciones por Email</Label>
              <p className="text-sm text-gray-500">Recibe actualizaciones por correo electrónico</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificaciones por WhatsApp</Label>
              <p className="text-sm text-gray-500">Recibe alertas importantes por WhatsApp</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Clasificación</Label>
              <p className="text-sm text-gray-500">Notificar cuando se complete una clasificación</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>Administra tu contraseña y seguridad de la cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Contraseña Actual</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva Contraseña</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <Button className="bg-amber-700 hover:bg-amber-800">Cambiar Contraseña</Button>
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
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sincronización Automática</Label>
              <p className="text-sm text-gray-500">Sincroniza datos automáticamente cuando hay conexión</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
