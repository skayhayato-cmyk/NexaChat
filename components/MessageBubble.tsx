'use client'
// components/MessageBubble.tsx
import { useState, useRef } from 'react'
import { formatFileSize } from '@/lib/upload'
import {
  Trash2, SmilePlus, Play, Pause, Download,
  FileText, FileArchive, File, FileSpreadsheet,
  MoreHorizontal, Check, CheckCheck
} from 'lucide-react'

interface Props {
  message: any
  isOwn: boolean
  showAvatar: boolean
  showName: boolean
  currentUserId: string
  onDelete: (id: string) => void
  onReaction: (messageId: string, reactions: any[]) => void
}

const QUICK_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍', '🔥', '🎉']

function FileIcon({ mime }: { mime: string }) {
  if (mime?.includes('pdf')) return <FileText className="w-6 h-6 text-red-400" />
  if (mime?.includes('zip') || mime?.includes('rar')) return <FileArchive className="w-6 h-6 text-yellow-400" />
  if (mime?.includes('sheet') || mime?.includes('excel') || mime?.includes('csv')) return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
  return <File className="w-6 h-6 text-nexa-400" />
}

function VoiceNote({ url, isOwn }: { url: string; isOwn: boolean }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  }

  function onTimeUpdate() {
    const a = audioRef.current
    if (!a) return
    setProgress((a.currentTime / a.duration) * 100)
  }

  function onEnded() { setPlaying(false); setProgress(0) }

  function formatTime(s: number) {
    if (isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className={`flex items-center gap-3 ${isOwn ? 'text-white' : 'text-[var(--text-primary)]'}`}>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
      />
      <button onClick={toggle} className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
        isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-nexa-600/20 hover:bg-nexa-600/30'
      }`}>
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="h-1 rounded-full bg-white/20 relative overflow-hidden" style={{ width: '120px' }}>
          <div
            className="h-full rounded-full bg-current transition-all"
            style={{ width: `${progress}%`, opacity: playing ? 1 : 0.6 }}
          />
        </div>
        <div className="voice-wave mt-1 opacity-70">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="voice-bar" style={{ animationPlayState: playing ? 'running' : 'paused' }} />
          ))}
        </div>
      </div>

      <span className="text-xs opacity-70 flex-shrink-0">
        {formatTime(audioRef.current?.currentTime || 0)} / {formatTime(duration)}
      </span>
    </div>
  )
}

export function MessageBubble({ message, isOwn, showAvatar, showName, currentUserId, onDelete, onReaction }: Props) {
  const [showActions, setShowActions] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const avatarUrl = message.user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(message.user.displayName || message.user.username)}&background=6272f1&color=fff&bold=true`

  async function handleDelete() {
    if (!confirm('Hapus pesan ini?')) return
    setDeleting(true)
    await fetch(`/api/messages/${message.id}`, { method: 'DELETE' })
    onDelete(message.id)
  }

  async function handleReact(emoji: string) {
    setShowEmoji(false)
    const res = await fetch(`/api/messages/${message.id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    })
    const data = await res.json()
    onReaction(message.id, data.reactions)
  }

  // Group reactions
  const reactionGroups: Record<string, { emoji: string; users: any[]; hasMe: boolean }> = {}
  message.reactions?.forEach((r: any) => {
    if (!reactionGroups[r.emoji]) {
      reactionGroups[r.emoji] = { emoji: r.emoji, users: [], hasMe: false }
    }
    reactionGroups[r.emoji].users.push(r.user)
    if (r.user.id === currentUserId) reactionGroups[r.emoji].hasMe = true
  })

  const time = new Date(message.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const isDeleted = deleting

  return (
    <div className={`flex gap-2 group relative ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end mb-1`}>
      {/* Avatar */}
      <div className="w-8 flex-shrink-0">
        {showAvatar && !isOwn && (
          <div className="relative">
            <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            {message.user.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-dark-900" />
            )}
          </div>
        )}
      </div>

      <div className={`max-w-[75%] min-w-0 ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Sender name */}
        {showName && (
          <span className="text-xs font-semibold text-nexa-400 px-1">
            {message.user.displayName || message.user.username}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`relative ${isOwn ? 'msg-bubble-own' : 'msg-bubble-other'} px-3 py-2 text-sm leading-relaxed break-words`}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => { setShowActions(false); setShowEmoji(false) }}
        >
          {/* Content by type */}
          {message.type === 'TEXT' && (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}

          {message.type === 'STICKER' && message.fileUrl && (
            <img src={message.fileUrl} alt="sticker" className="w-28 h-28 object-contain" />
          )}

          {message.type === 'IMAGE' && message.fileUrl && (
            <div className="space-y-1">
              <img
                src={message.fileUrl}
                alt={message.fileName || 'image'}
                className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.fileUrl, '_blank')}
              />
              {message.content && <p className="text-sm mt-1">{message.content}</p>}
            </div>
          )}

          {message.type === 'VIDEO' && message.fileUrl && (
            <div>
              <video
                src={message.fileUrl}
                controls
                className="max-w-full max-h-64 rounded-lg"
                preload="metadata"
              />
              {message.content && <p className="text-sm mt-1">{message.content}</p>}
            </div>
          )}

          {message.type === 'VOICE' && message.fileUrl && (
            <VoiceNote url={message.fileUrl} isOwn={isOwn} />
          )}

          {(message.type === 'AUDIO') && message.fileUrl && (
            <div>
              <audio src={message.fileUrl} controls className="w-full" />
              {message.content && <p className="text-sm mt-1">{message.content}</p>}
            </div>
          )}

          {message.type === 'DOCUMENT' && message.fileUrl && (
            <a
              href={message.fileUrl}
              download={message.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 rounded-xl p-2 -mx-1 transition-all ${
                isOwn ? 'hover:bg-white/10' : 'hover:bg-nexa-600/10'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isOwn ? 'bg-white/15' : 'bg-dark-700'
              }`}>
                <FileIcon mime={message.fileMime} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{message.fileName}</p>
                <p className="text-xs opacity-60">{message.fileSize ? formatFileSize(message.fileSize) : ''}</p>
              </div>
              <Download className="w-4 h-4 opacity-60 flex-shrink-0" />
            </a>
          )}

          {/* Timestamp */}
          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>{time}</span>
            {isOwn && <CheckCheck className="w-3 h-3 text-white/60" />}
          </div>

          {/* Action buttons */}
          {showActions && (
            <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex items-center gap-1 px-2 animate-fade-in`}>
              <div className="relative">
                <button
                  onClick={() => setShowEmoji(!showEmoji)}
                  className="p-1.5 bg-dark-600 hover:bg-dark-500 rounded-full border border-[var(--border)] transition-all"
                  title="Reaksi"
                >
                  <SmilePlus className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                </button>

                {showEmoji && (
                  <div className={`absolute top-8 ${isOwn ? 'right-0' : 'left-0'} flex gap-1 bg-dark-700 rounded-xl p-2 shadow-xl border border-[var(--border)] z-50 animate-slide-down`}>
                    {QUICK_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReact(emoji)}
                        className="text-lg hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isOwn && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 bg-dark-600 hover:bg-red-500/20 rounded-full border border-[var(--border)] transition-all"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Reactions */}
        {Object.values(reactionGroups).length > 0 && (
          <div className={`flex flex-wrap gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {Object.values(reactionGroups).map(({ emoji, users, hasMe }) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
                  hasMe
                    ? 'bg-nexa-600/30 border-nexa-500/50 text-nexa-300'
                    : 'bg-dark-600 border-[var(--border)] hover:border-nexa-600/50'
                }`}
                title={users.map(u => u.displayName || u.username).join(', ')}
              >
                <span>{emoji}</span>
                <span>{users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
