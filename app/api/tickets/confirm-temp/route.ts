import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const { number, sessionId } = await req.json()

  const { data: session } = await supabase
    .from('game_sessions')
    .select('tickets_in_cart')
    .eq('id', sessionId)
    .single()

  if (!session) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })

  const current: string[] = session.tickets_in_cart ?? []
  if (!current.includes(String(number))) {
    await supabase
      .from('game_sessions')
      .update({ tickets_in_cart: [...current, String(number)] })
      .eq('id', sessionId)
  }

  return NextResponse.json({ ok: true })
}
