import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const { participantId } = await req.json()

  if (!participantId) {
    return NextResponse.json({ error: 'participantId requerido' }, { status: 400 })
  }

  // Liberar todos los boletos de este participante
  await supabase
    .from('tickets')
    .update({
      status: 'available',
      participant_id: null,
      session_id: null,
      reserved_at: null,
    })
    .eq('participant_id', participantId)

  // Eliminar todas las sesiones del participante
  await supabase
    .from('game_sessions')
    .delete()
    .eq('participant_id', participantId)

  // Eliminar el participante
  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', participantId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
