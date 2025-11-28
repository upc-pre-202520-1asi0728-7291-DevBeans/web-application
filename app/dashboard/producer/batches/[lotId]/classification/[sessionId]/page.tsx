// app/dashboard/producer/batches/[lotId]/classification/[sessionId]/page.tsx

import { SessionDetails } from "@/components/dashboard/producer/session-details"

interface PageProps {
    params: Promise<{
        lotId: string
        sessionId: string
    }>
}

export default async function SessionDetailsPage({ params }: PageProps) {
    const { lotId, sessionId } = await params
    const lotIdNumber = parseInt(lotId)
    const sessionIdNumber = parseInt(sessionId)

    return <SessionDetails sessionId={sessionIdNumber} lotId={lotIdNumber} />
}