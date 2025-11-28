// app/dashboard/producer/batches/[lotId]/classifications/page.tsx

import { LotClassifications } from "@/components/dashboard/producer/lot-classifications"

interface PageProps {
    params: Promise<{
        lotId: string
    }>
}

export default async function ClassificationsPage({ params }: PageProps) {
    const { lotId } = await params
    const lotIdNumber = parseInt(lotId)

    return <LotClassifications lotId={lotIdNumber} />
}