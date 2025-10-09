import type React from "react"
import { CooperativeLayout } from "@/components/dashboard/cooperative/cooperative-layout"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <CooperativeLayout>{children}</CooperativeLayout>
}
