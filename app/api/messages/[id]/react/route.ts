// app/api/messages/[id]/react/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { emoji } = await req.json()
  if (!emoji) return NextResponse.json({ message: 'Emoji diperlukan' }, { status: 400 })

  // Toggle reaction
  const existing = await prisma.reaction.findUnique({
    where: { userId_messageId: { userId: session.userId, messageId: params.id } }
  })

  let action = 'added'
  if (existing) {
    if (existing.emoji === emoji) {
      await prisma.reaction.delete({ where: { id: existing.id } })
      action = 'removed'
    } else {
      await prisma.reaction.update({ where: { id: existing.id }, data: { emoji } })
      action = 'updated'
    }
  } else {
    await prisma.reaction.create({
      data: { userId: session.userId, messageId: params.id, emoji }
    })
  }

  // Get updated reactions
  const reactions = await prisma.reaction.findMany({
    where: { messageId: params.id },
    include: { user: { select: { id: true, username: true, displayName: true } } }
  })

  await pusherServer.trigger(CHANNELS.GLOBAL, EVENTS.REACTION, {
    messageId: params.id, reactions, action
  })

  return NextResponse.json({ reactions, action })
}
