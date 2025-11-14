"use client"

import { useState, useEffect } from "react"
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
import { Plus, Search, Edit, Trash2, Eye, AlertCircle, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  coffeeLotService,
  CoffeeVariety,
  ProcessingMethod,
  type CoffeeLot,
  type RegisterCoffeeLotData,
  type UpdateCoffeeLotData
} from "@/lib/services/coffee-lot.service"
import { authService } from "@/lib/services/auth.service"

export function BatchManagement() {
  const [batches, setBatches] = useState<CoffeeLot[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [selectedLot, setSelectedLot] = useState<CoffeeLot | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Datos del formulario de creación
  const [newLotData, setNewLotData] = useState({
    harvest_date: "",
    coffee_variety: "",
    quantity: 0,
    processing_method: "",
    latitude: -12.0464,
    longitude: -77.0428,
    altitude: 0,
    soil_type: "",
    climate_zone: "",
    farm_section: ""
  })

  // Datos del formulario de edición
  const [editLotData, setEditLotData] = useState<UpdateCoffeeLotData>({
    quantity: 0,
    processing_method: undefined,
    altitude: 0,
  })

  const [deletionReason, setDeletionReason] = useState("")

  // Cargar lotes al montar el componente
  useEffect(() => {
    loadBatches()
  }, [])

  const loadBatches = async () => {
    setIsLoading(true)
    setError("")

    try {
      const user = authService.getUser()
      if (!user) {
        setError("No se encontró información del usuario")
        return
      }

      const lots = await coffeeLotService.getLotsByProducer(user.id)
      setBatches(lots)
    } catch (err: any) {
      setError(err.message || "Error al cargar los lotes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateLot = async () => {
    setError("")

    if (!newLotData.harvest_date || !newLotData.coffee_variety || !newLotData.processing_method || newLotData.quantity <= 0) {
      setError("Por favor completa todos los campos obligatorios")
      return
    }

    setIsLoading(true)

    try {
      const user = authService.getUser()
      if (!user) {
        setError("No se encontró información del usuario")
        return
      }

      const lotData: RegisterCoffeeLotData = {
        producer_id: user.id,
        harvest_date: newLotData.harvest_date,
        coffee_variety: newLotData.coffee_variety as CoffeeVariety,
        quantity: newLotData.quantity,
        processing_method: newLotData.processing_method as ProcessingMethod,
        latitude: newLotData.latitude,
        longitude: newLotData.longitude,
        altitude: newLotData.altitude || undefined,
        soil_type: newLotData.soil_type || undefined,
        climate_zone: newLotData.climate_zone || undefined,
        farm_section: newLotData.farm_section || undefined
      }

      await coffeeLotService.registerLot(lotData)

      // Resetear formulario
      setNewLotData({
        harvest_date: "",
        coffee_variety: "",
        quantity: 0,
        processing_method: "",
        latitude: -12.0464,
        longitude: -77.0428,
        altitude: 0,
        soil_type: "",
        climate_zone: "",
        farm_section: ""
      })

      setIsCreateOpen(false)
      loadBatches() // Recargar lista
    } catch (err: any) {
      setError(err.message || "Error al crear el lote")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditLot = async () => {
    if (!selectedLot) return

    setError("")
    setIsLoading(true)

    try {
      await coffeeLotService.updateLot(selectedLot.id, editLotData)
      setIsEditOpen(false)
      setSelectedLot(null)
      loadBatches() // Recargar lista
    } catch (err: any) {
      setError(err.message || "Error al actualizar el lote")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteLot = async () => {
    if (!selectedLot) return

    if (!deletionReason.trim()) {
      setError("Por favor proporciona una razón para la eliminación")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      await coffeeLotService.deleteLot(selectedLot.id, deletionReason)
      setIsDeleteOpen(false)
      setSelectedLot(null)
      setDeletionReason("")
      loadBatches() // Recargar lista
    } catch (err: any) {
      setError(err.message || "Error al eliminar el lote")
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (lot: CoffeeLot) => {
    setSelectedLot(lot)
    setEditLotData({
      quantity: lot.quantity,
      processing_method: lot.processing_method as ProcessingMethod,
      altitude: lot.altitude
    })
    setIsEditOpen(true)
  }

  const openDeleteDialog = (lot: CoffeeLot) => {
    setSelectedLot(lot)
    setIsDeleteOpen(true)
  }

  const filteredBatches = batches.filter((batch) =>
      batch.lot_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Mapeo de nombres en español
  const varietyNames: Record<string, string> = {
    TYPICA: "Typica",
    CATURRA: "Caturra",
    BOURBON: "Bourbon",
    GEISHA: "Geisha",
    SL28: "SL28",
    SL34: "SL34",
    CASTILLO: "Castillo",
    COLOMBIA: "Colombia"
  }

  const processNames: Record<string, string> = {
    WASHED: "Lavado",
    NATURAL: "Natural",
    HONEY: "Honey",
    SEMI_WASHED: "Semi-lavado"
  }

  const statusNames: Record<string, string> = {
    REGISTERED: "Registrado",
    PROCESSING: "En proceso",
    CLASSIFIED: "Clasificado",
    CERTIFIED: "Certificado",
    SHIPPED: "Enviado"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REGISTERED":
        return "bg-blue-100 text-blue-800"
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800"
      case "CLASSIFIED":
        return "bg-green-100 text-green-800"
      case "CERTIFIED":
        return "bg-purple-100 text-purple-800"
      case "SHIPPED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

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
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Lote</DialogTitle>
                <DialogDescription>Ingresa la información del nuevo lote de café</DialogDescription>
              </DialogHeader>

              {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="harvest-date">Fecha de Cosecha *</Label>
                    <Input
                        id="harvest-date"
                        type="date"
                        value={newLotData.harvest_date}
                        onChange={(e) => setNewLotData({...newLotData, harvest_date: e.target.value})}
                        required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Cantidad (kg) *</Label>
                    <Input
                        id="quantity"
                        type="number"
                        placeholder="500"
                        value={newLotData.quantity || ""}
                        onChange={(e) => setNewLotData({...newLotData, quantity: parseFloat(e.target.value) || 0})}
                        required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="variety">Variedad de Café *</Label>
                  <Select value={newLotData.coffee_variety} onValueChange={(v) => setNewLotData({...newLotData, coffee_variety: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona variedad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TYPICA">Typica</SelectItem>
                      <SelectItem value="CATURRA">Caturra</SelectItem>
                      <SelectItem value="BOURBON">Bourbon</SelectItem>
                      <SelectItem value="GEISHA">Geisha</SelectItem>
                      <SelectItem value="SL28">SL28</SelectItem>
                      <SelectItem value="SL34">SL34</SelectItem>
                      <SelectItem value="CASTILLO">Castillo</SelectItem>
                      <SelectItem value="COLOMBIA">Colombia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="process">Método de Procesamiento *</Label>
                  <Select value={newLotData.processing_method} onValueChange={(v) => setNewLotData({...newLotData, processing_method: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WASHED">Lavado</SelectItem>
                      <SelectItem value="NATURAL">Natural</SelectItem>
                      <SelectItem value="HONEY">Honey</SelectItem>
                      <SelectItem value="SEMI_WASHED">Semi-lavado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="altitude">Altitud (m)</Label>
                    <Input
                        id="altitude"
                        type="number"
                        placeholder="1500"
                        value={newLotData.altitude || ""}
                        onChange={(e) => setNewLotData({...newLotData, altitude: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="latitude">Latitud *</Label>
                    <Input
                        id="latitude"
                        type="number"
                        step="0.000001"
                        placeholder="-12.0464"
                        value={newLotData.latitude}
                        onChange={(e) => setNewLotData({...newLotData, latitude: parseFloat(e.target.value)})}
                        required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="longitude">Longitud *</Label>
                    <Input
                        id="longitude"
                        type="number"
                        step="0.000001"
                        placeholder="-77.0428"
                        value={newLotData.longitude}
                        onChange={(e) => setNewLotData({...newLotData, longitude: parseFloat(e.target.value)})}
                        required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="soil-type">Tipo de Suelo</Label>
                  <Input
                      id="soil-type"
                      placeholder="Arcilloso, franco, etc."
                      value={newLotData.soil_type}
                      onChange={(e) => setNewLotData({...newLotData, soil_type: e.target.value})}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="climate-zone">Zona Climática</Label>
                  <Input
                      id="climate-zone"
                      placeholder="Tropical, templado, etc."
                      value={newLotData.climate_zone}
                      onChange={(e) => setNewLotData({...newLotData, climate_zone: e.target.value})}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="farm-section">Sección de Finca</Label>
                  <Input
                      id="farm-section"
                      placeholder="Lote A, Sector Norte, etc."
                      value={newLotData.farm_section}
                      onChange={(e) => setNewLotData({...newLotData, farm_section: e.target.value})}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button
                    className="bg-amber-700 hover:bg-amber-800"
                    onClick={handleCreateLot}
                    disabled={isLoading}
                >
                  {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando...
                      </>
                  ) : (
                      "Crear Lote"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Error global */}
        {error && !isCreateOpen && !isEditOpen && !isDeleteOpen && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

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
            {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
                </div>
            ) : filteredBatches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay lotes registrados
                </div>
            ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">ID Lote</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Fecha</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Variedad</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Proceso</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Estado</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredBatches.map((batch) => (
                        <tr key={batch.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{batch.lot_number}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(batch.harvest_date).toLocaleDateString('es-PE')}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {varietyNames[batch.coffee_variety] || batch.coffee_variety}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {processNames[batch.processing_method] || batch.processing_method}
                          </td>
                          <td className="py-3 px-4">
                        <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(batch.status)}`}
                        >
                          {statusNames[batch.status] || batch.status}
                        </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" disabled title="Próximamente">
                                <Eye className="h-4 w-4 text-gray-400" />
                              </Button>
                              <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(batch)}
                                  disabled={batch.status !== "REGISTERED"}
                                  title={batch.status !== "REGISTERED" ? "Solo se pueden editar lotes registrados" : "Editar"}
                              >
                                <Edit className={`h-4 w-4 ${batch.status !== "REGISTERED" ? "text-gray-400" : ""}`} />
                              </Button>
                              <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteDialog(batch)}
                                  disabled={batch.status !== "REGISTERED"}
                                  title={batch.status !== "REGISTERED" ? "Solo se pueden eliminar lotes registrados" : "Eliminar"}
                              >
                                <Trash2 className={`h-4 w-4 ${batch.status !== "REGISTERED" ? "text-gray-400" : "text-red-600"}`} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Lote</DialogTitle>
              <DialogDescription>
                Modifica la información del lote {selectedLot?.lot_number}
              </DialogDescription>
            </DialogHeader>

            {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-quantity">Cantidad (kg)</Label>
                <Input
                    id="edit-quantity"
                    type="number"
                    value={editLotData.quantity || ""}
                    onChange={(e) => setEditLotData({...editLotData, quantity: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-process">Método de Procesamiento</Label>
                <Select
                    value={editLotData.processing_method}
                    onValueChange={(v) => setEditLotData({...editLotData, processing_method: v as ProcessingMethod})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WASHED">Lavado</SelectItem>
                    <SelectItem value="NATURAL">Natural</SelectItem>
                    <SelectItem value="HONEY">Honey</SelectItem>
                    <SelectItem value="SEMI_WASHED">Semi-lavado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-altitude">Altitud (m)</Label>
                <Input
                    id="edit-altitude"
                    type="number"
                    value={editLotData.altitude || ""}
                    onChange={(e) => setEditLotData({...editLotData, altitude: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                  className="bg-amber-700 hover:bg-amber-800"
                  onClick={handleEditLot}
                  disabled={isLoading}
              >
                {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                ) : (
                    "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Lote</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar el lote {selectedLot?.lot_number}?
              </DialogDescription>
            </DialogHeader>

            {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="deletion-reason">Razón de eliminación *</Label>
                <Input
                    id="deletion-reason"
                    placeholder="Ej: Error en el registro"
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    required
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                  variant="destructive"
                  onClick={handleDeleteLot}
                  disabled={isLoading}
              >
                {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                ) : (
                    "Eliminar Lote"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}