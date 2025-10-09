"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coffee } from "lucide-react"

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [accountType, setAccountType] = useState<"producer" | "cooperative">("producer")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate registration
    setTimeout(() => {
      if (accountType === "cooperative") {
        router.push("/dashboard/cooperative")
      } else {
        router.push("/dashboard/producer")
      }
    }, 1000)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-amber-100 rounded-full">
            <Coffee className="h-8 w-8 text-amber-700" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
        <CardDescription>Regístrate en BeanDetect AI para comenzar</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={accountType} onValueChange={(v) => setAccountType(v as "producer" | "cooperative")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="producer">Productor</TabsTrigger>
            <TabsTrigger value="cooperative">Cooperativa</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="producer" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="producer-name">Nombre Completo</Label>
                  <Input id="producer-name" placeholder="Juan Pérez" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="producer-email">Correo Electrónico</Label>
                  <Input id="producer-email" type="email" placeholder="juan@email.com" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="producer-phone">Teléfono / WhatsApp</Label>
                  <Input id="producer-phone" type="tel" placeholder="+57 300 123 4567" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="producer-farm">Nombre de la Finca</Label>
                  <Input id="producer-farm" placeholder="Finca El Cafetal" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="producer-location">Ubicación (Municipio, Departamento)</Label>
                <Input id="producer-location" placeholder="Chinchiná, Caldas" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="producer-password">Contraseña</Label>
                  <Input id="producer-password" type="password" placeholder="••••••••" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="producer-confirm">Confirmar Contraseña</Label>
                  <Input id="producer-confirm" type="password" placeholder="••••••••" required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-amber-700 hover:bg-amber-800" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Crear Cuenta de Productor"}
              </Button>
            </TabsContent>

            <TabsContent value="cooperative" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coop-name">Nombre de la Cooperativa</Label>
                  <Input id="coop-name" placeholder="Cooperativa Cafetera del Sur" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coop-email">Correo Electrónico</Label>
                  <Input id="coop-email" type="email" placeholder="info@cooperativa.com" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coop-phone">Teléfono</Label>
                  <Input id="coop-phone" type="tel" placeholder="+57 300 123 4567" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coop-nit">NIT / Registro Legal</Label>
                  <Input id="coop-nit" placeholder="900.123.456-7" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coop-location">Ubicación (Municipio, Departamento)</Label>
                <Input id="coop-location" placeholder="Manizales, Caldas" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coop-contact">Nombre del Representante Legal</Label>
                <Input id="coop-contact" placeholder="María González" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coop-password">Contraseña</Label>
                  <Input id="coop-password" type="password" placeholder="••••••••" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coop-confirm">Confirmar Contraseña</Label>
                  <Input id="coop-confirm" type="password" placeholder="••••••••" required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-amber-700 hover:bg-amber-800" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Crear Cuenta de Cooperativa"}
              </Button>
            </TabsContent>
          </form>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-center text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-amber-700 hover:underline font-medium">
            Inicia sesión aquí
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
