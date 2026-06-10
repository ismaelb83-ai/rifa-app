'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ShoppingCart, RefreshCw } from 'lucide-react'

type TicketDisplay = {
  number: number
  status: 'available' | 'taken' | 'scratching' | 'revealed' | 'confirmed'
  displayPrice?: number
}

type CartItem = {
  number: number
  price: number
}

type Participant = {
  id: string
  name: string
}

const MAX_ATTEMPTS = 2
const MAX_TICKETS = 5

export default function JugarPage() {
  const router = useRouter()
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [tickets, setTickets] = useState<TicketDisplay[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS)
  const [currentTicket, setCurrentTicket] = useState<TicketDisplay | null>(null)
  const [phase, setPhase] = useState<'grid' | 'revealed' | 'decision'>('grid')
  const [loading, setLoading] = useState(true)
  const [scratching, setScratching] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [roundStarted, setRoundStarted] = useState(false)
  const [error, setError] = useState('')
  const intentionalNav = useRef(false)

  const loadGrid = useCallback(async (sid: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tickets/grid?sessionId=${sid}`)
      if (!res.ok) {
        // Sesión inválida — regresar al registro
        window.location.href = '/registro'
        return
      }
      const data = await res.json()
      // El grid ahora devuelve también el participante desde el servidor
      if (data.participant) setParticipant(data.participant)
      setTickets(data.tickets)
    } catch {
      setError('Error cargando el tablero')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // sessionId viene de la URL (navegación directa) o de localStorage (botón atrás)
    const params = new URLSearchParams(window.location.search)
    const sid = params.get('s') || localStorage.getItem('sessionId')

    if (!sid) {
      window.location.href = '/registro'
      return
    }

    setSessionId(sid)
    localStorage.setItem('sessionId', sid)

    const savedCart = localStorage.getItem('cart')
    if (savedCart) setCart(JSON.parse(savedCart))

    // loadGrid obtiene tickets Y participante del servidor — sin depender de localStorage
    loadGrid(sid)
  }, [loadGrid]) // eslint-disable-line react-hooks/exhaustive-deps

  // Liberar ticket en rasca activo si el usuario cierra el navegador
  // No cancela si la navegación fue intencional (ir al resumen)
  useEffect(() => {
    if (!sessionId) return
    function handleUnload() {
      if (intentionalNav.current) return
      navigator.sendBeacon(
        '/api/tickets/cancel-session',
        JSON.stringify({ sessionId })
      )
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [sessionId])

  async function handleScratch(ticket: TicketDisplay) {
    if (ticket.status !== 'available' || scratching || phase !== 'grid') return
    if (cart.length >= MAX_TICKETS) {
      setError(`Máximo ${MAX_TICKETS} boletos por sesión`)
      return
    }
    setRoundStarted(true)

    setScratching(true)
    setError('')
    try {
      const res = await fetch('/api/tickets/scratch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: ticket.number, sessionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const revealed: TicketDisplay = {
        number: ticket.number,
        status: 'revealed',
        displayPrice: data.price,
      }
      setCurrentTicket(revealed)
      setTickets((prev) =>
        prev.map((t) =>
          t.number === ticket.number ? { ...t, status: 'scratching' } : t
        )
      )
      setPhase('revealed')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al rascar'
      if (msg === 'Sesión inválida') {
        localStorage.clear()
        window.location.href = '/registro'
        return
      }
      setError(msg)
    } finally {
      setScratching(false)
    }
  }

  async function handleAccept() {
    if (!currentTicket || !currentTicket.displayPrice || accepting) return
    setAccepting(true)
    try {
      const newCart = [...cart, { number: currentTicket.number, price: currentTicket.displayPrice }]
      setCart(newCart)
      localStorage.setItem('cart', JSON.stringify(newCart))

      await fetch('/api/tickets/confirm-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: currentTicket.number, sessionId }),
      })

      setTickets((prev) =>
        prev.map((t) =>
          t.number === currentTicket.number ? { ...t, status: 'confirmed', displayPrice: currentTicket.displayPrice } : t
        )
      )
      setCurrentTicket(null)
      setAttemptsLeft(MAX_ATTEMPTS)
      setPhase('decision')
    } finally {
      setAccepting(false)
    }
  }

  async function handleCancel() {
    if (!currentTicket) return
    await fetch('/api/tickets/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: currentTicket.number, sessionId }),
    })

    const newAttempts = attemptsLeft - 1
    setAttemptsLeft(newAttempts)
    setCurrentTicket(null)

    if (newAttempts <= 0) {
      setPhase('decision')
      setAttemptsLeft(MAX_ATTEMPTS)
    } else {
      setPhase('grid')
      loadGrid(sessionId)
    }
  }

  async function handleExit() {
    // Cancelar cualquier ticket reservado pendiente antes de salir
    if (currentTicket) {
      await fetch('/api/tickets/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: currentTicket.number, sessionId }),
      })
    }
    localStorage.removeItem('cart')
    localStorage.removeItem('participant')
    localStorage.removeItem('sessionId')
    window.location.href = '/registro'
  }

  function handleBuyAnother() {
    setPhase('grid')
    setAttemptsLeft(MAX_ATTEMPTS)
    setRoundStarted(false)
    loadGrid(sessionId)
  }

  function handleGoToSummary() {
    intentionalNav.current = true
    localStorage.setItem('cart', JSON.stringify(cart))
    if (participant) localStorage.setItem('participant', JSON.stringify(participant))
    window.location.href = '/resumen'
  }

  const confirmedNumbers = tickets.filter((t) => t.status === 'confirmed').map((t) => t.number)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col px-4 py-8">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Elige tu número</h1>
            <p className="text-gray-400 text-xs">Hola, {participant?.name} 👋</p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={handleGoToSummary}
              className="flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              <ShoppingCart className="w-4 h-4" />
              {cart.length} boleto{cart.length > 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* Cancelar ronda — solo visible antes de rascar el primer número */}
        {phase === 'grid' && !roundStarted && cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between"
          >
            <p className="text-gray-400 text-sm">¿Ya no quieres otro boleto?</p>
            <button
              onClick={handleGoToSummary}
              className="text-yellow-400 text-sm font-semibold hover:text-yellow-300 transition-colors"
            >
              Ver mi resumen →
            </button>
          </motion.div>
        )}

        {/* Intentos restantes */}
        {phase === 'grid' && (
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <span className="text-sm text-gray-300">Intentos disponibles</span>
            <div className="flex gap-1.5">
              {[...Array(MAX_ATTEMPTS)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${i < attemptsLeft ? 'bg-yellow-400' : 'bg-white/10'}`}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* FASE: Revealed */}
        <AnimatePresence mode="wait">
          {phase === 'revealed' && currentTicket && (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-6"
            >
              <div>
                <p className="text-gray-400 text-sm mb-1">Número {String(currentTicket.number).padStart(2, '0')}</p>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="reveal-animation"
                >
                  <p className="text-6xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    ${currentTicket.displayPrice}
                  </p>
                </motion.div>
                <p className="text-gray-400 text-sm mt-2">es lo que pagas por este boleto</p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full font-bold py-3.5 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100 hover:scale-[1.02] active:scale-[0.98] text-white"
                  style={{ background: 'linear-gradient(135deg,#00a651,#007a3a)', boxShadow: '0 4px 20px rgba(0,166,81,0.4)' }}
                >
                  {accepting ? 'Guardando...' : `⚽ ¡Lo acepto! — $${currentTicket.displayPrice}`}
                </button>

                {attemptsLeft > 1 ? (
                  <button
                    onClick={handleCancel}
                    className="w-full bg-white/5 border border-white/10 text-gray-300 font-medium py-3 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Probar suerte con otro ({attemptsLeft - 1} intento{attemptsLeft - 1 > 1 ? 's' : ''} más)
                  </button>
                ) : (
                  <p className="text-gray-600 text-xs text-center">Este es tu último intento, debes aceptar</p>
                )}
              </div>
            </motion.div>
          )}

          {/* FASE: Decision (aceptó o se acabaron intentos) */}
          {phase === 'decision' && (
            <motion.div
              key="decision"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4"
            >
              <div className="text-center">
                <p className="text-2xl font-bold">🎉</p>
                <p className="font-semibold mt-1">
                  {cart.length === 1 ? 'Tienes 1 boleto' : `Tienes ${cart.length} boletos`}
                </p>
                <p className="text-gray-400 text-sm mt-0.5">¿Quieres comprar otro?</p>
              </div>

              <div className="space-y-2">
                {cart.length < MAX_TICKETS && (
                  <button
                    onClick={handleBuyAnother}
                    className="w-full bg-white/5 border border-yellow-400/30 text-yellow-400 font-medium py-3 rounded-xl hover:bg-yellow-400/10 transition-all"
                  >
                    Comprar otro número
                  </button>
                )}
                <button
                  onClick={handleGoToSummary}
                  className="w-full font-bold py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-white"
                  style={{ background: 'linear-gradient(135deg,#00a651,#007a3a)', boxShadow: '0 4px 20px rgba(0,166,81,0.3)' }}
                >
                  🏆 Ver mi resumen y pagar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GRID de números */}
        {phase === 'grid' && (
          <div>
            <p className="text-gray-400 text-xs mb-3 text-center">
              Toca un número disponible para rascar
            </p>
            <div className="grid grid-cols-10 gap-1.5">
              {tickets.map((ticket) => {
                const isConfirmedInCart = confirmedNumbers.includes(ticket.number)
                const isTaken = ticket.status === 'taken'
                const isAvailable = ticket.status === 'available'

                return (
                  <motion.button
                    key={ticket.number}
                    whileTap={isAvailable ? { scale: 0.88 } : {}}
                    onClick={() => handleScratch(ticket)}
                    disabled={!isAvailable || scratching}
                    className="aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                    style={
                      isConfirmedInCart
                        ? {
                            background: 'linear-gradient(135deg,#c9a227,#7a5800)',
                            border: '1.5px solid #d4a017',
                            boxShadow: '0 0 10px rgba(212,160,23,0.5)',
                            color: '#fff8dc',
                          }
                        : isTaken
                        ? {
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.15)',
                            cursor: 'not-allowed',
                            textDecoration: 'line-through',
                          }
                        : isAvailable
                        ? {
                            background: 'linear-gradient(135deg,#1a5c2a,#0d3a1a)',
                            border: '1.5px solid #00a651',
                            boxShadow: '0 0 6px rgba(0,166,81,0.35)',
                            color: '#7dffb3',
                          }
                        : {}
                    }
                  >
                    {isConfirmedInCart ? '✓' : String(ticket.number).padStart(2, '0')}
                  </motion.button>
                )
              })}
            </div>

            {/* Leyenda */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: 'linear-gradient(135deg,#1a5c2a,#0d3a1a)', border: '1.5px solid #00a651' }} />
                <span className="text-green-400">Disponible</span>
              </div>
              {cart.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ background: 'linear-gradient(135deg,#c9a227,#7a5800)', border: '1.5px solid #d4a017' }} />
                  <span className="text-yellow-400">Mis boletos ✓</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
                <span className="text-gray-600">Tomado</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
