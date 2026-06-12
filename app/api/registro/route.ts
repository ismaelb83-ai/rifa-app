import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const { name, phone, email } = await req.json()

  if (!name?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: 'Nombre y celular son requeridos' }, { status: 400 })
  }

  const cleanPhone = phone.trim().replace(/\s|-/g, '')

  // Verificar si el teléfono ya existe con boletos activos
  const { data: existing } = await supabase
    .from('participants')
    .select('id, tickets(status)')
    .eq('phone', cleanPhone)
    .maybeSingle()

  let participant: any

  if (existing) {
    const hasTickets = (existing.tickets as { status: string }[])?.some(
      (t) => t.status === 'confirmed' || t.status === 'reserved'
    )
    if (hasTickets) {
      return NextResponse.json(
        { error: 'Este número ya tiene boletos asignados' },
        { status: 409 }
      )
    }
    // Teléfono existe pero sin boletos: limpiar y reutilizar
    // Liberar todos los boletos
    await supabase
      .from('tickets')
      .update({ status: 'available', participant_id: null, session_id: null, reserved_at: null })
      .eq('participant_id', existing.id)

    // Eliminar todas sus sesiones anteriores
    await supabase
      .from('game_sessions')
      .delete()
      .eq('participant_id', existing.id)

    // Actualizar datos del participante
    const { data: updated, error: updateError } = await supabase
      .from('participants')
      .update({ name: name.trim(), email: email?.trim() || null })
      .eq('id', existing.id)
      .select()
      .single()

    if (updateError || !updated) {
      return NextResponse.json({ error: 'Error al actualizar registro' }, { status: 500 })
    }
    participant = updated
  } else {
    // Crear nuevo participante
    const { data: newParticipant, error } = await supabase
      .from('participants')
      .insert({ name: name.trim(), phone: cleanPhone, email: email?.trim() || null })
      .select()
      .single()

    if (error || !newParticipant) {
      return NextResponse.json({ error: 'Error al registrar' }, { status: 500 })
    }
    participant = newParticipant
  }

  if (!participant) {
    return NextResponse.json({ error: 'Error al registrar' }, { status: 500 })

  if (error || !participant) {
    return NextResponse.json({ error: 'Error al registrar' }, { status: 500 })
  }

  const sessionId = randomUUID()

  await supabase.from('game_sessions').insert({
    id: sessionId,
    participant_id: participant.id,
    attempts_used: 0,
    tickets_in_cart: [],
  })

  return NextResponse.json({ participant, sessionId })
}
