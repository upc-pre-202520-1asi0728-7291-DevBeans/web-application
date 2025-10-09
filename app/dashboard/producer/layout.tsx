import type React from "react"
import { ProducerLayout } from "@/components/dashboard/producer/producer-layout"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProducerLayout>{children}</ProducerLayout>
}
