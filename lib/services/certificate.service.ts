// lib/services/certificate.service.ts
// Versión consolidada - Genera certificados por LOTE (no por sesión)

// @ts-ignore
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ClassificationSession, GrainAnalysis } from './classification.service'

// Interfaz para datos consolidados del lote
interface ConsolidatedLotData {
    coffeeLotId: number
    totalSessions: number
    totalGrainsAnalyzed: number
    averageQuality: number
    categoryDistribution: {
        Specialty: { count: number; percentage: number }
        Premium: { count: number; percentage: number }
        A: { count: number; percentage: number }
        B: { count: number; percentage: number }
        C: { count: number; percentage: number }
    }
    predominantCategory: string
    allAnalyses: GrainAnalysis[]
    sessions: ClassificationSession[]
    firstClassificationDate: string
    lastClassificationDate: string
    totalProcessingTime: number
}

export class CertificateService {
    /**
     * Consolida datos de múltiples sesiones en un lote
     */
    consolidateLotData(sessions: ClassificationSession[]): ConsolidatedLotData {
        if (sessions.length === 0) {
            throw new Error('No hay sesiones para consolidar')
        }

        const coffeeLotId = sessions[0].coffee_lot_id
        const allAnalyses: GrainAnalysis[] = []
        let totalProcessingTime = 0

        // Recolectar todos los análisis de todas las sesiones
        sessions.forEach(session => {
            if (session.analyses && session.analyses.length > 0) {
                allAnalyses.push(...session.analyses)
            }
            totalProcessingTime += session.processing_time_seconds || 0
        })

        // Calcular distribución de categorías
        const categoryCount = {
            Specialty: 0,
            Premium: 0,
            A: 0,
            B: 0,
            C: 0
        }

        let totalScore = 0

        allAnalyses.forEach(analysis => {
            totalScore += analysis.final_score
            const category = analysis.final_category
            if (category in categoryCount) {
                categoryCount[category as keyof typeof categoryCount]++
            }
        })

        const totalGrains = allAnalyses.length
        const averageQuality = totalGrains > 0 ? (totalScore / totalGrains) * 100 : 0

        // Calcular porcentajes
        const categoryDistribution = {
            Specialty: {
                count: categoryCount.Specialty,
                percentage: totalGrains > 0 ? (categoryCount.Specialty / totalGrains) * 100 : 0
            },
            Premium: {
                count: categoryCount.Premium,
                percentage: totalGrains > 0 ? (categoryCount.Premium / totalGrains) * 100 : 0
            },
            A: {
                count: categoryCount.A,
                percentage: totalGrains > 0 ? (categoryCount.A / totalGrains) * 100 : 0
            },
            B: {
                count: categoryCount.B,
                percentage: totalGrains > 0 ? (categoryCount.B / totalGrains) * 100 : 0
            },
            C: {
                count: categoryCount.C,
                percentage: totalGrains > 0 ? (categoryCount.C / totalGrains) * 100 : 0
            }
        }

        // Determinar categoría predominante
        const predominantCategory = Object.entries(categoryCount).reduce((a, b) =>
            categoryCount[a[0] as keyof typeof categoryCount] > categoryCount[b[0] as keyof typeof categoryCount] ? a : b
        )[0]

        // Fechas
        const dates = sessions.map(s => new Date(s.created_at).getTime())
        const firstClassificationDate = new Date(Math.min(...dates)).toISOString()
        const lastClassificationDate = new Date(Math.max(...dates)).toISOString()

        return {
            coffeeLotId,
            totalSessions: sessions.length,
            totalGrainsAnalyzed: totalGrains,
            averageQuality,
            categoryDistribution,
            predominantCategory,
            allAnalyses,
            sessions,
            firstClassificationDate,
            lastClassificationDate,
            totalProcessingTime
        }
    }

