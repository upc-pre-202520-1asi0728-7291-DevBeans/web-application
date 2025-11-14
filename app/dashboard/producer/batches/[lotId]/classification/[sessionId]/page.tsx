// app/dashboard/producer/batches/[lotId]/classification/[sessionId]/page.tsx

import { SessionDetails } from "@/components/dashboard/producer/session-details"

interface PageProps {
    params: {
        lotId: string
        sessionId: string
    }
}

export default function SessionDetailsPage({ params }: PageProps) {
    const lotId = parseInt(params.lotId)
    const sessionId = parseInt(params.sessionId)

    return <SessionDetails sessionId={sessionId} lotId={lotId} />
}