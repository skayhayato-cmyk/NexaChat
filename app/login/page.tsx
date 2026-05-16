'use client'
// app/login/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { NexaLogo } from '@/components/NexaLogo'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.identifier || !form.password) { setError('Isi semua field'); return }
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Email/username atau password salah')
      } else {
        router.push('/chat')
        router.refresh()
      }
    } catch {
      setError('Koneksi gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-80px] left-[-80px] w-[300px] h-[300px] opacity-10 animate-blob"
        style={{ background: 'radial-gradient(circle, #6272f1, transparent)', borderRadius: '50%' }} />
      <div className="absolute bottom-[-80px] right-[-80px] w-[280px] h-[280px] opacity-8 animate-blob"
        style={{ background: 'radial-gradient(circle, #38bdf8, transparent)', borderRadius: '50%', animationDelay: '4s' }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo + title */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="avatar-ring shadow-nexa-lg">
              <div className="bg-dark-900 rounded-full p-1">
                <NexaLogo size={64} />
              </div>
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-dark-900"></span>
          </div>
          <h1 className="font-display text-3xl font-bold gradient-text">Nexa Chat</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Global Chat Platform</p>
        </div>

        <div className="glass rounded-2xl p-6 shadow-nexa">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-nexa-400" />
            <h2 className="font-display font-semibold text-lg">Masuk ke Nexa</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
              <input
                name="identifier"
                value={form.identifier}
                onChange={handleChange}
                placeholder="Email atau @username"
                className="nexa-input w-full pl-10 pr-4 py-3 text-sm"
                autoComplete="username"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                className="nexa-input w-full pl-10 pr-10 py-3 text-sm"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3.5 text-[var(--text-muted)] hover:text-white transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl p-3 animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-nexa w-full py-3 rounded-xl font-display font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Masuk...' : 'Masuk ke Chat'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-muted)] mt-4">
            Belum punya akun?{' '}
            <Link href="/register" className="text-nexa-400 hover:text-nexa-300 font-medium transition-colors">
              Daftar gratis
            </Link>
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { icon: '💬', label: 'Global Chat' },
            { icon: '📁', label: 'File & Media' },
            { icon: '🎙️', label: 'Voice Note' },
          ].map(f => (
            <div key={f.label} className="glass rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-xs text-[var(--text-muted)]">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
