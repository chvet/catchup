import { NextRequest, NextResponse } from 'next/server'
import { getHeartbeat } from '@/lib/heartbeat-store'

const ONLINE_THRESHOLD_MS = 60_000 // 60 seconds

export async function GET(request: NextRequest) {
  const userIdsParam = request.nextUrl.searchParams.get('userIds')

  if (!userIdsParam) {
    return NextResponse.json({ statuses: {} })
  }

  const userIds = userIdsParam.split(',').filter(Boolean)
  const statuses: Record<string, { online: boolean; lastSeen: string | null }> = {}

  const now = Date.now()

  for (const uid of userIds) {
    const hb = getHeartbeat(uid)
    if (hb) {
      statuses[uid] = {
        online: now - hb.lastSeen < ONLINE_THRESHOLD_MS,
        lastSeen: new Date(hb.lastSeen).toISOString(),
      }
    } else {
      statuses[uid] = { online: false, lastSeen: null }
    }
  }

  return NextResponse.json({ statuses })
}
