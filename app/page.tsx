'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Users, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/* COUNTDOWN — activar cuando se acerque la fecha del sorteo
const DEADLINE_MS = 1781222399000

function calcTimeLeft() {
  const diff = DEADLINE_MS - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft)
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    function tick() {
      setTimeLeft(calcTimeLeft())
      timeout = setTimeout(tick, 1000)
    }
    tick()
    return () => clearTimeout(timeout)
  }, [])
  return timeLeft
}
*/

export default function LandingPage() {
  const [soldCount, setSoldCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed')
      setSoldCount(count ?? 0)
      setLoading(false)
    }
    fetchStats()
  }, [])

  const progress = Math.round((soldCount / 100) * 100)
  const remaining = 100 - soldCount

  return (
    <main className="pitch-bg min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Decoración de fondo — gotas estilo Panini */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: `${(i % 4) * 14 + 10}px`,
              height: `${(i % 4) * 14 + 10}px`,
              top: `${(i * 41 + 7) % 100}%`,
              left: `${(i * 59 + 13) % 100}%`,
              background: i % 3 === 0 ? '#e30613' : i % 3 === 1 ? '#d4a017' : '#00a651',
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <span className="bg-[#e30613]/20 text-red-400 text-sm font-bold px-4 py-1.5 rounded-full border border-red-500/30 tracking-wide uppercase">
            ⚽ Rifa Mundialista 2026
          </span>
        </motion.div>

        {/* Premio hero */}
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-4"
        >
          <div className="flex justify-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-[#d4a017] to-[#7a5800] p-5 rounded-full shadow-2xl shadow-yellow-600/30">
                <Trophy className="w-14 h-14 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 text-2xl">👨</span>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight leading-tight">
              Rifa
              <br />
              <span className="bg-gradient-to-r from-[#d4a017] to-[#f5c842] bg-clip-text text-transparent">
                Día del Padre
              </span>
            </h1>
            <p className="text-gray-400 text-sm">3 premios increíbles</p>
          </div>

          {/* Contenido del premio */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: '🔥', label: '1er Premio', sub: 'Asador + Carne' },
              { icon: '🥃', label: '2do Premio', sub: 'Whiskey + Botana' },
              { icon: '⌚', label: '3er Premio', sub: 'Reloj + Billetera' },
            ].map((item) => (
              <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-white font-bold text-sm mt-1">{item.label}</p>
                <p className="text-gray-500 text-xs">{item.sub}</p>
              </div>
            ))}
          </div>

        </motion.div>

        {/* COUNTDOWN — activar cuando se acerque la fecha
        <motion.div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest">
            ⏱ Sorteo el 11 de junio, 2026
          </p>
          <div className="flex justify-center gap-2">
            {[
              { value: days, label: 'días' },
              { value: hours, label: 'hrs' },
              { value: minutes, label: 'min' },
              { value: seconds, label: 'seg' },
            ].map(({ value, label }) => (
              <div key={label} className="countdown-digit">
                <p className="text-2xl font-black text-[#00a651] tabular-nums leading-none">
                  {String(value).padStart(2, '0')}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
        */}

        {/* Fecha del sorteo — texto simple mientras no hay countdown */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            ⏱ Sorteo: <span className="text-white font-semibold">11 de junio, 2026</span>
          </p>
        </div>

        {/* Progreso */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3"
        >
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300 font-medium">🎟️ Boletos vendidos</span>
            <span className="font-bold text-white">{soldCount} / 100</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #00a651, #d4a017)' }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">{loading ? '...' : `${remaining} disponibles`}</span>
            <span className="font-bold" style={{ color: '#d4a017' }}>{progress}% vendido</span>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-3 gap-2"
        >
          {[
            { label: 'Mínimo', value: '$50', color: '#00a651' },
            { label: 'Máximo', value: '$300', color: '#e30613' },
            { label: 'Boletos', value: '100', color: '#d4a017' },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Cómo funciona */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3"
        >
          <p className="text-sm font-semibold text-gray-300">¿Cómo funciona?</p>
          {[
            '🎯 Elige un número del tablero y rásca para ver cuánto pagas',
            '🎲 Tienes hasta 2 intentos — ¡cada rasca cambia los precios!',
            '🛒 Puedes comprar varios boletos en una sola sesión',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-sm leading-relaxed text-gray-400">{step}</span>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <div className="space-y-3">
          {remaining === 0 ? (
            <div
              className="w-full rounded-2xl px-6 py-5 flex flex-col items-center gap-1 opacity-50 cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #00a651 0%, #007a3a 50%, #00a651 100%)' }}
            >
              <span className="text-3xl">⚽</span>
              <span className="text-white font-black text-xl tracking-tight">Rifa agotada</span>
            </div>
          ) : (
            <Link
              href="/registro"
              className="w-full rounded-2xl overflow-hidden block active:opacity-80 transition-opacity"
              style={{ boxShadow: '0 8px 32px rgba(0,166,81,0.45)', background: 'linear-gradient(135deg, #00a651 0%, #007a3a 50%, #00a651 100%)' }}
            >
              <div className="px-6 py-5 flex flex-col items-center gap-1">
                <span className="text-3xl">🎁</span>
                <span className="text-white font-black text-xl tracking-tight">¡Quiero participar!</span>
                <span className="text-green-200 text-xs font-medium">
                  Toca aquí para elegir tu número de la suerte
                </span>
              </div>
            </Link>
          )}

          <Link
            href="/lista"
            className="btn-secondary w-full flex items-center justify-center gap-2 block text-center active:opacity-80 transition-opacity"
          >
            <Users className="w-4 h-4 inline mr-1" />
            Ver quién está participando
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-700 text-xs pb-2">
          🇲🇽 Somos México · FIFA World Cup 2026™
        </p>
      </div>
    </main>
  )
}
