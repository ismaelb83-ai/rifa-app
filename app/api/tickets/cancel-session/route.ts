import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase-server'

// sendBeacon envía text/plain, hay que parsear el body manualmente
export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  try {
    const text = await req.text()
    const { sessionId } = JSON.parse(text)
    if (!sessionId) return NextResponse.json({ ok: false })

    await supabase
      .from('tickets')
      .update({ status: 'available', participant_id: null, session_id: null, reserved_at: null })
      .eq('session_id', sessionId)
      .eq('status', 'reserved')

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
