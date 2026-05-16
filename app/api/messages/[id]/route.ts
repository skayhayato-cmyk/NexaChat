// app/api/messages/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const message = await prisma.message.findUnique({ where: { id: params.id } })
  if (!message) return NextResponse.json({ message: 'Pesan tidak ditemukan' }, { status: 404 })
  if (message.userId !== session.userId) return NextResponse.json({ message: 'Tidak punya izin' }, { status: 403 })

  await prisma.message.delete({ where: { id: params.id } })
  await pusherServer.trigger(CHANNELS.GLOBAL, EVENTS.DELETE_MESSAGE, { messageId: params.id })

  return NextResponse.json({ message: 'Dihapus' })
}
