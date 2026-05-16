'use client'
// components/ProfileModal.tsx
import { useState, useRef } from 'react'
import { X, Camera, Loader2, Check, AlertCircle, User, FileText, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  user: any
  onClose: () => void
  onUpdate: (updated: any) => void
}

export function ProfileModal({ user, onClose, onUpdate }: Props) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [status, setStatus] = useState(user.status || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const currentAvatar = avatarPreview || user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.username)}&background=6272f1&color=fff&bold=true&size=200`

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Hanya file gambar yang diizinkan'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Avatar maksimal 5MB'); return }

    setUploading(true)
    setError('')
    const preview = URL.createObjectURL(file)
    setAvatarPreview(preview)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'avatars')

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      // Save avatar URL immediately
      await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: data.url }),
      })
      onUpdate({ avatar: data.url })
    } catch (err: any) {
      setError(err.message || 'Upload gagal')
      setAvatarPreview(null)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!displayName.trim()) { setError('Nama tampilan tidak boleh kosong'); return }
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim(), status: status.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      onUpdate(data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm glass rounded-2xl shadow-nexa-lg animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-display font-semibold">Edit Profil</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-dark-600 rounded-lg text-[var(--text-muted)] hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Avatar section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="avatar-ring">
                <div className="bg-dark-900 rounded-full p-0.5">
                  <img
                    src={currentAvatar}
                    alt="avatar"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                </div>
              </div>

              {/* Upload overlay */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
              >
                {uploading
                  ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                  : <Camera className="w-6 h-6 text-white" />}
              </button>

              {/* Online badge */}
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-dark-900" />
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs text-nexa-400 hover:text-nexa-300 transition-colors flex items-center gap-1"
            >
              <Camera className="w-3 h-3" />
              {uploading ? 'Mengupload...' : 'Ganti Foto Profil'}
            </button>
          </div>

          {/* User info (read-only) */}
          <div className="bg-dark-700 rounded-xl p-3 flex items-center gap-3 border border-[var(--border)]">
            <User className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-[var(--text-muted)]">Username</p>
              <p className="text-sm font-mono font-medium">@{user.username}</p>
            </div>
          </div>

          {/* Display name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Nama Tampilan</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="Nama yang ditampilkan ke pengguna lain"
              className="nexa-input w-full px-4 py-2.5 text-sm"
            />
            <p className="text-xs text-[var(--text-muted)] text-right">{displayName.length}/50</p>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Status</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)]" />
              <textarea
                value={status}
                onChange={e => setStatus(e.target.value)}
                maxLength={150}
                rows={2}
                placeholder="Hey there! I'm using Nexa Chat"
                className="nexa-input w-full pl-10 pr-4 py-2.5 text-sm resize-none"
              />
            </div>
            <p className="text-xs text-[var(--text-muted)] text-right">{status.length}/150</p>
          </div>

          {/* Error/Success */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl p-3 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 rounded-xl p-3 animate-fade-in">
              <Check className="w-4 h-4 flex-shrink-0" />
              Profil berhasil disimpan!
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="flex-1 btn-nexa py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
