import type React from "react"
import { ProducerLayout } from "@/components/dashboard/producer/producer-layout"
import { ProtectedRoute } from "@/components/protected-route"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
      <ProtectedRoute allowedUserTypes={["PRODUCER"]}>
        <ProducerLayout>{children}</ProducerLayout>
      </ProtectedRoute>
  )
}