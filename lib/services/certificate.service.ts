// lib/services/certificate.service.ts
// Versión alternativa usando solo jsPDF (sin qrcode.react)

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ClassificationSession } from './classification.service'

export class CertificateService {
    /**
     * Genera y descarga un PDF con el certificado de clasificación
     */
    generatePDF(session: ClassificationSession): void {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(20)
        doc.setTextColor(120, 53, 15) // Color café
        doc.text('BeanDetect AI', 105, 20, { align: 'center' })

        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text('Certificado de Clasificación de Café', 105, 30, { align: 'center' })

        // Línea decorativa
        doc.setDrawColor(180, 180, 180)
        doc.line(20, 35, 190, 35)

        // Información del lote
        doc.setFontSize(12)
        doc.setTextColor(60, 60, 60)

        const startY = 45
        const lineHeight = 8

        doc.text(`Sesión: ${session.session_id_vo}`, 20, startY)
        doc.text(`Lote de Café: #${session.coffee_lot_id}`, 20, startY + lineHeight)
        doc.text(`Fecha de Análisis: ${new Date(session.created_at).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`, 20, startY + lineHeight * 2)
        doc.text(`Estado: ${session.status}`, 20, startY + lineHeight * 3)

        // Resultados principales
        doc.setFontSize(14)
        doc.setTextColor(0, 0, 0)
        doc.text('Resultados de Clasificación', 20, startY + lineHeight * 5)

        doc.setFontSize(11)
        doc.setTextColor(60, 60, 60)

        const resultsY = startY + lineHeight * 6.5
        doc.text(`Total de Granos Analizados: ${session.total_grains_analyzed}`, 20, resultsY)
        doc.text(`Tiempo de Procesamiento: ${session.processing_time_seconds?.toFixed(2)} segundos`, 20, resultsY + lineHeight)
        doc.text(`Calidad del Lote: ${session.classification_result?.lot_quality || 'N/A'}`, 20, resultsY + lineHeight * 2)
        doc.text(`Puntuación Promedio: ${(session.classification_result?.average_quality_score * 100)?.toFixed(1)}%`, 20, resultsY + lineHeight * 3)

        // Distribución de calidad - Tabla
        doc.setFontSize(14)
        doc.setTextColor(0, 0, 0)
        doc.text('Distribución por Categoría', 20, resultsY + lineHeight * 5)

        const distribution = session.classification_result?.category_distribution || {}
        const tableData = [
            ['Calidad Especial', distribution.Specialty || 0, '90-100%'],
            ['Calidad Premium', distribution.Premium || 0, '80-89%'],
            ['Calidad A', distribution.A || 0, '70-79%'],
            ['Calidad B', distribution.B || 0, '60-69%'],
            ['Calidad C', distribution.C || 0, '0-59%']
        ]

        autoTable(doc, {
            startY: resultsY + lineHeight * 5.5,
            head: [['Categoría', 'Cantidad', 'Rango']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [120, 53, 15] },
            styles: { fontSize: 10 }
        })

        // Tabla de análisis individuales (primeros 10)
        const finalY = (doc as any).lastAutoTable.finalY + 10
        doc.setFontSize(14)
        doc.text('Análisis de Granos (Muestra)', 20, finalY)

        const analysesData = session.analyses.slice(0, 10).map((analysis, idx) => [
            `Grano ${idx + 1}`,
            analysis.final_category,
            `${(analysis.final_score * 100).toFixed(1)}%`,
            analysis.features?.circularity ? 'Sí' : 'N/A'
        ])

        autoTable(doc, {
            startY: finalY + 5,
            head: [['ID', 'Categoría', 'Puntuación', 'Forma OK']],
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
        doc.save(`certificado-${session.session_id_vo}.pdf`)
    }

    /**
     * Genera y descarga un CSV con los datos de clasificación
     */
    generateCSV(session: ClassificationSession): void {
        const headers = [
            'Grano ID',
            'Categoría Final',
            'Puntuación Final (%)',
            'Puntuación Base',
            'Puntuación Forma',
            'Color Dominante',
            'Dark (%)',
            'Green (%)',
            'Light (%)',
            'Medium (%)',
            'Circularidad',
            'Tiene Grietas',
            'Área',
            'Perímetro'
        ]

        const rows = session.analyses.map((analysis, idx) => {
            const colors = analysis.color_percentages
            const features = analysis.features
            const assessment = analysis.quality_assessment

            return [
                idx + 1,
                analysis.final_category,
                (analysis.final_score * 100).toFixed(2),
                assessment?.base_quality_score || 'N/A',
                assessment?.shape_score || 'N/A',
                assessment?.['source_category (color)'] || 'N/A',
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
            [`Sesión: ${session.session_id_vo}`],
            [`Lote: ${session.coffee_lot_id}`],
            [`Fecha: ${new Date(session.created_at).toLocaleString('es-PE')}`],
            [`Total Granos: ${session.total_grains_analyzed}`],
            [`Calidad Lote: ${session.classification_result?.lot_quality || 'N/A'}`],
            [`Puntuación Promedio: ${(session.classification_result?.average_quality_score * 100)?.toFixed(2)}%`],
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
        link.setAttribute('download', `clasificacion-${session.session_id_vo}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    /**
     * Genera los datos para el QR code (string JSON)
     */
    generateQRData(session: ClassificationSession): string {
        const qrData = {
            session_id: session.session_id_vo,
            lot_id: session.coffee_lot_id,
            date: new Date(session.created_at).toISOString(),
            total_grains: session.total_grains_analyzed,
            lot_quality: session.classification_result?.lot_quality,
            avg_score: session.classification_result?.average_quality_score,
            distribution: session.classification_result?.category_distribution,
            url: typeof window !== 'undefined'
                ? `${window.location.origin}/dashboard/producer/reports?session=${session.id}`
                : ''
        }

        return JSON.stringify(qrData, null, 2)
    }

    /**
     * Genera URL para QR usando API pública de QR
     */
    generateQRImageURL(session: ClassificationSession, size: number = 300): string {
        const qrData = this.generateQRData(session)
        const encoded = encodeURIComponent(qrData)
        // Usar API gratuita de qr-server.com
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`
    }
}

export const certificateService = new CertificateService()