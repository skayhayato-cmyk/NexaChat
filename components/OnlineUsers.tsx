'use client'
// components/OnlineUsers.tsx
import { X, Crown } from 'lucide-react'

interface User {
  id: string
  username: string
  displayName: string | null
  avatar: string | null
  status: string
  isOnline: boolean
  lastSeen: Date | string
}

interface Props {
  users: User[]
  currentUserId: string
  onClose: () => void
}

export function OnlineUsers({ users, currentUserId, onClose }: Props) {
  const sorted = [...users].sort(u => u.id === currentUserId ? -1 : 1)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
        <div>
          <h3 className="font-display font-semibold text-sm">Online Sekarang</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            <span className="text-emerald-400 font-bold">{users.length}</span> pengguna aktif
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-dark-600 rounded-lg text-[var(--text-muted)] hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto py-2">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <span className="text-2xl">👻</span>
            <p className="text-xs text-[var(--text-muted)]">Tidak ada yang online</p>
          </div>
        ) : (
          sorted.map(user => {
            const avatar = user.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.username)}&background=6272f1&color=fff&bold=true`
            const isCurrentUser = user.id === currentUserId

            return (
              <div
                key={user.id}
                className={`flex items-center gap-3 px-4 py-2.5 hover:bg-dark-600/50 transition-all cursor-default group ${
                  isCurrentUser ? 'bg-nexa-600/10' : ''
                }`}
              >
                {/* Avatar with online ring */}
                <div className="relative flex-shrink-0">
                  <img
                    src={avatar}
                    alt={user.username}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-dark-800" />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium truncate">
                      {user.displayName || user.username}
                    </span>
                    {isCurrentUser && <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" title="Kamu" />}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    @{user.username}
                  </p>
                  {user.status && (
                    <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5 italic opacity-70">
                      "{user.status}"
                    </p>
                  )}
                </div>

                {/* Online badge */}
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs bg-emerald-400/15 text-emerald-400 px-2 py-0.5 rounded-full">
                    Online
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--text-muted)] text-center">
          Hanya pengguna online yang ditampilkan
        </p>
      </div>
    </div>
  )
}
