/**
 * Catch'Up — Serveur WebSocket de visioconference
 * Relais binaire pour audio/video entre participants d'une room.
 *
 * Port : 3003 (separe de Next.js sur 3000)
 * Nginx doit proxifier wss://visio.catchup.jaeprive.fr -> ws://localhost:3003
 *
 * Protocole binaire :
 *   0x01 = JPEG frame (fallback)
 *   0x02 = audio chunk (WebM/Opus)
 *   0x03 = VP8 keyframe
 *   0x04 = VP8 delta frame
 *   0x05 = control message (JSON: join/leave/mute/unmute)
 *
 * Usage : node src/visio/server.js   (ou npx tsx src/visio/server.ts)
 */

import { WebSocketServer, WebSocket, RawData } from 'ws'
import { IncomingMessage } from 'http'
import { URL } from 'url'

// ── Types ──────────────────────────────────────────────────────────

interface Participant {
  id: string
  name: string
  role: string
  muted: boolean
  videoOff: boolean
  ws: WebSocket
  lastPing: number
}

interface Room {
  id: string
  participants: Map<string, Participant>
}

interface ControlMessage {
  type: 'join' | 'leave' | 'mute' | 'unmute' | 'video_off' | 'video_on' | 'participants' | 'error' | 'ping' | 'pong'
  participantId?: string
  name?: string
  role?: string
  participants?: Array<{ id: string; name: string; role: string; muted: boolean; videoOff: boolean }>
  message?: string
}

// ── State ──────────────────────────────────────────────────────────

const MAX_PARTICIPANTS_PER_ROOM = 4
const HEARTBEAT_INTERVAL = 10_000 // 10s
const DISCONNECT_TIMEOUT = 30_000 // 30s

const rooms = new Map<string, Room>()

// ── Helpers ────────────────────────────────────────────────────────

function getRoom(roomId: string): Room {
  let room = rooms.get(roomId)
  if (!room) {
    room = { id: roomId, participants: new Map() }
    rooms.set(roomId, room)
    console.log(`[Visio] Room created: ${roomId}`)
  }
  return room
}

function broadcastParticipantList(room: Room) {
  const list = Array.from(room.participants.values()).map(p => ({
    id: p.id,
    name: p.name,
    role: p.role,
    muted: p.muted,
    videoOff: p.videoOff,
  }))

  const controlMsg: ControlMessage = {
    type: 'participants',
    participants: list,
  }

  const payload = encodeControlMessage(controlMsg)

  for (const p of room.participants.values()) {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(payload)
    }
  }
}

function encodeControlMessage(msg: ControlMessage): Buffer {
  const json = JSON.stringify(msg)
  const jsonBuf = Buffer.from(json, 'utf-8')
  const frame = Buffer.allocUnsafe(1 + jsonBuf.length)
  frame[0] = 0x05
  jsonBuf.copy(frame, 1)
  return frame
}

function parseControlMessage(data: Buffer): ControlMessage | null {
  try {
    const json = data.subarray(1).toString('utf-8')
    return JSON.parse(json) as ControlMessage
  } catch {
    return null
  }
}

function removeParticipant(room: Room, participantId: string) {
  const participant = room.participants.get(participantId)
  if (!participant) return

  room.participants.delete(participantId)
  console.log(`[Visio] ${participant.name} left room ${room.id} (${room.participants.size} remaining)`)

  // Notify others
  const leaveMsg = encodeControlMessage({
    type: 'leave',
    participantId,
    name: participant.name,
  })
  for (const p of room.participants.values()) {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(leaveMsg)
    }
  }

  broadcastParticipantList(room)

  // Cleanup empty room
  if (room.participants.size === 0) {
    rooms.delete(room.id)
    console.log(`[Visio] Room deleted: ${room.id}`)
  }
}

// ── WebSocket Server ───────────────────────────────────────────────

const PORT = parseInt(process.env.VISIO_PORT || '3003', 10)
const wss = new WebSocketServer({ port: PORT })

