'use client'
// app/register/page.tsx
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { NexaLogo } from '@/components/NexaLogo'
import {
  Eye, EyeOff, User, Mail, Lock, CheckCircle,
  AlertCircle, Loader2, ShieldCheck, ArrowRight
} from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  })
  const [terms, setTerms] = useState({
    rules: false,
    noBot: false,
    age: false,
    privacy: false,
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1=info, 2=terms
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [mathChallenge, setMathChallenge] = useState(() => {
    const a = Math.floor(Math.random() * 10) + 1
    const b = Math.floor(Math.random() * 10) + 1
    return { a, b, answer: String(a + b) }
  })
  const [mathInput, setMathInput] = useState('')

  const allTermsChecked = Object.values(terms).every(Boolean)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  function verifyMath() {
    if (mathInput === mathChallenge.answer) {
      setCaptchaVerified(true)
    } else {
      const a = Math.floor(Math.random() * 10) + 1
      const b = Math.floor(Math.random() * 10) + 1
      setMathChallenge({ a, b, answer: String(a + b) })
      setMathInput('')
      setError('Jawaban salah. Coba lagi!')
    }
  }

  function validateStep1() {
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Email tidak valid'
    if (form.username.length < 3) return 'Username minimal 3 karakter'
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) return 'Username hanya boleh huruf, angka, underscore'
    if (form.password.length < 8) return 'Password minimal 8 karakter'
    if (!/[A-Z]/.test(form.password)) return 'Password harus ada huruf kapital'
    if (!/[0-9]/.test(form.password)) return 'Password harus ada angka'
    if (form.password !== form.confirmPassword) return 'Konfirmasi password tidak cocok'
    return null
  }

  function goToStep2() {
    const err = validateStep1()
    if (err) { setError(err); return }
    setStep(2)
    setError('')
  }

  async function handleSubmit() {
    if (!allTermsChecked) { setError('Centang semua persetujuan terlebih dahulu'); return }
    if (!captchaVerified) { setError('Verifikasi anti-bot terlebih dahulu'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          username: form.username,
          displayName: form.displayName || form.username,
          password: form.password,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Terjadi kesalahan')
      } else {
        router.push('/chat')
      }
    } catch {
      setError('Koneksi gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = () => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }

  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-400', 'bg-emerald-400']
  const strengthLabel = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat']
  const ps = passwordStrength()

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Blob decorations */}
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] opacity-10 animate-blob"
        style={{ background: 'radial-gradient(circle, #6272f1, transparent)', borderRadius: '50%' }} />
      <div className="absolute bottom-[-100px] left-[-100px] w-[350px] h-[350px] opacity-8 animate-blob"
        style={{ background: 'radial-gradient(circle, #a78bfa, transparent)', borderRadius: '50%', animationDelay: '3s' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="avatar-ring mb-4 shadow-nexa-lg">
            <div className="bg-dark-900 rounded-full p-1">
              <NexaLogo size={60} />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold gradient-text">Nexa Chat</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Buat akun dan mulai ngobrol global</p>
        </div>

        <div className="glass rounded-2xl p-6 shadow-nexa">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s ? 'btn-nexa text-white' : 'bg-dark-600 text-[var(--text-muted)]'
                }`}>{step > s ? '✓' : s}</div>
                {s < 2 && <div className={`flex-1 h-0.5 rounded transition-all ${step > s ? 'bg-nexa-600' : 'bg-dark-500'}`} />}
              </div>
            ))}
            <span className="text-xs text-[var(--text-secondary)] ml-2">
              {step === 1 ? 'Data Akun' : 'Persetujuan'}
            </span>
          </div>

          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  name="email" type="email" value={form.email}
                  onChange={handleChange} placeholder="Email"
                  className="nexa-input w-full pl-10 pr-4 py-3 text-sm"
                />
              </div>

              {/* Username */}
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-[var(--text-muted)] text-sm font-mono">@</span>
                <input
                  name="username" value={form.username}
                  onChange={handleChange} placeholder="Username"
                  className="nexa-input w-full pl-8 pr-4 py-3 text-sm"
                />
              </div>

              {/* Display name */}
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  name="displayName" value={form.displayName}
                  onChange={handleChange} placeholder="Nama Tampilan (opsional)"
                  className="nexa-input w-full pl-10 pr-4 py-3 text-sm"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  name="password" type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={handleChange} placeholder="Password"
                  className="nexa-input w-full pl-10 pr-10 py-3 text-sm"
                />
                <button onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3.5 text-[var(--text-muted)] hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength */}
              {form.password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded transition-all ${i <= ps ? strengthColor[ps] : 'bg-dark-500'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{strengthLabel[ps]}</p>
                </div>
              )}

              {/* Confirm password */}
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  name="confirmPassword" type="password" value={form.confirmPassword}
                  onChange={handleChange} placeholder="Konfirmasi Password"
                  className="nexa-input w-full pl-10 pr-4 py-3 text-sm"
                />
                {form.confirmPassword && (
                  <div className="absolute right-3 top-3.5">
                    {form.password === form.confirmPassword
                      ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                      : <AlertCircle className="w-4 h-4 text-red-400" />}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button onClick={goToStep2} className="btn-nexa w-full py-3 rounded-xl font-display font-semibold flex items-center justify-center gap-2">
                Lanjut <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-nexa-400" />
                <h2 className="font-display font-semibold">Persetujuan & Verifikasi</h2>
              </div>

              {/* Terms checkboxes */}
              <div className="space-y-3">
                {[
                  { key: 'rules', label: 'Saya setuju mengikuti aturan komunitas Nexa Chat dan tidak akan menyebarkan konten berbahaya, SARA, atau ilegal.' },
                  { key: 'noBot', label: 'Saya bukan bot/spam. Saya adalah manusia nyata yang menggunakan akun ini secara jujur dan bertanggung jawab.' },
                  { key: 'age', label: 'Saya berusia minimal 13 tahun dan memahami platform ini untuk komunikasi global.' },
                  { key: 'privacy', label: 'Saya telah membaca dan menyetujui Kebijakan Privasi serta Syarat & Ketentuan Nexa Chat.' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="nexa-checkbox mt-0.5"
                      checked={terms[key as keyof typeof terms]}
                      onChange={e => setTerms(prev => ({ ...prev, [key]: e.target.checked }))}
                    />
                    <span className="text-sm text-[var(--text-secondary)] group-hover:text-white transition-colors leading-relaxed">
                      {label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Anti-bot math challenge */}
              <div className="bg-dark-700 rounded-xl p-4 border border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)] mb-3 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verifikasi Anti-Bot
                </p>
                {!captchaVerified ? (
                  <>
                    <p className="text-sm mb-3">
                      Berapa hasil dari{' '}
                      <span className="font-mono font-bold text-nexa-400 text-lg">
                        {mathChallenge.a} + {mathChallenge.b}
                      </span>
                      {' '}= ?
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={mathInput}
                        onChange={e => setMathInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && verifyMath()}
                        placeholder="Jawaban..."
                        className="nexa-input flex-1 px-3 py-2 text-sm"
                      />
                      <button onClick={verifyMath}
                        className="btn-nexa px-4 py-2 rounded-xl text-sm font-semibold">
                        Cek
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Terverifikasi! Anda bukan bot 🎉</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-dark-600 transition-colors">
                  ← Kembali
                </button>
                <button onClick={handleSubmit} disabled={loading || !allTermsChecked || !captchaVerified}
                  className="flex-1 btn-nexa py-3 rounded-xl font-display font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-[var(--text-muted)] mt-4">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-nexa-400 hover:text-nexa-300 font-medium transition-colors">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
