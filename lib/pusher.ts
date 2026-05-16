// lib/pusher.ts
import Pusher from 'pusher'
import PusherJS from 'pusher-js'

// Server-side Pusher
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

// Client-side Pusher singleton
let pusherClient: PusherJS | null = null

export function getPusherClient(): PusherJS {
  if (!pusherClient) {
    pusherClient = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })
  }
  return pusherClient
}

export const CHANNELS = {
  GLOBAL: 'nexa-global',
  PRESENCE: 'presence-nexa',
}

export const EVENTS = {
  NEW_MESSAGE: 'new-message',
  DELETE_MESSAGE: 'delete-message',
  EDIT_MESSAGE: 'edit-message',
  USER_ONLINE: 'user-online',
  USER_OFFLINE: 'user-offline',
  TYPING_START: 'typing-start',
  TYPING_STOP: 'typing-stop',
  REACTION: 'reaction',
  USER_UPDATED: 'user-updated',
}
