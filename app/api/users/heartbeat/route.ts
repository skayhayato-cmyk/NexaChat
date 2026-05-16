// app/api/users/heartbeat/route.ts
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })

  await prisma.user.update({
    where: { id: session.userId },
    data: { isOnline: true, lastSeen: new Date() },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })

  await prisma.user.update({
    where: { id: session.userId },
    data: { isOnline: false, lastSeen: new Date() },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
