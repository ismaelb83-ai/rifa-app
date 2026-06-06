import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const { number, sessionId } = await req.json()

  if (!number || !sessionId) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  // Verificar que el ticket está disponible
  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, number, status, price')
    .eq('number', number)
    .single()

  if (!ticket || ticket.status !== 'available') {
    return NextResponse.json({ error: 'Este número ya fue tomado' }, { status: 409 })
  }

  const { data: session } = await supabase
    .from('game_sessions')
    .select('participant_id')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
  }

  // Obtener todos los demás boletos disponibles para hacer el intercambio de precio
  const { data: otherAvailable } = await supabase
    .from('tickets')
    .select('id, price')
    .eq('status', 'available')
    .neq('number', number)

  let finalPrice = ticket.price

  if (otherAvailable && otherAvailable.length > 0) {
    // Elegir un boleto aleatorio para intercambiar precios
    const randomIndex = Math.floor(Math.random() * otherAvailable.length)
    const swapTicket = otherAvailable[randomIndex]

    finalPrice = swapTicket.price

    // Intercambiar: el boleto rascado toma el precio aleatorio,
    // el otro boleto toma el precio original del rascado
    await Promise.all([
      supabase.from('tickets').update({ price: finalPrice }).eq('number', number),
      supabase.from('tickets').update({ price: ticket.price }).eq('id', swapTicket.id),
    ])
  }

  // Reservar el boleto
  await supabase
    .from('tickets')
    .update({
      status: 'reserved',
      participant_id: session.participant_id,
      session_id: sessionId,
      reserved_at: new Date().toISOString(),
    })
    .eq('number', number)

  return NextResponse.json({ price: finalPrice, number })
}
