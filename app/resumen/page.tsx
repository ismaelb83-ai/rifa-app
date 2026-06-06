'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, MessageCircle, PartyPopper } from 'lucide-react'

type CartItem = {
  number: number
  price: number
}

type Participant = {
  id: string
  name: string
  phone: string
}

export default function ResumenPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    const savedParticipant = localStorage.getItem('participant')
    if (!savedCart || !savedParticipant) {
      window.location.href = '/'
      return
    }
    setCart(JSON.parse(savedCart))
    setParticipant(JSON.parse(savedParticipant))
  }, [router])

  const total = cart.reduce((sum, item) => sum + item.price, 0)

  function buildWhatsAppMessage() {
    const lines = cart.map(
      (item) => `• Boleto ${String(item.number).padStart(2, '0')} → $${item.price}`
    )
    return encodeURIComponent(
      `¡Participé en la rifa! 🎟️\n\n${lines.join('\n')}\n\nTotal a pagar: $${total}\n\nYo también quiero participar: ${window.location.origin}`
    )
  }

  function handleShareWhatsApp() {
    window.open(`https://wa.me/?text=${buildWhatsAppMessage()}`, '_blank')
  }

  function handleFinish() {
    localStorage.removeItem('cart')
    localStorage.removeItem('participant')
    localStorage.removeItem('sessionId')
    setDone(true)
  }

  if (cart.length === 0) return null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        <AnimatePresence mode="wait">

          {/* PANTALLA FINAL: después de finalizar */}
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="flex justify-center"
              >
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-full shadow-lg shadow-orange-500/30">
                  <PartyPopper className="w-12 h-12 text-white" />
                </div>
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">¡Gracias, {participant?.name}!</h2>
                <p className="text-gray-400">
                  Tu participación está registrada. En cuanto confirmemos tu pago, aparecerás en la lista oficial.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-gray-300 space-y-1">
                {cart.map((item) => (
                  <div key={item.number} className="flex justify-between">
                    <span>Boleto #{String(item.number).padStart(2, '0')}</span>
                    <span className="font-semibold text-white">${item.price}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 mt-2 pt-2 flex justify-between font-bold text-white">
                  <span>Total</span>
                  <span className="text-yellow-400">${total}</span>
                </div>
              </div>

              <div className="space-y-3">
                {/* WHATSAPP COMPROBANTE — activar cuando esté listo el módulo
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5" />
                  Enviar comprobante por WhatsApp
                </button>
                */}

                <button
                  onClick={() => window.location.href = '/lista'}
                  className="w-full bg-white/5 border border-white/10 text-gray-300 font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                >
                  Ver lista de participantes
                </button>

                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full text-gray-600 text-sm py-2 hover:text-gray-400 transition-colors"
                >
                  Volver al inicio
                </button>
              </div>
            </motion.div>

          ) : (

            /* PANTALLA DE RESUMEN: antes de finalizar */
            <motion.div
              key="resumen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-2 py-4">
                <CheckCircle className="w-14 h-14 text-green-400 mx-auto" />
                <h1 className="text-2xl font-bold">¡Listo, {participant?.name}!</h1>
                <p className="text-gray-400 text-sm">Estos son tus boletos. Solo falta el pago.</p>
              </div>

              {/* Lista de boletos */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <p className="text-sm font-semibold text-gray-300">Boletos seleccionados</p>
                </div>
                <div className="divide-y divide-white/5">
                  {cart.map((item, i) => (
                    <motion.div
                      key={item.number}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i }}
                      className="flex items-center justify-between px-4 py-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-xs font-bold">
                          {String(item.number).padStart(2, '0')}
                        </div>
                        <span className="text-gray-300 text-sm">Boleto #{String(item.number).padStart(2, '0')}</span>
                      </div>
                      <span className="font-bold text-white">${item.price}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="p-4 bg-white/5 flex items-center justify-between">
                  <span className="font-semibold text-gray-300">Total a pagar</span>
                  <span className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    ${total}
                  </span>
                </div>
              </div>

              {/* Instrucciones de pago */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-semibold text-blue-300">¿Cómo pagar?</p>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>Realiza tu transferencia por <strong>${total}</strong> a:</p>
                  <div className="bg-white/5 rounded-xl p-3 space-y-1 text-xs font-mono">
                    <p>Banco: <span className="text-white">— configura aquí —</span></p>
                    <p>Cuenta: <span className="text-white">— configura aquí —</span></p>
                    <p>CLABE: <span className="text-white">— configura aquí —</span></p>
                    <p>Titular: <span className="text-white">— configura aquí —</span></p>
                  </div>
                  <p className="text-gray-400 text-xs">
                    Envía tu comprobante por WhatsApp. Tu boleto se confirma cuando validemos el pago.
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="space-y-3">
                {/* WHATSAPP RESUMEN — activar cuando esté listo el módulo
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/20"
                >
                  <MessageCircle className="w-5 h-5" />
                  Compartir resumen por WhatsApp
                </button>
                */}

                {/* Banner de invitación */}
                <div
                  className="w-full rounded-2xl p-4 space-y-3"
                  style={{ background: 'linear-gradient(135deg, #1a3a2a 0%, #0d2b19 100%)', border: '1px solid rgba(0,166,81,0.3)' }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚽</span>
                    <div className="space-y-1">
                      <p className="text-white font-bold text-sm">¿Tienes amigos que quieran participar?</p>
                      <p className="text-green-300/80 text-xs leading-relaxed">
                        Quedan números disponibles — ayúdalos a conseguir el suyo antes de que se agoten!
                      </p>
                    </div>
                  </div>
                  {/* WHATSAPP — activar cuando esté listo el módulo
                  <button
                    onClick={() => {
                      const msg = encodeURIComponent(
                        `⚽ ¡Participa en la Rifa Mundialista!\n\nPremio: Álbum Panini FIFA World Cup 2026 + 130 sobres\n\nRasca tu número y descubre cuánto pagas. Desde $10 🎟️\n\n👉 ${window.location.origin}`
                      )
                      window.open(`https://wa.me/?text=${msg}`, '_blank')
                    }}
                    className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
                    style={{ background: '#25D366', color: 'white' }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Compartir por WhatsApp
                  </button>
                  */}
                </div>

                <button
                  onClick={handleFinish}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 rounded-xl active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20"
                >
                  Finalizar ✓
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  )
}
