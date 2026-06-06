'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Phone, Mail, ChevronRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type PhoneStatus = 'idle' | 'checking' | 'taken' | 'free'

export default function RegistroPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', apellido: '', phone: '', email: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus>('idle')

  useEffect(() => {
    async function checkExistingSession() {
      const existingSession = localStorage.getItem('sessionId')
      const existingParticipant = localStorage.getItem('participant')

      if (existingSession && existingParticipant) {
        // Verificar que la sesión realmente existe en la DB
        const { data } = await supabase
          .from('game_sessions')
          .select('id')
          .eq('id', existingSession)
          .maybeSingle()

        if (data) {
          window.location.href = `/jugar?s=${existingSession}`
          return
        }
        // Sesión no existe en DB (reset o expirada) — limpiar todo
        localStorage.clear()
      }

      localStorage.removeItem('cart')
      localStorage.removeItem('pendingForm')
    }
    checkExistingSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function checkPhone(phone: string) {
    const clean = phone.replace(/\s|-/g, '')
    if (!/^\d{10}$/.test(clean)) return
    setPhoneStatus('checking')
    const { data } = await supabase
      .from('participants')
      .select('name, tickets(status)')
      .eq('phone', clean)
      .maybeSingle()

    if (!data) {
      setPhoneStatus('free')
      return
    }

    const hasTickets = (data.tickets as { status: string }[])?.some(
      (t) => t.status === 'confirmed' || t.status === 'reserved'
    )

    if (hasTickets) {
      setPhoneStatus('taken')
    } else {
      setPhoneStatus('free')
    }
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Tu nombre es requerido'
    if (!form.apellido.trim()) errs.apellido = 'Tu apellido es requerido'
    if (!form.phone.trim()) errs.phone = 'Tu celular es requerido'
    else if (!/^\d{10}$/.test(form.phone.replace(/\s|-/g, '')))
      errs.phone = 'Ingresa 10 dígitos'
    if (phoneStatus === 'taken') errs.phone = 'Este número ya está registrado'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))
      errs.email = 'Correo inválido'
    return errs
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          name: `${form.name.trim()} ${form.apellido.trim()}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem('sessionId', data.sessionId)
      // Redirigir directamente sin dependencia de evento del formulario
      setTimeout(() => {
        window.location.href = `/jugar?s=${data.sessionId}`
      }, 100)
    } catch {
      setErrors({ general: 'Ocurrió un error. Inténtalo de nuevo.' })
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Tus datos</h1>
            <p className="text-gray-400 text-sm">Para contactarte si ganas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['Datos', 'Elige número', 'Pago'].map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-1.5 ${i === 0 ? 'text-yellow-400' : 'text-gray-600'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-black' : 'bg-white/10'}`}>
                  {i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step}</span>
              </div>
              {i < 2 && <div className="flex-1 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        <div className="space-y-5">
          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {errors.general}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Nombre</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="¿Cómo te llamas?"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-all"
              />
            </div>
            {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Apellido</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="¿Cuál es tu apellido?"
                value={form.apellido}
                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-all"
              />
            </div>
            {errors.apellido && <p className="text-red-400 text-xs">{errors.apellido}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Celular</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="tel"
                placeholder="10 dígitos"
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value })
                  setPhoneStatus('idle')
                  setErrors((prev) => ({ ...prev, phone: '' }))
                }}
                onBlur={() => checkPhone(form.phone)}
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 pl-10 pr-10 text-white placeholder-gray-600 focus:outline-none transition-all ${
                  phoneStatus === 'taken'
                    ? 'border-red-500/60 bg-red-500/5'
                    : phoneStatus === 'free'
                    ? 'border-green-500/40'
                    : 'border-white/10 focus:border-yellow-400/50'
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {phoneStatus === 'checking' && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                {phoneStatus === 'taken' && <AlertCircle className="w-4 h-4 text-red-400" />}
                {phoneStatus === 'free' && <CheckCircle className="w-4 h-4 text-green-400" />}
              </div>
            </div>

            {phoneStatus === 'taken' && (
                <div
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-1"
                >
                  <p className="text-red-400 text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Número ya registrado
                  </p>
                  <p className="text-red-300/80 text-xs">
                    Este número ya tiene boletos asignados. Comunícate con el organizador.
                  </p>
                </div>
              )}

            {errors.phone && phoneStatus !== 'taken' && (
              <p className="text-red-400 text-xs">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">
              Correo <span className="text-gray-600 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="tu@correo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-all"
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || phoneStatus === 'taken' || phoneStatus === 'checking'}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (<>Elegir mi número <ChevronRight className="w-5 h-5" /></>)}
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs">
          Tus datos solo se usan para contactarte si ganas 🎉
        </p>
      </div>
    </main>
  )
}
