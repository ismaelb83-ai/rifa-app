import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const { number, sessionId } = await req.json()

  await supabase
    .from('tickets')
    .update({
      status: 'available',
      participant_id: null,
      session_id: null,
      reserved_at: null,
    })
    .eq('number', number)
    .eq('session_id', sessionId)
    .eq('status', 'reserved')

  return NextResponse.json({ ok: true })
}
