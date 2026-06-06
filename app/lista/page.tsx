'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Search, CheckCircle, Clock, Ticket } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Entry = {
  participantName: string
  tickets: {
    number: number
    price: number
    status: 'reserved' | 'confirmed'
  }[]
  total: number
}

export default function ListaPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ confirmed: 0, total: 0 })

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('lista-publica')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: tickets } = await supabase
        .from('tickets')
        .select('number, price, status, participant_id, participants(name)')
        .in('status', ['reserved', 'confirmed'])
        .order('number')

      if (!tickets) return

      const grouped: Record<string, Entry> = {}
      for (const t of tickets) {
        const pid = t.participant_id ?? 'unknown'
        const participantsData = t.participants as unknown as { name: string } | null
        const name = participantsData?.name ?? 'Desconocido'
        if (!grouped[pid]) grouped[pid] = { participantName: name, tickets: [], total: 0 }
        grouped[pid].tickets.push({ number: t.number, price: t.price, status: t.status as 'reserved' | 'confirmed' })
        grouped[pid].total += t.price
      }

      const list = Object.values(grouped).sort((a, b) =>
        a.participantName.localeCompare(b.participantName)
      )
      setEntries(list)
      setStats({
        confirmed: tickets.filter((t) => t.status === 'confirmed').length,
        total: tickets.length,
      })
    } finally {
      setLoading(false)
    }
  }

  const filtered = entries.filter((e) =>
    e.participantName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen flex flex-col px-4 py-8">
      <div className="w-full max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Participantes</h1>
            <p className="text-gray-400 text-sm">Lista actualizada en tiempo real</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Confirmados', value: stats.confirmed, color: 'text-green-400', icon: CheckCircle },
            { label: 'Reservados', value: stats.total - stats.confirmed, color: 'text-yellow-400', icon: Clock },
            { label: 'Disponibles', value: 100 - stats.total, color: 'text-blue-400', icon: Ticket },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-all"
          />
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Users className="w-10 h-10 mx-auto text-gray-700" />
            <p className="text-gray-500">
              {search ? 'No encontramos ese nombre' : 'Aún no hay participantes'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry, i) => (
              <motion.div
                key={entry.participantName + i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                      {entry.participantName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold">{entry.participantName}</span>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {entry.tickets.length} boleto{entry.tickets.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {entry.tickets.map((t) => (
                    <div
                      key={t.number}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        t.status === 'confirmed'
                          ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                          : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500'
                      }`}
                    >
                      {t.status === 'confirmed' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      #{String(t.number).padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA para participar */}
        <button
          onClick={() => window.location.href = '/registro'}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3.5 rounded-xl hover:scale-[1.02] transition-all"
        >
          Quiero participar también
        </button>
      </div>
    </main>
  )
}