console.log(`[Visio] WebSocket server listening on port ${PORT}`)

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  // Parse room and participant info from URL
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  const roomId = url.searchParams.get('room')
  const participantId = url.searchParams.get('id') || crypto.randomUUID()
  const participantName = url.searchParams.get('name') || 'Anonyme'
  const participantRole = url.searchParams.get('role') || 'beneficiaire'

  if (!roomId) {
    const errMsg = encodeControlMessage({ type: 'error', message: 'Missing room parameter' })
    ws.send(errMsg)
    ws.close(4000, 'Missing room parameter')
    return
  }

  const room = getRoom(roomId)

  // Check max participants
  if (room.participants.size >= MAX_PARTICIPANTS_PER_ROOM) {
    const errMsg = encodeControlMessage({ type: 'error', message: 'Room is full (max 4 participants)' })
    ws.send(errMsg)
    ws.close(4001, 'Room full')
    return
  }

  // Register participant
  const participant: Participant = {
    id: participantId,
    name: participantName,
    role: participantRole,
    muted: false,
    videoOff: false,
    ws,
    lastPing: Date.now(),
  }
  room.participants.set(participantId, participant)

  console.log(`[Visio] ${participantName} (${participantRole}) joined room ${roomId} (${room.participants.size} participants)`)

  // Notify others of join
  const joinMsg = encodeControlMessage({
    type: 'join',
    participantId,
    name: participantName,
    role: participantRole,
  })
  for (const p of room.participants.values()) {
    if (p.id !== participantId && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(joinMsg)
    }
  }

  // Send participant list to everyone
  broadcastParticipantList(room)

  // ── Message handling ──

  ws.on('message', (data: RawData, isBinary: boolean) => {
    participant.lastPing = Date.now()

    if (!isBinary && !Buffer.isBuffer(data)) {
      // Text message — ignore (we only handle binary)
      return
    }

    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer)
    if (buf.length === 0) return

    const msgType = buf[0]

    // Control message
    if (msgType === 0x05) {
      const ctrl = parseControlMessage(buf)
      if (!ctrl) return

      switch (ctrl.type) {
        case 'mute':
          participant.muted = true
          broadcastParticipantList(room)
          break
        case 'unmute':
          participant.muted = false
          broadcastParticipantList(room)
          break
        case 'video_off':
          participant.videoOff = true
          broadcastParticipantList(room)
          break
        case 'video_on':
          participant.videoOff = false
          broadcastParticipantList(room)
          break
        case 'ping':
          // Respond with pong
          ws.send(encodeControlMessage({ type: 'pong' }))
          break
        case 'leave':
          removeParticipant(room, participantId)
          ws.close(1000, 'Left room')
          break
      }
      return
    }

    // Binary media frame (0x01-0x04): relay to all others
    if (msgType >= 0x01 && msgType <= 0x04) {
      // Prepend sender ID to the frame so receivers know who it's from
      const senderIdBuf = Buffer.from(participantId, 'utf-8')
      const senderIdLen = Buffer.allocUnsafe(1)
      senderIdLen[0] = Math.min(senderIdBuf.length, 255)

      // Frame layout: [type(1)] [senderIdLen(1)] [senderId(N)] [payload(...)]
      const relayFrame = Buffer.concat([
        buf.subarray(0, 1),     // type byte
        senderIdLen,             // sender ID length
        senderIdBuf,             // sender ID
        buf.subarray(1),         // original payload
      ])

      for (const p of room.participants.values()) {
        if (p.id !== participantId && p.ws.readyState === WebSocket.OPEN) {
          p.ws.send(relayFrame)
        }
      }
    }
  })

  ws.on('close', () => {
    removeParticipant(room, participantId)
  })

  ws.on('error', (err) => {
    console.error(`[Visio] WebSocket error for ${participantName}:`, err.message)
    removeParticipant(room, participantId)
  })
})

// ── Heartbeat ──────────────────────────────────────────────────────

setInterval(() => {
  const now = Date.now()

  for (const [roomId, room] of rooms) {
    for (const [pid, participant] of room.participants) {
      if (now - participant.lastPing > DISCONNECT_TIMEOUT) {
        console.log(`[Visio] ${participant.name} timed out in room ${roomId}`)
        participant.ws.close(4002, 'Heartbeat timeout')
        removeParticipant(room, pid)
      }
    }
  }
}, HEARTBEAT_INTERVAL)

// ── Graceful shutdown ──────────────────────────────────────────────

process.on('SIGTERM', () => {
  console.log('[Visio] Shutting down...')
  wss.close(() => {
    console.log('[Visio] Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[Visio] Shutting down...')
  wss.close(() => {
    process.exit(0)
  })
})
