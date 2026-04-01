/**
 * Catch'Up — Serveur WebSocket de visioconference (OPTIMISE)
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
 * Optimisations :
 *   - Backpressure : skip delta frames si bufferedAmount > seuil
 *   - Keyframes toujours relayees (jamais droppees)
 *   - Audio toujours relaye (jamais droppe)
 *   - Frame rate limiter par participant emetteur
 *   - Stats de frames droppees loguees periodiquement
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
  // Stats
  framesRelayed: number
  framesDropped: number
  lastVideoFrameTime: number
}

interface Room {
  id: string
  participants: Map<string, Participant>
}

interface ControlMessage {
  type: 'join' | 'leave' | 'mute' | 'unmute' | 'video_off' | 'video_on' | 'participants' | 'error' | 'ping' | 'pong' | 'quality'
  participantId?: string
  name?: string
  role?: string
  participants?: Array<{ id: string; name: string; role: string; muted: boolean; videoOff: boolean }>
  message?: string
  quality?: string  // 'low' | 'medium' | 'high'
}

// ── Constants ─────────────────────────────────────────────────────

const MAX_PARTICIPANTS_PER_ROOM = 4
const HEARTBEAT_INTERVAL = 10_000
const DISCONNECT_TIMEOUT = 30_000

// Backpressure thresholds (bytes in WebSocket send buffer)
const BACKPRESSURE_DROP_DELTA = 128 * 1024    // 128KB → start dropping delta video
const BACKPRESSURE_DROP_JPEG = 256 * 1024     // 256KB → start dropping JPEG too
// Never drop keyframes or audio

// Minimum interval between video frames per receiver (ms)
// Prevents flooding slow receivers
const MIN_FRAME_INTERVAL_MS = 30 // ~33fps max relay rate

const STATS_LOG_INTERVAL = 60_000 // Log stats every 60s

// ── State ──────────────────────────────────────────────────────────

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
  console.log(`[Visio] ${participant.name} left room ${room.id} (${room.participants.size} remaining) — relayed: ${participant.framesRelayed}, dropped: ${participant.framesDropped}`)

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

/**
 * Smart relay: decides per-receiver whether to relay or drop a frame.
 * - Keyframes (0x03) and audio (0x02) are NEVER dropped.
 * - Delta video (0x04) and JPEG (0x01) are dropped if receiver has backpressure.
 */
function smartRelay(room: Room, senderId: string, msgType: number, relayFrame: Buffer) {
  const now = Date.now()
  const isKeyframe = msgType === 0x03
  const isAudio = msgType === 0x02
  const isDelta = msgType === 0x04
  const isJpeg = msgType === 0x01
  const isVideo = isKeyframe || isDelta || isJpeg

  for (const p of room.participants.values()) {
    if (p.id === senderId) continue
    if (p.ws.readyState !== WebSocket.OPEN) continue

    const buffered = (p.ws as any).bufferedAmount || 0

    // Always relay keyframes and audio — they're critical
    if (isKeyframe || isAudio) {
      p.ws.send(relayFrame)
      p.framesRelayed++
      if (isVideo) p.lastVideoFrameTime = now
      continue
    }

    // For delta frames: check backpressure
    if (isDelta && buffered > BACKPRESSURE_DROP_DELTA) {
      p.framesDropped++
      continue
    }

    // For JPEG: slightly higher threshold
    if (isJpeg && buffered > BACKPRESSURE_DROP_JPEG) {
      p.framesDropped++
      continue
    }

    // Rate limiter: don't flood receiver with video faster than they can consume
    if (isVideo && (now - p.lastVideoFrameTime) < MIN_FRAME_INTERVAL_MS) {
      // Only drop deltas for rate limiting, never keyframes (already handled above)
      p.framesDropped++
      continue
    }

    // Relay the frame
    p.ws.send(relayFrame)
    p.framesRelayed++
    if (isVideo) p.lastVideoFrameTime = now
  }
}

// ── WebSocket Server ───────────────────────────────────────────────

const PORT = parseInt(process.env.VISIO_PORT || '3003', 10)
const wss = new WebSocketServer({ port: PORT })

console.log(`[Visio] WebSocket server listening on port ${PORT} (optimized relay)`)

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
    framesRelayed: 0,
    framesDropped: 0,
    lastVideoFrameTime: 0,
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
          ws.send(encodeControlMessage({ type: 'pong' }))
          break
        case 'leave':
          removeParticipant(room, participantId)
          ws.close(1000, 'Left room')
          break
      }
      return
    }

    // Binary media frame (0x01-0x04): smart relay to others
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

      // Use smart relay with backpressure management
      smartRelay(room, participantId, msgType, relayFrame)
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

// ── Stats logging ─────────────────────────────────────────────────

setInterval(() => {
  for (const [roomId, room] of rooms) {
    if (room.participants.size === 0) continue
    for (const p of room.participants.values()) {
      if (p.framesRelayed > 0 || p.framesDropped > 0) {
        const dropRate = p.framesDropped / Math.max(1, p.framesRelayed + p.framesDropped) * 100
        console.log(`[Visio] Stats ${roomId}/${p.name}: relayed=${p.framesRelayed} dropped=${p.framesDropped} (${dropRate.toFixed(1)}% drop)`)
      }
    }
  }
}, STATS_LOG_INTERVAL)

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
