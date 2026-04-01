import { NextRequest, NextResponse } from 'next/server'
import { setHeartbeat } from '@/lib/heartbeat-store'

export async function POST(request: NextRequest) {
  try {
    const { type, userId, typing } = await request.json()

    if (!userId || !type) {
      return NextResponse.json({ error: 'userId and type required' }, { status: 400 })
    }

    setHeartbeat(userId, type, typing)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
