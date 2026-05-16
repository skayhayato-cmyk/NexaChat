// app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

const MESSAGE_INCLUDE = {
  user: {
    select: {
      id: true, username: true, displayName: true, avatar: true, isOnline: true
    }
  },
  reactions: {
    include: {
      user: { select: { id: true, username: true, displayName: true } }
    }
  }
}

// GET /api/messages?cursor=&limit=
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  const messages = await prisma.message.findMany({
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: 'desc' },
    include: MESSAGE_INCLUDE,
  })

  const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null

  return NextResponse.json({
    messages: messages.reverse(),
    nextCursor,
  })
}

// POST /api/messages
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { content, type = 'TEXT', fileUrl, fileName, fileSize, fileMime, duration, stickerId } = body

    if (!content && !fileUrl && !stickerId) {
      return NextResponse.json({ message: 'Pesan tidak boleh kosong' }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        userId: session.userId,
        content: content?.trim() || null,
        type,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        fileMime: fileMime || null,
        duration: duration || null,
        stickerId: stickerId || null,
      },
      include: MESSAGE_INCLUDE,
    })

    // Broadcast to all clients
    await pusherServer.trigger(CHANNELS.GLOBAL, EVENTS.NEW_MESSAGE, message)

    return NextResponse.json(message, { status: 201 })
  } catch (err) {
    console.error('POST message error:', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
