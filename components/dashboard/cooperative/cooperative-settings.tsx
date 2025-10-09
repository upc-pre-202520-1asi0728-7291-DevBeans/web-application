"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export function CooperativeSettings() {
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Nombre de la Cooperativa</Label>
              <Input id="org-name" defaultValue="Cooperativa Cafetera del Sur" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-email">Correo Electrónico</Label>
              <Input id="org-email" type="email" defaultValue="info@cooperativa.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="org-phone">Teléfono</Label>
              <Input id="org-phone" defaultValue="+57 300 123 4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-nit">NIT / Registro Legal</Label>
              <Input id="org-nit" defaultValue="900.123.456-7" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-location">Ubicación</Label>
            <Input id="org-location" defaultValue="Manizales, Caldas" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-contact">Representante Legal</Label>
            <Input id="org-contact" defaultValue="María González" />
          </div>
          <Button className="bg-amber-700 hover:bg-amber-800">Guardar Cambios</Button>
        </CardContent>
      </Card>

      {/* Member Management */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Miembros</CardTitle>
          <CardDescription>Administra los permisos y roles de los miembros</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Permitir Auto-registro de Productores</Label>
              <p className="text-sm text-gray-500">Los productores pueden registrarse sin aprobación previa</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Requerir Aprobación de Lotes</Label>
              <p className="text-sm text-gray-500">Los lotes deben ser aprobados antes de la clasificación</p>
            </div>
            <Switch defaultChecked />
          </div>
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
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Calidad Baja</Label>
              <p className="text-sm text-gray-500">Notificar cuando un lote tiene calidad inferior al 70%</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificaciones de Nuevos Productores</Label>
              <p className="text-sm text-gray-500">Alertar cuando un nuevo productor se registra</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Features */}
      <Card>
        <CardHeader>
          <CardTitle>Funciones Avanzadas</CardTitle>
          <CardDescription>Configuración de características adicionales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Integración Blockchain</Label>
              <p className="text-sm text-gray-500">Habilitar trazabilidad con blockchain</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>API de Terceros</Label>
              <p className="text-sm text-gray-500">Permitir acceso a través de API externa</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
