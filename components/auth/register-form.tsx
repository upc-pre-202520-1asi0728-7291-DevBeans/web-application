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
import { Coffee, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authService, type RegisterProducerData, type RegisterCooperativeData } from "@/lib/services/auth.service"

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [accountType, setAccountType] = useState<"producer" | "cooperative">("producer")
  const [error, setError] = useState<string>("")

  // Estados para productor
  const [producerData, setProducerData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    document_number: "",
    document_type: "DNI",
    phone_number: "",
    city: "",
    farm_name: "",
    region: "",
    latitude: -12.0464,
    longitude: -77.0428,
    altitude: 0,
    hectares: 0,
    production_capacity: 0
  })

  // Estados para cooperativa
  const [cooperativeData, setCooperativeData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    cooperative_name: "",
    legal_registration_number: "",
    phone_number: "",
    address: "",
    city: "",
    legal_representative_name: "",
    legal_representative_email: "",
    processing_capacity: 0
  })

  const handleProducerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (producerData.password !== producerData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (producerData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    setIsLoading(true)

    try {
      const registerData: RegisterProducerData = {
        email: producerData.email,
        password: producerData.password,
        first_name: producerData.first_name,
        last_name: producerData.last_name,
        document_number: producerData.document_number,
        document_type: producerData.document_type,
        phone_number: producerData.phone_number,
        city: producerData.city,
        country: "Perú",
        farm_name: producerData.farm_name,
        latitude: producerData.latitude,
        longitude: producerData.longitude,
        altitude: producerData.altitude || undefined,
        region: producerData.region,
        hectares: producerData.hectares,
        production_capacity: producerData.production_capacity || undefined
      }

      const user = await authService.registerProducer(registerData)

      // Ahora hacer login automático
      const loginResponse = await authService.login({
        email: producerData.email,
        password: producerData.password
      })

      authService.saveToken(loginResponse.access_token)
      authService.saveUser(loginResponse.user)

      router.push("/dashboard/producer")
    } catch (err: any) {
      setError(err.message || "Error al registrar. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCooperativeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (cooperativeData.password !== cooperativeData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (cooperativeData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    setIsLoading(true)

    try {
      const registerData: RegisterCooperativeData = {
        email: cooperativeData.email,
        password: cooperativeData.password,
        cooperative_name: cooperativeData.cooperative_name,
        legal_registration_number: cooperativeData.legal_registration_number,
        phone_number: cooperativeData.phone_number,
        address: cooperativeData.address,
        city: cooperativeData.city,
        country: "Perú",
        legal_representative_name: cooperativeData.legal_representative_name,
        legal_representative_email: cooperativeData.legal_representative_email,
        processing_capacity: cooperativeData.processing_capacity || undefined
      }

      const user = await authService.registerCooperative(registerData)

      // Ahora hacer login automático
      const loginResponse = await authService.login({
        email: cooperativeData.email,
        password: cooperativeData.password
      })

      authService.saveToken(loginResponse.access_token)
      authService.saveUser(loginResponse.user)

      router.push("/dashboard/cooperative")
    } catch (err: any) {
      setError(err.message || "Error al registrar. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
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
          {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}

          <Tabs value={accountType} onValueChange={(v) => setAccountType(v as "producer" | "cooperative")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="producer">Productor</TabsTrigger>
              <TabsTrigger value="cooperative">Cooperativa</TabsTrigger>
            </TabsList>

            <TabsContent value="producer">
              <form onSubmit={handleProducerSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="producer-first-name">Nombre</Label>
                    <Input
                        id="producer-first-name"
                        placeholder="Juan"
                        value={producerData.first_name}
                        onChange={(e) => setProducerData({...producerData, first_name: e.target.value})}
                        required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="producer-last-name">Apellido</Label>
                    <Input
                        id="producer-last-name"
                        placeholder="Pérez"
                        value={producerData.last_name}
                        onChange={(e) => setProducerData({...producerData, last_name: e.target.value})}
                        required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="producer-email">Correo Electrónico</Label>
                    <Input
                        id="producer-email"
                        type="email"
                        placeholder="juan@email.com"
                        value={producerData.email}
                        onChange={(e) => setProducerData({...producerData, email: e.target.value})}
                        required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="producer-phone">Teléfono / WhatsApp</Label>
                    <Input
                        id="producer-phone"
                        type="tel"
                        placeholder="+51 987 654 321"
                        value={producerData.phone_number}
                        onChange={(e) => setProducerData({...producerData, phone_number: e.target.value})}
                        required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="producer-document">Documento de Identidad</Label>
                    <Input
                        id="producer-document"
                        placeholder="12345678"
                        value={producerData.document_number}
                        onChange={(e) => setProducerData({...producerData, document_number: e.target.value})}
                        required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="producer-farm">Nombre de la Finca</Label>
                    <Input
                        id="producer-farm"
                        placeholder="Finca El Cafetal"
                        value={producerData.farm_name}
                        onChange={(e) => setProducerData({...producerData, farm_name: e.target.value})}
                        required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="producer-city">Ciudad</Label>
                    <Input
                        id="producer-city"
                        placeholder="Lima"
                        value={producerData.city}
                        onChange={(e) => setProducerData({...producerData, city: e.target.value})}
                        required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="producer-region">Región</Label>
                    <Input
                        id="producer-region"
                        placeholder="Cajamarca"
                        value={producerData.region}
                        onChange={(e) => setProducerData({...producerData, region: e.target.value})}
                        required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="producer-hectares">Hectáreas</Label>
                    <Input
                        id="producer-hectares"
                        type="number"
                        step="0.1"
                        placeholder="5.0"
                        value={producerData.hectares || ""}
                        onChange={(e) => setProducerData({...producerData, hectares: parseFloat(e.target.value) || 0})}
                        required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="producer-altitude">Altitud (m)</Label>
                    <Input
                        id="producer-altitude"
                        type="number"
                        placeholder="1500"
                        value={producerData.altitude || ""}
                        onChange={(e) => setProducerData({...producerData, altitude: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="producer-password">Contraseña</Label>
                    <Input
                        id="producer-password"
                        type="password"
                        placeholder="••••••••"
                        value={producerData.password}
                        onChange={(e) => setProducerData({...producerData, password: e.target.value})}
                        required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="producer-confirm">Confirmar Contraseña</Label>
                    <Input
                        id="producer-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={producerData.confirmPassword}
                        onChange={(e) => setProducerData({...producerData, confirmPassword: e.target.value})}
                        required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-amber-700 hover:bg-amber-800" disabled={isLoading}>
                  {isLoading ? "Creando cuenta..." : "Crear Cuenta de Productor"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="cooperative">
              <form onSubmit={handleCooperativeSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coop-name">Nombre de la Cooperativa</Label>
                    <Input
                        id="coop-name"
                        placeholder="Cooperativa Cafetera del Sur"
                        value={cooperativeData.cooperative_name}
                        onChange={(e) => setCooperativeData({...cooperativeData, cooperative_name: e.target.value})}
                        required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coop-email">Correo Electrónico</Label>
                    <Input
                        id="coop-email"
                        type="email"
                        placeholder="info@cooperativa.com"
                        value={cooperativeData.email}
                        onChange={(e) => setCooperativeData({...cooperativeData, email: e.target.value})}
                        required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coop-phone">Teléfono</Label>
                    <Input
                        id="coop-phone"
                        type="tel"
                        placeholder="+51 987 654 321"
                        value={cooperativeData.phone_number}
                        onChange={(e) => setCooperativeData({...cooperativeData, phone_number: e.target.value})}
                        required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coop-nit">RUC / Registro Legal</Label>
                    <Input
                        id="coop-nit"
                        placeholder="20123456789"
                        value={cooperativeData.legal_registration_number}
                        onChange={(e) => setCooperativeData({...cooperativeData, legal_registration_number: e.target.value})}
                        required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coop-address">Dirección</Label>
                  <Input
                      id="coop-address"
                      placeholder="Av. Principal 123"
                      value={cooperativeData.address}
                      onChange={(e) => setCooperativeData({...cooperativeData, address: e.target.value})}
                      required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coop-city">Ciudad</Label>
                  <Input
                      id="coop-city"
                      placeholder="Lima"
                      value={cooperativeData.city}
                      onChange={(e) => setCooperativeData({...cooperativeData, city: e.target.value})}
                      required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coop-contact">Nombre del Representante Legal</Label>
                    <Input
                        id="coop-contact"
                        placeholder="María González"
                        value={cooperativeData.legal_representative_name}
                        onChange={(e) => setCooperativeData({...cooperativeData, legal_representative_name: e.target.value})}
                        required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coop-rep-email">Email del Representante</Label>
                    <Input
                        id="coop-rep-email"
                        type="email"
                        placeholder="maria@email.com"
                        value={cooperativeData.legal_representative_email}
                        onChange={(e) => setCooperativeData({...cooperativeData, legal_representative_email: e.target.value})}
                        required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coop-password">Contraseña</Label>
                    <Input
                        id="coop-password"
                        type="password"
                        placeholder="••••••••"
                        value={cooperativeData.password}
                        onChange={(e) => setCooperativeData({...cooperativeData, password: e.target.value})}
                        required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coop-confirm">Confirmar Contraseña</Label>
                    <Input
                        id="coop-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={cooperativeData.confirmPassword}
                        onChange={(e) => setCooperativeData({...cooperativeData, confirmPassword: e.target.value})}
                        required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-amber-700 hover:bg-amber-800" disabled={isLoading}>
                  {isLoading ? "Creando cuenta..." : "Crear Cuenta de Cooperativa"}
                </Button>
              </form>
            </TabsContent>
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