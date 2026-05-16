'use client'
// components/StickerPanel.tsx
import { useState, useEffect, useRef } from 'react'
import { Plus, Upload, X, Loader2, Smile, Star, Search, Trash2 } from 'lucide-react'

interface Sticker {
  id: string
  name: string
  imageUrl: string
  pack: string
  user: { id: string; username: string; displayName: string | null }
}

interface Props {
  onSelect: (sticker: Sticker) => void
  currentUser: any
}

// Built-in emoji stickers (using emoji as base64/url placeholders)
const EMOJI_PACKS = [
  { name: '😀', label: 'Senyum', emojis: ['😀','😂','🥹','😍','🤩','😎','🥸','😏','😒','😔','😢','😭','😤','😡','🤬','🤯','😱','🥳','😴','🤤'] },
  { name: '🐶', label: 'Hewan', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🦄','🐙','🦋','🐝'] },
  { name: '🍕', label: 'Makanan', emojis: ['🍕','🍔','🍟','🌮','🌯','🍜','🍣','🍦','🎂','🍩','🍪','☕','🧋','🍺','🥤','🍷','🥂','🍾','🧃','🧊'] },
  { name: '❤️', label: 'Hati', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💝','💘','💟','☮️'] },
  { name: '✅', label: 'Simbol', emojis: ['✅','❌','⚡','🔥','💫','⭐','🌟','✨','💥','🎯','🏆','🎁','🎉','🎊','🎈','🚀','🌈','☀️','🌙','❄️'] },
]

export function StickerPanel({ onSelect, currentUser }: Props) {
  const [tab, setTab] = useState<'emoji' | 'custom' | 'create'>('emoji')
  const [emojiPack, setEmojiPack] = useState(0)
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPack, setNewPack] = useState('custom')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (tab === 'custom') loadStickers()
  }, [tab])

  async function loadStickers() {
    setLoading(true)
    try {
      const res = await fetch('/api/stickers')
      const data = await res.json()
      setStickers(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  function handleEmojiStickerSelect(emoji: string) {
    // Send emoji as text message styled as sticker
    // We create a fake sticker-like object for emoji
    onSelect({
      id: `emoji-${emoji}`,
      name: emoji,
      imageUrl: '',
      pack: 'emoji',
      user: currentUser,
    } as any)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleCreateSticker() {
    if (!selectedFile || !newName.trim()) return
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('name', newName.trim())
      formData.append('pack', newPack || 'custom')

      const res = await fetch('/api/stickers', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.message)

      setStickers(prev => [data, ...prev])
      setNewName('')
      setNewPack('custom')
      setPreviewUrl(null)
      setSelectedFile(null)
      setTab('custom')
    } catch (err: any) {
      alert(err.message || 'Gagal buat stiker')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteSticker(id: string) {
    if (!confirm('Hapus stiker ini?')) return
    await fetch('/api/stickers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stickerId: id }),
    })
    setStickers(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="w-80 bg-dark-800 border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
      onClick={e => e.stopPropagation()}>
      {/* Header tabs */}
      <div className="flex border-b border-[var(--border)]">
        {[
          { key: 'emoji', icon: <Smile className="w-4 h-4" />, label: 'Emoji' },
          { key: 'custom', icon: <Star className="w-4 h-4" />, label: 'Stiker' },
          { key: 'create', icon: <Plus className="w-4 h-4" />, label: 'Buat' },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all ${
              tab === key
                ? 'text-nexa-400 border-b-2 border-nexa-500 bg-nexa-600/10'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-dark-700'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Emoji tab */}
      {tab === 'emoji' && (
        <div>
          {/* Pack selector */}
          <div className="flex gap-1 p-2 border-b border-[var(--border)] overflow-x-auto scrollbar-none">
            {EMOJI_PACKS.map((pack, i) => (
              <button
                key={i}
                onClick={() => setEmojiPack(i)}
                title={pack.label}
                className={`w-8 h-8 rounded-lg text-base flex-shrink-0 transition-all ${
                  emojiPack === i ? 'bg-nexa-600/30 ring-1 ring-nexa-500' : 'hover:bg-dark-600'
                }`}
              >
                {pack.name}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="grid grid-cols-5 gap-1 p-3 max-h-52 overflow-y-auto">
            {EMOJI_PACKS[emojiPack].emojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleEmojiStickerSelect(emoji)}
                className="w-12 h-12 rounded-xl text-2xl hover:bg-dark-600 hover:scale-110 transition-all flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom stickers tab */}
      {tab === 'custom' && (
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-nexa-400 animate-spin" />
            </div>
          ) : stickers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <span className="text-3xl">🎭</span>
              <p className="text-sm text-[var(--text-muted)]">Belum ada stiker</p>
              <button
                onClick={() => setTab('create')}
                className="text-xs text-nexa-400 hover:text-nexa-300 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Buat stiker pertamamu
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 p-3">
              {stickers.map(sticker => (
                <div key={sticker.id} className="group relative sticker-card">
                  <button
                    onClick={() => onSelect(sticker)}
                    className="w-full aspect-square rounded-xl overflow-hidden bg-dark-700 hover:bg-dark-600 transition-all"
                  >
                    <img
                      src={sticker.imageUrl}
                      alt={sticker.name}
                      className="w-full h-full object-contain p-1"
                    />
                  </button>

                  {/* Delete button (own stickers) */}
                  {sticker.user.id === currentUser.id && (
                    <button
                      onClick={() => handleDeleteSticker(sticker.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center hidden group-hover:flex transition-all"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  )}

                  <p className="text-[10px] text-center text-[var(--text-muted)] mt-1 truncate px-1">
                    {sticker.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create sticker tab */}
      {tab === 'create' && (
        <div className="p-4 space-y-4">
          <p className="text-xs text-[var(--text-muted)]">Buat stiker kustommu sendiri dari gambar apapun!</p>

          {/* Upload area */}
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${
              previewUrl ? 'border-nexa-500' : 'border-[var(--border)] hover:border-nexa-600'
            }`}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="w-24 h-24 object-contain rounded-xl" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)]">Klik untuk pilih gambar</p>
                <p className="text-xs text-[var(--text-muted)] opacity-60">PNG, GIF, WebP — maks 2MB</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

          {/* Sticker name */}
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nama stiker..."
            maxLength={30}
            className="nexa-input w-full px-3 py-2 text-sm"
          />

          {/* Pack name */}
          <input
            value={newPack}
            onChange={e => setNewPack(e.target.value)}
            placeholder="Nama pack (misal: Lucu, Kerja)"
            maxLength={20}
            className="nexa-input w-full px-3 py-2 text-sm"
          />

          <button
            onClick={handleCreateSticker}
            disabled={!selectedFile || !newName.trim() || uploading}
            className="btn-nexa w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {uploading ? 'Membuat...' : 'Buat Stiker'}
          </button>
        </div>
      )}
    </div>
  )
}
