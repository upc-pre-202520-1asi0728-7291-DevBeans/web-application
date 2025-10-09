"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Coffee, LayoutDashboard, Users, Package, FileText, Settings, Menu, LogOut } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard/cooperative", icon: LayoutDashboard },
  { name: "Productores", href: "/dashboard/cooperative/producers", icon: Users },
  { name: "Lotes", href: "/dashboard/cooperative/batches", icon: Package },
  { name: "Reportes", href: "/dashboard/cooperative/reports", icon: FileText },
  { name: "Configuración", href: "/dashboard/cooperative/settings", icon: Settings },
]

export function CooperativeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
            <Coffee className="h-8 w-8 text-amber-700" />
            <span className="text-xl font-bold text-gray-900">BeanDetect AI</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-amber-50 text-amber-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-900">Cooperativa Cafetera del Sur</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-gray-700 hover:text-gray-900 bg-transparent"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:px-8">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {navigation.find((item) => item.href === pathname)?.name || "Dashboard"}
          </h1>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
