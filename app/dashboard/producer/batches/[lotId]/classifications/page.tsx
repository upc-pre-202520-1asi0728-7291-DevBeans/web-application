// app/dashboard/producer/batches/classifications/page.tsx

import { LotClassifications } from "@/components/dashboard/producer/lot-classifications"

interface PageProps {
    params: {
        lotId: string
    }
}

export default function ClassificationsPage({ params }: PageProps) {
    const lotId = parseInt(params.lotId)

    return <LotClassifications lotId={lotId} />
}