import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const { participantId } = await req.json()

  if (!participantId) {
    return NextResponse.json({ error: 'participantId requerido' }, { status: 400 })
  }

  const { error } = await supabase
    .from('tickets')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .eq('participant_id', participantId)
    .eq('status', 'reserved')

  if (error) {
    return NextResponse.json({ error: 'Error confirmando pago' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
