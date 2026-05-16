// public/sw.js
const CACHE_NAME = 'nexa-cache-v1'
const STATIC_ASSETS = [
  '/',
  '/chat',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/sounds/message.mp3',
]

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {})
    })
  )
  self.skipWaiting()
})

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch (network first, cache fallback)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('/api/')) return

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return res
      })
      .catch(() => caches.match(event.request))
  )
})

// Push notification
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  let data = {}
  try { data = event.data.json() } catch { data = { title: 'Nexa Chat', body: event.data.text() } }

  const options = {
    body: data.body || 'Pesan baru diterima',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag || 'nexa-message',
    renotify: true,
    vibrate: [100, 50, 100],
    data: { url: data.url || '/chat' },
    actions: [
      { action: 'open', title: 'Buka Chat' },
      { action: 'dismiss', title: 'Tutup' },
    ],
    image: data.image,
    silent: false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '💬 Nexa Chat', options)
  )
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'dismiss') return

  const url = event.notification.data?.url || '/chat'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/chat') && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages())
  }
})

async function syncMessages() {
  // Sync any pending messages when connection restored
  const db = await openDB()
  const pending = await getPendingMessages(db)
  for (const msg of pending) {
    try {
      await fetch('/api/messages', { method: 'POST', body: JSON.stringify(msg) })
      await deletePendingMessage(db, msg.id)
    } catch {}
  }
}

// Simple IndexedDB helpers for offline queue
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('nexa-offline', 1)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('pending', { keyPath: 'id' })
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = reject
  })
}
function getPendingMessages(db) {
  return new Promise((resolve) => {
    const tx = db.transaction('pending', 'readonly')
    const req = tx.objectStore('pending').getAll()
    req.onsuccess = () => resolve(req.result || [])
  })
}
function deletePendingMessage(db, id) {
  return new Promise((resolve) => {
    const tx = db.transaction('pending', 'readwrite')
    tx.objectStore('pending').delete(id)
    tx.oncomplete = resolve
  })
}
