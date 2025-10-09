"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const mockBatches = [
  {
    id: "LOT-2024-001",
    date: "2024-01-15",
    weight: "500",
    variety: "Caturra",
    process: "Lavado",
    quality: "Premium",
    status: "Clasificado",
  },
  {
    id: "LOT-2024-002",
    date: "2024-01-14",
    weight: "450",
    variety: "Castillo",
    process: "Natural",
    quality: "Estándar",
    status: "En proceso",
  },
  {
    id: "LOT-2024-003",
    date: "2024-01-13",
    weight: "600",
    variety: "Colombia",
    process: "Honey",
    quality: "Premium",
    status: "Clasificado",
  },
]

export function BatchManagement() {
  const [batches] = useState(mockBatches)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const filteredBatches = batches.filter((batch) => batch.id.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Lotes</h2>
          <p className="text-sm text-gray-500 mt-1">Administra tus lotes de café</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-700 hover:bg-amber-800">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Lote
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Lote</DialogTitle>
              <DialogDescription>Ingresa la información del nuevo lote de café</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="batch-id">ID del Lote</Label>
                <Input id="batch-id" placeholder="LOT-2024-004" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Fecha de Cosecha</Label>
                  <Input id="date" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input id="weight" type="number" placeholder="500" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="variety">Variedad</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona variedad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caturra">Caturra</SelectItem>
                    <SelectItem value="castillo">Castillo</SelectItem>
                    <SelectItem value="colombia">Colombia</SelectItem>
                    <SelectItem value="typica">Typica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="process">Proceso</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona proceso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lavado">Lavado</SelectItem>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="honey">Honey</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button className="bg-amber-700 hover:bg-amber-800" onClick={() => setIsCreateOpen(false)}>
                Crear Lote
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar lotes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Batches List */}
      <Card>
        <CardHeader>
          <CardTitle>Lotes Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">ID Lote</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Fecha</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Peso</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Variedad</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Proceso</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Calidad</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Estado</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch) => (
                  <tr key={batch.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{batch.id}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{batch.date}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{batch.weight} kg</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{batch.variety}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{batch.process}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{batch.quality}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          batch.status === "Clasificado"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {batch.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