    /**
     * Genera PDF consolidado del lote
     */
    generateConsolidatedPDF(lotData: ConsolidatedLotData): void {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(20)
        doc.setTextColor(120, 53, 15)
        doc.text('BeanDetect AI', 105, 20, { align: 'center' })

        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text('Certificado de Clasificación de Café', 105, 30, { align: 'center' })

        // Línea decorativa
        doc.setDrawColor(180, 180, 180)
        doc.line(20, 35, 190, 35)

        // SUBTÍTULO: Resultados de Clasificación
        const startY = 45
        doc.setFontSize(14)
        doc.setTextColor(0, 0, 0)
        doc.text('Resultados de Clasificación del Lote', 20, startY)

        // Información del lote consolidado
        const infoStartY = startY + 10
        const lineHeight = 8

        doc.setFontSize(12)
        doc.setTextColor(60, 60, 60)

        doc.text(`Lote de Café: #${lotData.coffeeLotId}`, 20, infoStartY)
        doc.text(`Total de Granos Analizados: ${lotData.totalGrainsAnalyzed}`, 20, infoStartY + lineHeight)
        doc.text(`Sesiones de Clasificación: ${lotData.totalSessions}`, 20, infoStartY + lineHeight * 2)
        doc.text(`Primera Clasificación: ${new Date(lotData.firstClassificationDate).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}`, 20, infoStartY + lineHeight * 3)
        doc.text(`Última Clasificación: ${new Date(lotData.lastClassificationDate).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}`, 20, infoStartY + lineHeight * 4)
        doc.text(`Calidad Promedio del Lote: ${lotData.averageQuality.toFixed(1)}%`, 20, infoStartY + lineHeight * 5)
        doc.text(`Categoría Predominante: ${lotData.predominantCategory}`, 20, infoStartY + lineHeight * 6)
        doc.text(`Tiempo Total de Procesamiento: ${lotData.totalProcessingTime.toFixed(2)} segundos`, 20, infoStartY + lineHeight * 7)

        // Distribución de calidad - Tabla
        const tableStartY = infoStartY + lineHeight * 9
        doc.setFontSize(14)
        doc.setTextColor(0, 0, 0)
        doc.text('Distribución por Categoría', 20, tableStartY)

        const tableData = [
            [
                'Calidad Especial',
                lotData.categoryDistribution.Specialty.count.toString(),
                `${lotData.categoryDistribution.Specialty.percentage.toFixed(1)}%`,
                '90-100%'
            ],
            [
                'Calidad Premium',
                lotData.categoryDistribution.Premium.count.toString(),
                `${lotData.categoryDistribution.Premium.percentage.toFixed(1)}%`,
                '80-89%'
            ],
            [
                'Calidad A',
                lotData.categoryDistribution.A.count.toString(),
                `${lotData.categoryDistribution.A.percentage.toFixed(1)}%`,
                '70-79%'
            ],
            [
                'Calidad B',
                lotData.categoryDistribution.B.count.toString(),
                `${lotData.categoryDistribution.B.percentage.toFixed(1)}%`,
                '60-69%'
            ],
            [
                'Calidad C',
                lotData.categoryDistribution.C.count.toString(),
                `${lotData.categoryDistribution.C.percentage.toFixed(1)}%`,
                '0-59%'
            ]
        ]

        autoTable(doc, {
            startY: tableStartY + 5,
            head: [['Categoría', 'Cantidad', 'Porcentaje', 'Rango']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [120, 53, 15] },
            styles: { fontSize: 10 }
        })

        // Tabla de análisis individuales (primeros 20)
        const finalY = (doc as any).lastAutoTable.finalY + 10
        doc.setFontSize(14)
        doc.text(`Análisis de Granos (Muestra de ${Math.min(20, lotData.allAnalyses.length)})`, 20, finalY)

        const analysesData = lotData.allAnalyses.slice(0, 20).map((analysis, idx) => [
            `Grano ${idx + 1}`,
            analysis.final_category,
            `${(analysis.final_score * 100).toFixed(1)}%`,
            analysis.features?.circularity?.toFixed(3) || 'N/A'
        ])

        autoTable(doc, {
            startY: finalY + 5,
            head: [['ID', 'Categoría', 'Puntuación', 'Circularidad']],
            body: analysesData,
            theme: 'grid',
            headStyles: { fillColor: [120, 53, 15] },
            styles: { fontSize: 9 }
        })

        // Footer
        const pageHeight = doc.internal.pageSize.height
        doc.setFontSize(9)
        doc.setTextColor(150, 150, 150)
        doc.text('BeanDetect AI - Sistema de Clasificación de Café por IA', 105, pageHeight - 10, { align: 'center' })
        doc.text(`Generado el ${new Date().toLocaleString('es-PE')}`, 105, pageHeight - 5, { align: 'center' })

        // Descargar
        doc.save(`certificado-lote-${lotData.coffeeLotId}.pdf`)
    }

