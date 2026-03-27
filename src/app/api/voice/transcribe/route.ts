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

    // Vérifier le type MIME (WebM ou M4A/MP4)
    const validTypes = ['audio/webm', 'audio/mp4', 'audio/m4a', 'audio/mpeg', 'audio/ogg', 'audio/wav']
    const isValid = validTypes.some(t => file.type.startsWith(t.split('/')[0]) || file.type === t)
    if (!isValid && file.type && !file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'Format audio non supporté' }, { status: 400 })
    }

    // Vérifier la taille (max 25 Mo — limite Whisper)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 25 Mo)' }, { status: 400 })
    }

    // Construire le FormData pour l'API OpenAI Whisper
    const whisperForm = new FormData()
    whisperForm.append('file', file, file.name || 'audio.webm')
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
