"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, UserPlus, Mail, Phone, MapPin } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const mockProducers = [
  {
    id: "1",
    name: "Juan Pérez",
    farm: "Finca El Cafetal",
    location: "Chinchiná, Caldas",
    phone: "+57 300 123 4567",
    email: "juan@email.com",
    batches: 12,
    quality: 92.5,
    status: "active",
  },
  {
    id: "2",
    name: "María González",
    farm: "La Esperanza",
    location: "Manizales, Caldas",
    phone: "+57 301 234 5678",
    email: "maria@email.com",
    batches: 10,
    quality: 89.3,
    status: "active",
  },
  {
    id: "3",
    name: "Carlos Rodríguez",
    farm: "Villa Rica",
    location: "Pereira, Risaralda",
    phone: "+57 302 345 6789",
    email: "carlos@email.com",
    batches: 9,
    quality: 87.8,
    status: "active",
  },
]

export function ProducerManagement() {
  const [producers] = useState(mockProducers)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProducers = producers.filter(
    (producer) =>
      producer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producer.farm.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Productores</h2>
          <p className="text-sm text-gray-500 mt-1">Administra los productores asociados a la cooperativa</p>
        </div>
        <Button className="bg-amber-700 hover:bg-amber-800">
          <UserPlus className="h-4 w-4 mr-2" />
          Agregar Productor
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar productores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Producers Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducers.map((producer) => (
          <Card key={producer.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-amber-100 text-amber-700 font-semibold">
                      {producer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{producer.name}</CardTitle>
                    <p className="text-sm text-gray-500">{producer.farm}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{producer.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{producer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{producer.email}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{producer.batches}</p>
                    <p className="text-xs text-gray-500">Lotes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{producer.quality}%</p>
                    <p className="text-xs text-gray-500">Calidad</p>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full bg-transparent">
                Ver Detalles
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