    /**
     * Genera CSV consolidado del lote
     */
    generateConsolidatedCSV(lotData: ConsolidatedLotData): void {
        const headers = [
            'Grano ID',
            'Sesión',
            'Categoría Final',
            'Puntuación Final (%)',
            'Dark (%)',
            'Green (%)',
            'Light (%)',
            'Medium (%)',
            'Circularidad',
            'Tiene Grietas',
            'Área',
            'Perímetro'
        ]

        const rows = lotData.allAnalyses.map((analysis, idx) => {
            const colors = analysis.color_percentages
            const features = analysis.features
            const assessment = analysis.quality_assessment

            // Encontrar a qué sesión pertenece este análisis
            const session = lotData.sessions.find(s =>
                s.analyses.some(a => a.id === analysis.id)
            )

            return [
                idx + 1,
                session?.session_id_vo || 'N/A',
                analysis.final_category,
                (analysis.final_score * 100).toFixed(2),
                colors?.Dark?.toFixed(2) || 0,
                colors?.Green?.toFixed(2) || 0,
                colors?.Light?.toFixed(2) || 0,
                colors?.Medium?.toFixed(2) || 0,
                features?.circularity || 'N/A',
                features?.has_cracks || 'N/A',
                features?.area || 'N/A',
                features?.perimeter || 'N/A'
            ]
        })

        // Agregar información del lote al inicio
        const header = [
            [`Lote de Café: #${lotData.coffeeLotId}`],
            [`Total de Granos Analizados: ${lotData.totalGrainsAnalyzed}`],
            [`Sesiones de Clasificación: ${lotData.totalSessions}`],
            [`Calidad Promedio: ${lotData.averageQuality.toFixed(2)}%`],
            [`Categoría Predominante: ${lotData.predominantCategory}`],
            [`Primera Clasificación: ${new Date(lotData.firstClassificationDate).toLocaleString('es-PE')}`],
            [`Última Clasificación: ${new Date(lotData.lastClassificationDate).toLocaleString('es-PE')}`],
            [],
            [`Distribución de Calidad:`],
            [`Specialty: ${lotData.categoryDistribution.Specialty.count} (${lotData.categoryDistribution.Specialty.percentage.toFixed(1)}%)`],
            [`Premium: ${lotData.categoryDistribution.Premium.count} (${lotData.categoryDistribution.Premium.percentage.toFixed(1)}%)`],
            [`A: ${lotData.categoryDistribution.A.count} (${lotData.categoryDistribution.A.percentage.toFixed(1)}%)`],
            [`B: ${lotData.categoryDistribution.B.count} (${lotData.categoryDistribution.B.percentage.toFixed(1)}%)`],
            [`C: ${lotData.categoryDistribution.C.count} (${lotData.categoryDistribution.C.percentage.toFixed(1)}%)`],
            [],
            headers
        ]

        const csvContent = [
            ...header,
            ...rows
        ].map(row => row.join(',')).join('\n')

        // Crear Blob y descargar
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        link.setAttribute('href', url)
        link.setAttribute('download', `clasificacion-lote-${lotData.coffeeLotId}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    /**
     * Genera datos QR consolidados del lote
     */
    generateConsolidatedQRData(lotData: ConsolidatedLotData): string {
        const qrData = {
            lot_id: lotData.coffeeLotId,
            total_grains: lotData.totalGrainsAnalyzed,
            total_sessions: lotData.totalSessions,
            average_quality: lotData.averageQuality,
            predominant_category: lotData.predominantCategory,
            first_classification: new Date(lotData.firstClassificationDate).toISOString(),
            last_classification: new Date(lotData.lastClassificationDate).toISOString(),
            distribution: {
                Specialty: lotData.categoryDistribution.Specialty.count,
                Premium: lotData.categoryDistribution.Premium.count,
                A: lotData.categoryDistribution.A.count,
                B: lotData.categoryDistribution.B.count,
                C: lotData.categoryDistribution.C.count
            },
            url: typeof window !== 'undefined'
                ? `${window.location.origin}/dashboard/producer/batches/${lotData.coffeeLotId}/classifications`
                : ''
        }

        return JSON.stringify(qrData, null, 2)
    }

    /**
     * Genera URL para QR consolidado
     */
    generateConsolidatedQRImageURL(lotData: ConsolidatedLotData, size: number = 300): string {
        const qrData = this.generateConsolidatedQRData(lotData)
        const encoded = encodeURIComponent(qrData)
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`
    }

    // ====== MÉTODOS LEGACY (mantener por compatibilidad) ======

    /**
     * Genera PDF de una sesión individual (legacy)
     * @deprecated Use generateConsolidatedPDF instead
     */
    generatePDF(session: ClassificationSession): void {
        // Convertir sesión individual a formato consolidado
        const lotData = this.consolidateLotData([session])
        this.generateConsolidatedPDF(lotData)
    }

    /**
     * Genera CSV de una sesión individual (legacy)
     * @deprecated Use generateConsolidatedCSV instead
     */
    generateCSV(session: ClassificationSession): void {
        const lotData = this.consolidateLotData([session])
        this.generateConsolidatedCSV(lotData)
    }

    /**
     * Genera QR de una sesión individual (legacy)
     * @deprecated Use generateConsolidatedQRData instead
     */
    generateQRData(session: ClassificationSession): string {
        const lotData = this.consolidateLotData([session])
        return this.generateConsolidatedQRData(lotData)
    }

    /**
     * Genera URL QR de una sesión individual (legacy)
     * @deprecated Use generateConsolidatedQRImageURL instead
     */
    generateQRImageURL(session: ClassificationSession, size: number = 300): string {
        const lotData = this.consolidateLotData([session])
        return this.generateConsolidatedQRImageURL(lotData, size)
    }
}

export const certificateService = new CertificateService()