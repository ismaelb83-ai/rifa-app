'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, DollarSign, Ticket, LogOut, Search, Check, Home } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type ParticipantEntry = {
  id: string
  name: string
  phone: string
  email: string | null
  tickets: {
    id: string
    number: number
    price: number
    status: 'reserved' | 'confirmed'
  }[]
  total: number
  allConfirmed: boolean
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const router = useRouter()
  const [pwError, setPwError] = useState('')
  const [entries, setEntries] = useState<ParticipantEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [confirming, setConfirming] = useState<string | null>(null)
  const [stats, setStats] = useState({
    confirmed: 0,
    reserved: 0,
    available: 0,
    collected: 0,
    target: 10300,
  })

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAuthenticated(true)
      fetchData()
    } else {
      setPwError('Contraseña incorrecta')
    }
  }

  async function fetchData() {
    setLoading(true)
    try {
      const { data: participants } = await supabase
        .from('participants')
        .select('id, name, phone, email')
        .order('created_at', { ascending: false })

      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, number, price, status, participant_id')
        .in('status', ['reserved', 'confirmed'])

      if (!participants || !tickets) return

      const byParticipant: Record<string, ParticipantEntry> = {}
      for (const p of participants) {
        byParticipant[p.id] = { ...p, tickets: [], total: 0, allConfirmed: true }
      }
      for (const t of tickets) {
        if (!t.participant_id || !byParticipant[t.participant_id]) continue
        byParticipant[t.participant_id].tickets.push(t as ParticipantEntry['tickets'][0])
        byParticipant[t.participant_id].total += t.price
        if (t.status !== 'confirmed') byParticipant[t.participant_id].allConfirmed = false
      }

      const list = Object.values(byParticipant).filter((e) => e.tickets.length > 0)
      setEntries(list)

      const confirmed = tickets.filter((t) => t.status === 'confirmed')
      setStats({
        confirmed: confirmed.length,
        reserved: tickets.filter((t) => t.status === 'reserved').length,
        available: 100 - tickets.length,
        collected: confirmed.reduce((s, t) => s + t.price, 0),
        target: 10300,
      })
    } finally {
      setLoading(false)
    }
  }

  async function confirmPayment(participantId: string) {
    setConfirming(participantId)
    try {
      const res = await fetch('/api/admin/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId }),
      })
      if (res.ok) await fetchData()
    } finally {
      setConfirming(null)
    }
  }

  const filtered = entries.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.phone.includes(search)
  )

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Panel de administración</h1>
            <p className="text-gray-400 text-sm mt-1">Acceso restringido</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-all"
            />
            {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3.5 rounded-xl"
            >
              Entrar
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col px-4 py-8">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = '/'}
              className="text-gray-400 hover:text-white flex items-center gap-1.5 text-sm"
            >
              <Home className="w-4 h-4" />
              Inicio
            </button>
            <button
              onClick={() => setAuthenticated(false)}
              className="text-gray-400 hover:text-white flex items-center gap-1.5 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 col-span-2">
            <div className="flex justify-between mb-2">
              <div className="flex items-center gap-2 text-gray-300">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Recaudado</span>
              </div>
              <span className="text-white font-bold">
                ${stats.collected.toLocaleString()} / ${stats.target.toLocaleString()}
              </span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.collected / stats.target) * 100, 100)}%` }}
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
              />
            </div>
            <p className="text-yellow-400 text-xs mt-1.5 text-right font-semibold">
              {Math.round((stats.collected / stats.target) * 100)}%
            </p>
          </div>

          {[
            { label: 'Confirmados', value: stats.confirmed, color: 'text-green-400', icon: CheckCircle },
            { label: 'Reservados', value: stats.reserved, color: 'text-yellow-400', icon: Clock },
            { label: 'Disponibles', value: stats.available, color: 'text-blue-400', icon: Ticket },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o celular..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-all"
          />
        </div>

        {/* Lista de participantes */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`bg-white/5 border rounded-xl p-4 space-y-3 ${
                  entry.allConfirmed ? 'border-green-500/20' : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{entry.name}</p>
                    <p className="text-gray-400 text-sm">{entry.phone}</p>
                    {entry.email && <p className="text-gray-500 text-xs">{entry.email}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-400">${entry.total}</p>
                    <p className="text-gray-500 text-xs">{entry.tickets.length} boleto{entry.tickets.length > 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {entry.tickets.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        t.status === 'confirmed'
                          ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                          : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500'
                      }`}
                    >
                      {t.status === 'confirmed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      #{String(t.number).padStart(2, '0')} · ${t.price}
                    </div>
                  ))}
                </div>

                {!entry.allConfirmed && (
                  <button
                    onClick={() => confirmPayment(entry.id)}
                    disabled={confirming === entry.id}
                    className="w-full bg-green-500/15 border border-green-500/30 text-green-400 font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-green-500/25 transition-all disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {confirming === entry.id ? 'Confirmando...' : 'Confirmar pago'}
                  </button>
                )}

                {entry.allConfirmed && (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Pago confirmado
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
