'use client'
// hooks/useHeartbeat.ts
import { useEffect } from 'react'

export function useHeartbeat(intervalMs = 30000) {
  useEffect(() => {
    // Send heartbeat
    const beat = () => fetch('/api/users/heartbeat', { method: 'POST' }).catch(() => {})
    beat()
    const id = setInterval(beat, intervalMs)

    // Mark offline when tab closes
    const onUnload = () => {
      navigator.sendBeacon('/api/users/heartbeat', JSON.stringify({ offline: true }))
    }
    window.addEventListener('beforeunload', onUnload)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return
      beat()
    })

    return () => {
      clearInterval(id)
      window.removeEventListener('beforeunload', onUnload)
      fetch('/api/users/heartbeat', { method: 'DELETE' }).catch(() => {})
    }
  }, [intervalMs])
}
