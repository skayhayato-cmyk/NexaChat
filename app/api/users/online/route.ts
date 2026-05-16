// app/api/users/online/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const users = await prisma.user.findMany({
    where: { isOnline: true },
    select: {
      id: true, username: true, displayName: true,
      avatar: true, status: true, isOnline: true, lastSeen: true,
    },
    orderBy: { lastSeen: 'desc' },
    take: 100,
  })

  return NextResponse.json(users)
}
