'use client'
// components/ChatInput.tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Paperclip, Smile, Mic, MicOff, Image, Film,
  FileText, Sticker, X, Square, Loader2, ImagePlus
} from 'lucide-react'
import { StickerPanel } from './StickerPanel'

interface Props {
  currentUser: any
  onMessageSent: () => void
}

const TYPING_DEBOUNCE = 1000

export function ChatInput({ currentUser, onMessageSent }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showAttach, setShowAttach] = useState(false)
  const [showSticker, setShowSticker] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [pendingFile, setPendingFile] = useState<{ url: string; name: string; size: number; mime: string; type: string; preview?: string } | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)

  // Auto resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [text])

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    sendTyping(true)
  }

  function sendTyping(isTyping: boolean) {
    if (isTyping && !isTypingRef.current) {
      isTypingRef.current = true
      fetch('/api/messages/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTyping: true }),
      }).catch(() => {})
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false
        fetch('/api/messages/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isTyping: false }),
        }).catch(() => {})
      }
    }, TYPING_DEBOUNCE)
  }

  async function handleSend() {
    if ((!text.trim() && !pendingFile) || sending) return

    setSending(true)
    sendTyping(false)

    try {
      let body: any = {}

      if (pendingFile) {
        body = {
          type: pendingFile.type.toUpperCase(),
          fileUrl: pendingFile.url,
          fileName: pendingFile.name,
          fileSize: pendingFile.size,
          fileMime: pendingFile.mime,
          content: text.trim() || null,
        }
      } else {
        body = { type: 'TEXT', content: text.trim() }
      }

      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      setText('')
      setPendingFile(null)
      onMessageSent()
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function uploadFile(file: File, category: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    setUploadProgress(0)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Upload gagal')
    }
    const data = await res.json()
    setUploadProgress(null)
    return data
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setShowAttach(false)

    const category = file.type.startsWith('image/') ? 'image'
      : file.type.startsWith('video/') ? 'video'
      : file.type.startsWith('audio/') ? 'audio'
      : 'document'

    try {
      setUploadProgress(10)
      const result = await uploadFile(file, category)
      setUploadProgress(100)

      let preview: string | undefined
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      setPendingFile({
        url: result.url,
        name: result.fileName,
        size: result.fileSize,
        mime: result.fileMime,
        type: category,
        preview,
      })
    } catch (err: any) {
      alert(err.message || 'Upload gagal')
    } finally {
      setUploadProgress(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mr
      chunksRef.current = []

      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })

        try {
          setUploadProgress(10)
          const result = await uploadFile(file, 'voice')
          // Send directly as voice message
          await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'VOICE',
              fileUrl: result.url,
              fileName: result.fileName,
              fileSize: result.fileSize,
              fileMime: result.fileMime,
              duration: recordingTime,
            }),
          })
          onMessageSent()
        } catch (err: any) {
          alert(err.message || 'Gagal kirim voice note')
        } finally {
          setUploadProgress(null)
          setRecordingTime(0)
        }
      }

      mr.start()
      setRecording(true)
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch {
      alert('Tidak dapat mengakses mikrofon')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
  }

  async function handleStickerSend(sticker: any) {
    setShowSticker(false)
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'STICKER',
        fileUrl: sticker.imageUrl,
        fileName: sticker.name,
        stickerId: sticker.id,
      }),
    })
    onMessageSent()
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="flex-shrink-0 border-t border-[var(--border)] bg-dark-800 p-3">
      {/* Pending file preview */}
      {pendingFile && (
        <div className="mb-3 flex items-center gap-3 bg-dark-700 rounded-xl p-3 border border-[var(--border)] animate-slide-up">
          {pendingFile.preview ? (
            <img src={pendingFile.preview} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-dark-600 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-nexa-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{pendingFile.name}</p>
            <p className="text-xs text-[var(--text-muted)] capitalize">{pendingFile.type}</p>
          </div>
          <button
            onClick={() => setPendingFile(null)}
            className="p-1.5 hover:bg-dark-500 rounded-lg text-[var(--text-muted)] hover:text-red-400 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploadProgress !== null && (
        <div className="mb-2">
          <div className="h-1 bg-dark-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-nexa-600 to-nexa-400 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">Mengupload...</p>
        </div>
      )}

      {/* Recording mode */}
      {recording ? (
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="flex items-center gap-2 flex-1 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-mono text-sm">{formatTime(recordingTime)}</span>
            <div className="voice-wave text-red-400 flex-1 justify-center">
              {[...Array(6)].map((_, i) => <div key={i} className="voice-bar" />)}
            </div>
            <span className="text-xs text-[var(--text-muted)]">Sedang merekam...</span>
          </div>
          <button
            onClick={stopRecording}
            className="p-3 bg-red-500 hover:bg-red-600 rounded-xl transition-all"
            title="Berhenti & Kirim"
          >
            <Square className="w-5 h-5 text-white" />
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          {/* Sticker & attachment row */}
          <div className="flex items-center gap-1">
            {/* Sticker button */}
            <div className="relative">
              <button
                onClick={() => { setShowSticker(!showSticker); setShowAttach(false) }}
                className={`p-2 rounded-xl transition-all ${showSticker ? 'bg-nexa-600/30 text-nexa-400' : 'hover:bg-dark-600 text-[var(--text-muted)] hover:text-white'}`}
                title="Stiker"
              >
                <Sticker className="w-5 h-5" />
              </button>

              {showSticker && (
                <div className="absolute bottom-12 left-0 z-50 animate-slide-up">
                  <StickerPanel onSelect={handleStickerSend} currentUser={currentUser} />
                </div>
              )}
            </div>

            {/* Attachment menu */}
            <div className="relative">
              <button
                onClick={() => { setShowAttach(!showAttach); setShowSticker(false) }}
                className={`p-2 rounded-xl transition-all ${showAttach ? 'bg-nexa-600/30 text-nexa-400' : 'hover:bg-dark-600 text-[var(--text-muted)] hover:text-white'}`}
                title="Lampiran"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {showAttach && (
                <div className="absolute bottom-12 left-0 bg-dark-700 border border-[var(--border)] rounded-2xl p-2 flex flex-col gap-1 min-w-44 shadow-xl z-50 animate-slide-up">
                  {[
                    { label: 'Foto & GIF', icon: <Image className="w-4 h-4" />, accept: 'image/*', cat: 'image', color: 'text-pink-400' },
                    { label: 'Video', icon: <Film className="w-4 h-4" />, accept: 'video/*', cat: 'video', color: 'text-purple-400' },
                    { label: 'Audio', icon: <Smile className="w-4 h-4" />, accept: 'audio/*', cat: 'audio', color: 'text-yellow-400' },
                    { label: 'Dokumen & ZIP', icon: <FileText className="w-4 h-4" />, accept: '.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,.csv', cat: 'document', color: 'text-blue-400' },
                  ].map(({ label, icon, accept, cat, color }) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setShowAttach(false)
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = accept
                        input.onchange = (e) => handleFileSelect(e as any)
                        input.click()
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-dark-600 transition-all text-sm ${color}`}
                    >
                      {icon}
                      <span className="text-[var(--text-primary)]">{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={pendingFile ? 'Tambahkan caption (opsional)...' : 'Ketik pesan...'}
              rows={1}
              className="nexa-input w-full px-4 py-2.5 text-sm resize-none leading-relaxed"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>

          {/* Voice / Send button */}
          {text.trim() || pendingFile ? (
            <button
              onClick={handleSend}
              disabled={sending}
              className="btn-nexa p-2.5 rounded-xl disabled:opacity-50 transition-all flex-shrink-0"
              title="Kirim"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="p-2.5 rounded-xl hover:bg-dark-600 text-[var(--text-muted)] hover:text-nexa-400 transition-all flex-shrink-0"
              title="Rekam Voice Note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
