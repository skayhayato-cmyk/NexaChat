// app/api/users/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true, email: true, username: true, displayName: true,
      avatar: true, status: true, isOnline: true, lastSeen: true, createdAt: true,
    }
  })

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { displayName, status, avatar } = body

  const updates: Record<string, string> = {}
  if (displayName !== undefined) {
    if (displayName.length > 50) return NextResponse.json({ message: 'Nama terlalu panjang' }, { status: 400 })
    updates.displayName = displayName.trim()
  }
  if (status !== undefined) {
    if (status.length > 150) return NextResponse.json({ message: 'Status terlalu panjang' }, { status: 400 })
    updates.status = status.trim()
  }
  if (avatar !== undefined) updates.avatar = avatar

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: updates,
    select: {
      id: true, username: true, displayName: true, avatar: true, status: true,
    }
  })

  await pusherServer.trigger(CHANNELS.GLOBAL, EVENTS.USER_UPDATED, user).catch(() => {})

  return NextResponse.json(user)
}
