// app/api/messages/typing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { isTyping } = await req.json()

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, displayName: true }
  })

  await pusherServer.trigger(
    CHANNELS.GLOBAL,
    isTyping ? EVENTS.TYPING_START : EVENTS.TYPING_STOP,
    { user }
  ).catch(() => {})

  return NextResponse.json({ ok: true })
}
