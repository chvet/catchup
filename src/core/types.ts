// === Types partagés 100% web + natif ===

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  rawContent?: string
  audioUrl?: string
  timestamp: number
  metadata?: MessageMetadata
}

export interface MessageMetadata {
  fragilityDetected?: boolean
  fragilityLevel?: 'low' | 'medium' | 'high'
  profileExtracted?: boolean
}

export interface UserProfile {
  id: string
  name?: string
  genre?: 'M' | 'F' | null
  age?: number
  departement?: string
  R: number
  I: number
  A: number
  S: number
  E: number
  C: number
  traits: string[]
  interests: string[]
  strengths: string[]
  suggestion: string
  updatedAt: number
}

export interface ConversationState {
  id: string
  title: string
  messages: Message[]
  status: 'active' | 'archived'
  startedAt: number
  lastMessageAt: number
  messageCount: number
}

export interface AppSettings {
  ttsEnabled: boolean
  ttsVoice: 'male' | 'female'
  rgaaMode: boolean
  locale: 'fr'
  theme: 'light' | 'dark' | 'auto'
}

export interface PromotionState {
  bannerDismissed: boolean
  bannerDismissedAt?: number
  interstitialShown: boolean
  sessionCount: number
  conversationCount: number
  lastVisit: number
  platform: 'ios' | 'android' | 'desktop' | 'unknown'
  context: 'browser' | 'pwa' | 'native'
}

export interface DeviceCapabilities {
  hasMotion: boolean
  hasHaptics: boolean
  hasLocation: boolean
  hasAR: boolean
  hasBiometrics: boolean
  hasCamera: boolean
  hasContacts: boolean
  hasCalendar: boolean
  hasWidget: boolean
  hasVoiceAssistant: boolean
  hasPushNotifications: boolean
  isNative: boolean
}

export interface OfflineQueueItem {
  id: string
  action: 'create' | 'update' | 'delete'
  table: string
  payload: string
  createdAt: number
  syncedAt?: number
  retries: number
}

export const RIASEC_LABELS: Record<string, string> = {
  R: 'Réaliste',
  I: 'Investigateur',
  A: 'Artiste',
  S: 'Social',
  E: 'Entreprenant',
  C: 'Conventionnel',
}

export const RIASEC_COLORS: Record<string, string> = {
  R: '#E74C3C',
  I: '#3498DB',
  A: '#9B59B6',
  S: '#2ECC71',
  E: '#F39C12',
  C: '#1ABC9C',
}

export const RIASEC_ICONS: Record<string, string> = {
  R: '🔧',
  I: '🔬',
  A: '🎨',
  S: '🤝',
  E: '🚀',
  C: '📊',
}

export const EMPTY_PROFILE: UserProfile = {
  id: 'default',
  genre: null,
  R: 0, I: 0, A: 0, S: 0, E: 0, C: 0,
  traits: [],
  interests: [],
  strengths: [],
  suggestion: '',
  updatedAt: 0,
}
