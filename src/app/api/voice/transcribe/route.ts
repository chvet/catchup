import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Fichier audio requis' }, { status: 400 })
    }

    // Vérifier la taille (max 10 Mo)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 })
    }

    // Vérifier les magic bytes du fichier (pas seulement le MIME type côté client)
    const buffer = await file.arrayBuffer()
    const header = new Uint8Array(buffer.slice(0, 12))
    const isWebM = header[0] === 0x1A && header[1] === 0x45 && header[2] === 0xDF && header[3] === 0xA3
    const isOgg = header[0] === 0x4F && header[1] === 0x67 && header[2] === 0x67 && header[3] === 0x53
    const isRIFF = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 // WAV
    const isFtyp = header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70 // MP4/M4A
    const isID3 = header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33 // MP3 with ID3
    const isMP3 = (header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) // MP3 sync word

    if (!isWebM && !isOgg && !isRIFF && !isFtyp && !isID3 && !isMP3) {
      return NextResponse.json({ error: 'Format audio non supporté' }, { status: 400 })
    }

    // Recréer le fichier à partir du buffer validé
    const validatedFile = new File([buffer], file.name || 'audio.webm', { type: file.type })

    // Construire le FormData pour l'API OpenAI Whisper
    const whisperForm = new FormData()
    whisperForm.append('file', validatedFile, validatedFile.name || 'audio.webm')
    whisperForm.append('model', 'whisper-1')
    whisperForm.append('language', 'fr')
    whisperForm.append('response_format', 'verbose_json')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: whisperForm,
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Whisper API error:', response.status, errorData)
      return NextResponse.json(
        { error: 'Erreur de transcription' },
        { status: 502 }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      text: data.text || '',
      duration: data.duration || 0,
    })
  } catch (error) {
    console.error('Voice transcription error:', error)
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    )
  }
}
