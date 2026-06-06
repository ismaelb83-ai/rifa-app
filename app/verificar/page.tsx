'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Loader2, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function VerificarPage() {
  const router = useRouter()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const pending = localStorage.getItem('pendingForm')
    if (!pending) {
      router.replace('/registro')
      return
    }
    setEmail(JSON.parse(pending).email)
    inputRefs.current[0]?.focus()
  }, [router])

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    if (newCode.every((d) => d !== '') && newCode.join('').length === 6) {
      verifyCode(newCode.join(''))
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newCode = pasted.split('')
      setCode(newCode)
      inputRefs.current[5]?.focus()
      verifyCode(pasted)
    }
  }

  async function verifyCode(token: string) {
    setLoading(true)
    setError('')
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })

      if (verifyError || !data.session) throw verifyError

      const accessToken = data.session.access_token
      const pending = JSON.parse(localStorage.getItem('pendingForm') ?? '{}')

      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(pending),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      localStorage.setItem('participant', JSON.stringify(result.participant))
      localStorage.setItem('sessionId', result.sessionId)
      localStorage.removeItem('pendingForm')

      router.push('/jugar')
    } catch {
      setError('Código incorrecto o expirado. Inténtalo de nuevo.')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setResent(false)
    try {
      await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      })
      setResent(true)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setResending(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Verifica tu correo</h1>
            <p className="text-gray-400 text-sm">Paso 2 de 3</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Icono y descripción */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="bg-blue-500/20 border border-blue-500/30 p-4 rounded-2xl">
                <Mail className="w-10 h-10 text-blue-400" />
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              Enviamos un código de 6 dígitos a
            </p>
            <p className="font-semibold text-white">{email}</p>
          </div>

          {/* Inputs del código */}
          <div className="space-y-3">
            <div
              className="flex gap-2 justify-center"
              onPaste={handlePaste}
            >
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={loading}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border bg-white/5 text-white focus:outline-none transition-all disabled:opacity-50
                    ${digit ? 'border-yellow-400/60 bg-yellow-400/10' : 'border-white/10'}
                    ${loading ? 'cursor-not-allowed' : 'focus:border-yellow-400/50'}
                  `}
                />
              ))}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando...
              </div>
            )}
          </div>

          {/* Reenviar código */}
          <div className="text-center space-y-2">
            {resent && (
              <p className="text-green-400 text-sm">✓ Código reenviado</p>
            )}
            <button
              onClick={handleResend}
              disabled={resending}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mx-auto transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {resending ? 'Reenviando...' : '¿No lo recibiste? Reenviar código'}
            </button>
          </div>

          <p className="text-center text-gray-600 text-xs">
            Revisa también tu carpeta de spam
          </p>
        </motion.div>
      </div>
    </main>
  )
}
