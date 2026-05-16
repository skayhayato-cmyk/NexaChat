// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { comparePassword, signToken, setSessionCookie } from '@/lib/auth'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json()

    if (!identifier || !password) {
      return NextResponse.json({ message: 'Isi email/username dan password' }, { status: 400 })
    }

    // Find user by email or username
    const isEmail = identifier.includes('@')
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: identifier.toLowerCase() }
        : { username: identifier.toLowerCase().replace('@', '') }
    })

    if (!user) {
      return NextResponse.json({ message: 'Email/username atau password salah' }, { status: 401 })
    }

    const passwordMatch = await comparePassword(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ message: 'Email/username atau password salah' }, { status: 401 })
    }

    // Update online status
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() }
    })

    const token = signToken({ userId: user.id, email: user.email, username: user.username })
    setSessionCookie(token)

    // Notify others
    await pusherServer.trigger(CHANNELS.GLOBAL, EVENTS.USER_ONLINE, {
      user: { id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar }
    }).catch(() => {})

    return NextResponse.json({
      user: {
        id: user.id, email: user.email, username: user.username,
        displayName: user.displayName, avatar: user.avatar, status: user.status,
      },
      message: 'Login berhasil'
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
