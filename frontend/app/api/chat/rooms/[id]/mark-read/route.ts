import { NextRequest, NextResponse } from 'next/server'
import { serverPost } from '@/lib/api/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Call Symfony API to mark room as read
    const { data } = await serverPost(`/chat_rooms/${id}/mark-read`, {})

    return NextResponse.json(data)
  } catch (error) {
    console.error('[mark-read] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
