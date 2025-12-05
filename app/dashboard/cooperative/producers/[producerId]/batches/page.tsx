// app/dashboard/cooperative/producers/[producerId]/batches/page.tsx

import { ProducerBatchesView } from "@/components/dashboard/cooperative/producer-batches-view"

interface PageProps {
    params: Promise<{
        producerId: string
    }>
}

export default async function ProducerBatchesPage({ params }: PageProps) {
    const { producerId } = await params
    const producerIdNumber = parseInt(producerId)

    return <ProducerBatchesView producerId={producerIdNumber} />
}