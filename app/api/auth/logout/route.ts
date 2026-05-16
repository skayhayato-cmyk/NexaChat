// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { getSession, clearSessionCookie } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

export async function POST() {
  const session = await getSession()

  if (session) {
    await prisma.user.update({
      where: { id: session.userId },
      data: { isOnline: false, lastSeen: new Date() }
    }).catch(() => {})

    await pusherServer.trigger(CHANNELS.GLOBAL, EVENTS.USER_OFFLINE, {
      userId: session.userId
    }).catch(() => {})
  }

  clearSessionCookie()
  return NextResponse.json({ message: 'Logout berhasil' })
}
