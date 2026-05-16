'use client'
// components/ChatClient.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { getPusherClient, CHANNELS, EVENTS } from '@/lib/pusher'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { OnlineUsers } from './OnlineUsers'
import { ProfileModal } from './ProfileModal'
import { StickerPanel } from './StickerPanel'
import { NexaLogo } from './NexaLogo'
import { useNotifications } from '@/hooks/useNotifications'
import {
  Users, LogOut, Settings, Bell, BellOff,
  ChevronLeft, Wifi, WifiOff, Hash
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string
  displayName: string | null
  avatar: string | null
  status: string
  isOnline: boolean
  lastSeen: Date
}

interface Message {
  id: string
  content: string | null
  type: string
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  fileMime: string | null
  duration: number | null
  stickerId: string | null
  createdAt: string
  user: {
    id: string
    username: string
    displayName: string | null
    avatar: string | null
    isOnline: boolean
  }
  reactions: Array<{
    id: string
    emoji: string
    user: { id: string; username: string; displayName: string | null }
  }>
}

export function ChatClient({ currentUser }: { currentUser: User }) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [showUsers, setShowUsers] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [user, setUser] = useState(currentUser)
  const [unread, setUnread] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const { permission, notify, toggle: toggleNotif } = useNotifications()

  // Load initial messages
  useEffect(() => {
    loadMessages()
    loadOnlineUsers()
  }, [])

  // Pusher connection
  useEffect(() => {
    const pusher = getPusherClient()
    const channel = pusher.subscribe(CHANNELS.GLOBAL)

    channel.bind('pusher:subscription_succeeded', () => setIsConnected(true))
    channel.bind('pusher:subscription_error', () => setIsConnected(false))
    setIsConnected(pusher.connection.state === 'connected')

    pusher.connection.bind('connected', () => setIsConnected(true))
    pusher.connection.bind('disconnected', () => setIsConnected(false))
    pusher.connection.bind('error', () => setIsConnected(false))

    channel.bind(EVENTS.NEW_MESSAGE, (msg: Message) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      if (msg.user.id !== currentUser.id) {
        if (!isAtBottomRef.current) {
          setUnread(n => n + 1)
        }
        if (permission === 'granted' && document.hidden) {
          const name = msg.user.displayName || msg.user.username
          const body = msg.type === 'TEXT'
            ? (msg.content?.slice(0, 80) || '')
            : msg.type === 'IMAGE' ? '📷 Foto'
            : msg.type === 'VIDEO' ? '🎥 Video'
            : msg.type === 'VOICE' ? '🎙️ Voice note'
            : msg.type === 'STICKER' ? '🎭 Stiker'
            : '📁 Dokumen'
          notify(`${name} di Nexa Chat`, { body, icon: '/icons/icon-192.png', tag: 'nexa' })
        }
      } else {
        setTimeout(() => scrollToBottom(), 50)
      }
      if (isAtBottomRef.current) setTimeout(() => scrollToBottom(), 50)
    })

    channel.bind(EVENTS.DELETE_MESSAGE, ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId))
    })

    channel.bind(EVENTS.REACTION, ({ messageId, reactions }: { messageId: string; reactions: any[] }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m))
    })

    channel.bind(EVENTS.TYPING_START, ({ user: u }: { user: User }) => {
      if (u.id !== currentUser.id) {
        setTypingUsers(prev => new Set([...prev, u.username]))
        setTimeout(() => {
          setTypingUsers(prev => { const next = new Set(prev); next.delete(u.username); return next })
        }, 3000)
      }
    })

    channel.bind(EVENTS.TYPING_STOP, ({ user: u }: { user: User }) => {
      setTypingUsers(prev => { const next = new Set(prev); next.delete(u.username); return next })
    })

    channel.bind(EVENTS.USER_ONLINE, ({ user: u }: { user: User }) => {
      setOnlineUsers(prev => {
        const exists = prev.find(p => p.id === u.id)
        if (exists) return prev.map(p => p.id === u.id ? { ...p, ...u, isOnline: true } : p)
        return [...prev, { ...u, isOnline: true } as User]
      })
    })

    channel.bind(EVENTS.USER_OFFLINE, ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== userId))
    })

    channel.bind(EVENTS.USER_UPDATED, (updatedUser: any) => {
      if (updatedUser.id === currentUser.id) setUser(prev => ({ ...prev, ...updatedUser }))
      setOnlineUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    })

    return () => {
      pusher.unsubscribe(CHANNELS.GLOBAL)
    }
  }, [currentUser.id, permission])

  // Scroll tracking
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 80
      if (isAtBottomRef.current) setUnread(0)
      if (scrollTop < 100 && hasMore && !loading) loadMore()
    }
    container.addEventListener('scroll', onScroll)
    return () => container.removeEventListener('scroll', onScroll)
  }, [hasMore, loading])

  async function loadMessages() {
    setLoading(true)
    try {
      const res = await fetch('/api/messages?limit=50')
      const data = await res.json()
      setMessages(data.messages || [])
      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
      setTimeout(() => scrollToBottom(), 100)
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (!cursor || loading) return
    setLoading(true)
    const container = messagesContainerRef.current
    const prevHeight = container?.scrollHeight || 0

    const res = await fetch(`/api/messages?limit=30&cursor=${cursor}`)
    const data = await res.json()
    setMessages(prev => [...(data.messages || []), ...prev])
    setCursor(data.nextCursor)
    setHasMore(!!data.nextCursor)
    setLoading(false)

    // Maintain scroll position
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight - prevHeight
      })
    }
  }

  async function loadOnlineUsers() {
    const res = await fetch('/api/users/online')
    const data = await res.json()
    setOnlineUsers(Array.isArray(data) ? data : [])
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setUnread(0)
  }

  const handleDeleteMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id))
  }, [])

  const handleReaction = useCallback((messageId: string, reactions: any[]) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m))
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.username)}&background=6272f1&color=fff&bold=true`

  return (
    <div className="h-screen flex flex-col bg-dark-900 overflow-hidden">
      {/* Top navbar */}
      <header className="glass border-b border-[var(--border)] px-4 py-3 flex items-center gap-3 flex-shrink-0 z-30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <NexaLogo size={32} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg gradient-text leading-tight">Nexa</span>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'} flex-shrink-0`} />
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Hash className="w-3 h-3" />
              <span>global-chat</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Online count */}
          <button
            onClick={() => setShowUsers(!showUsers)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              showUsers ? 'bg-nexa-600/30 text-nexa-400' : 'hover:bg-dark-600 text-[var(--text-secondary)]'
            }`}
          >
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span>{onlineUsers.length}</span>
            <Users className="w-4 h-4" />
          </button>

          {/* Notification toggle */}
          <button
            onClick={toggleNotif}
            title={permission === 'granted' ? 'Matikan notifikasi' : 'Aktifkan notifikasi'}
            className="p-2 rounded-xl hover:bg-dark-600 text-[var(--text-secondary)] hover:text-white transition-all"
          >
            {permission === 'granted' ? <Bell className="w-4 h-4 text-nexa-400" /> : <BellOff className="w-4 h-4" />}
          </button>

          {/* Profile avatar */}
          <button
            onClick={() => setShowProfile(true)}
            className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-nexa-600/50 hover:ring-nexa-500 transition-all"
          >
            <img src={avatarUrl} alt={user.displayName || user.username} className="w-full h-full object-cover" />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-all"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Online users panel */}
        <div className={`absolute inset-y-0 right-0 z-20 w-72 glass border-l border-[var(--border)] transition-transform duration-300 ${
          showUsers ? 'translate-x-0' : 'translate-x-full'
        } lg:relative lg:translate-x-0 ${!showUsers ? 'lg:hidden' : ''}`}>
          <OnlineUsers
            users={onlineUsers}
            currentUserId={currentUser.id}
            onClose={() => setShowUsers(false)}
          />
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
            style={{ scrollbarGutter: 'stable' }}
          >
            {/* Load more indicator */}
            {loading && messages.length === 0 && (
              <div className="flex justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <NexaLogo size={40} className="animate-pulse" />
                  <p className="text-sm text-[var(--text-muted)]">Memuat pesan...</p>
                </div>
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 opacity-60">
                <NexaLogo size={64} />
                <p className="font-display text-lg text-[var(--text-secondary)]">Mulai percakapan global!</p>
                <p className="text-sm text-[var(--text-muted)]">Kirim pesan pertamamu ke semua pengguna Nexa</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.user.id === currentUser.id}
                showAvatar={i === 0 || messages[i - 1]?.user.id !== msg.user.id}
                showName={msg.user.id !== currentUser.id && (i === 0 || messages[i - 1]?.user.id !== msg.user.id)}
                currentUserId={currentUser.id}
                onDelete={handleDeleteMessage}
                onReaction={handleReaction}
              />
            ))}

            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <div className="flex items-center gap-2 py-1 animate-fade-in">
                <div className="flex gap-1">
                  {[1,2,3].map(i => <div key={i} className="typing-dot" />)}
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {Array.from(typingUsers).join(', ')} sedang mengetik...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Unread badge */}
          {unread > 0 && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 btn-nexa px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 animate-slide-up shadow-nexa z-10"
            >
              ↓ {unread} pesan baru
            </button>
          )}

          {/* Chat input */}
          <ChatInput
            currentUser={user}
            onMessageSent={() => setTimeout(scrollToBottom, 50)}
          />
        </div>
      </div>

      {/* Profile modal */}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdate={(updated) => setUser(prev => ({ ...prev, ...updated }))}
        />
      )}
    </div>
  )
}
