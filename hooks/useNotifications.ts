'use client'
// hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react'

type NotifPermission = 'default' | 'granted' | 'denied'

export function useNotifications() {
  const [permission, setPermission] = useState<NotifPermission>('default')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission as NotifPermission)
    }
  }, [])

  const request = useCallback(async () => {
    if (!('Notification' in window)) return 'denied' as NotifPermission
    const result = await Notification.requestPermission()
    setPermission(result as NotifPermission)
    return result as NotifPermission
  }, [])

  const toggle = useCallback(async () => {
    if (permission === 'granted') {
      // Can't programmatically revoke, just inform user
      alert('Untuk menonaktifkan notifikasi, buka pengaturan browser Anda.')
    } else {
      await request()
    }
  }, [permission, request])

  const notify = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return
    // Play sound
    try {
      const audio = new Audio('/sounds/message.mp3')
      audio.volume = 0.4
      audio.play().catch(() => {})
    } catch {}

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'NOTIFY', title, options })
    } else {
      new Notification(title, options)
    }
  }, [permission])

  return { permission, request, notify, toggle }
}
