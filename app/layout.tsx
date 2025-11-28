import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Suspense } from "react"
import "./globals.css"
import { AuthProvider } from "@/hooks/contexts/auth-context"
import { OfflineIndicator } from "@/components/offline-indicator"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
    title: "BeanDetect AI - Clasificación de Café con Inteligencia Artificial",
    description:
        "Tecnología de clasificación de café asequible para productores pequeños, medianos y cooperativas en América Latina",
    generator: "v0.app",
}

export default function RootLayout({children}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#78350f" />
            <title></title>
        </head>
        <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
                <Suspense fallback={null}>
                    {children}
                </Suspense>
                <OfflineIndicator />
                <Toaster />
            </AuthProvider>
        </ThemeProvider>
        <script
            dangerouslySetInnerHTML={{
                __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                      console.log('Service Worker registrado:', registration.scope);
                    })
                    .catch(error => {
                      console.error('Error al registrar Service Worker:', error);
                    });
                });
              } else {
                console.warn('Service Worker no soportado en este navegador');
              }
            `,
            }}
        />
        </body>
        </html>
    )
}