import { createClient } from '@supabase/supabase-js'

// Durante el build, las env vars pueden no estar disponibles.
// Se usa un placeholder que no rompe la inicialización del módulo.
// Las llamadas reales solo ocurren en useEffect/handlers (solo en el cliente).
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseUrl = rawUrl.startsWith('http') ? rawUrl : 'https://placeholder.supabase.co'
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const supabaseAnonKey = rawKey || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Ticket = {
  id: string
  number: number
  price: number
  status: 'available' | 'reserved' | 'confirmed'
  participant_id: string | null
  session_id: string | null
  reserved_at: string | null
  confirmed_at: string | null
}

export type Participant = {
  id: string
  name: string
  phone: string
  email: string | null
  created_at: string
}

export type GameSession = {
  id: string
  participant_id: string
  attempts_used: number
  tickets_in_cart: string[]
  created_at: string
  expires_at: string
}
