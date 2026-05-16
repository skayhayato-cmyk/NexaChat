// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, signToken, setSessionCookie, validateEmail, validatePassword, validateUsername } from '@/lib/auth'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

export async function POST(req: NextRequest) {
  try {
    const { email, username, displayName, password } = await req.json()

    // Validate
    if (!email || !username || !password) {
      return NextResponse.json({ message: 'Semua field wajib diisi' }, { status: 400 })
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ message: 'Format email tidak valid' }, { status: 400 })
    }

    const usernameValidation = validateUsername(username)
    if (!usernameValidation.valid) {
      return NextResponse.json({ message: usernameValidation.message }, { status: 400 })
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ message: passwordValidation.message }, { status: 400 })
    }

    // Check existing
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    })

    if (existing) {
      if (existing.email === email) return NextResponse.json({ message: 'Email sudah terdaftar' }, { status: 409 })
      return NextResponse.json({ message: 'Username sudah dipakai' }, { status: 409 })
    }

    // Create user
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        username: username.toLowerCase(),
        displayName: displayName || username,
        password: hashedPassword,
        isOnline: true,
        lastSeen: new Date(),
      },
      select: {
        id: true, email: true, username: true, displayName: true,
        avatar: true, status: true, isOnline: true,
      }
    })

    // Sign token & set cookie
    const token = signToken({ userId: user.id, email: user.email, username: user.username })
    setSessionCookie(token)

    // Notify online users
    await pusherServer.trigger(CHANNELS.GLOBAL, EVENTS.USER_ONLINE, {
      user: { id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar }
    }).catch(() => {})

    return NextResponse.json({ user, message: 'Berhasil daftar' }, { status: 201 })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
