import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const sessionId = req.nextUrl.searchParams.get('sessionId')

  if (!sessionId) return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 })

  // Obtener sesión y datos del participante en una sola consulta
  const { data: session } = await supabase
    .from('game_sessions')
    .select('tickets_in_cart, participants(id, name)')
    .eq('id', sessionId)
    .single()

  if (!session) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })

  const cartIds: string[] = session.tickets_in_cart ?? []
  const participant = session.participants as unknown as { id: string; name: string } | null

  const { data: allTickets } = await supabase
    .from('tickets')
    .select('number, status, price')
    .order('number')

  if (!allTickets) return NextResponse.json({ tickets: [], participant })

  const availableTickets = allTickets.filter(t => t.status === 'available')
  const shuffledPrices = shuffle(availableTickets.map(t => t.price))
  const priceByNumber = new Map<number, number>()
  availableTickets.forEach((t, i) => priceByNumber.set(t.number, shuffledPrices[i]))

  const tickets = allTickets.map((t) => {
    const isConfirmedInCart = cartIds.includes(String(t.number))
    return {
      number: t.number,
      status: isConfirmedInCart ? 'confirmed' : t.status === 'available' ? 'available' : 'taken',
      displayPrice: t.status === 'available' ? priceByNumber.get(t.number) : t.price,
    }
  })

  return NextResponse.json({ tickets, participant })
}
