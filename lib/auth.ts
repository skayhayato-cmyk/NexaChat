// lib/auth.ts
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './db'

const JWT_SECRET = process.env.JWT_SECRET!
const COOKIE_NAME = 'nexa_session'

export interface JWTPayload {
  userId: string
  email: string
  username: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null
  
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatar: true,
      status: true,
      isOnline: true,
      lastSeen: true,
      createdAt: true,
    }
  })
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
}

export function clearSessionCookie() {
  const cookieStore = cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Validate password strength
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: 'Password minimal 8 karakter' }
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password harus ada huruf kapital' }
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password harus ada angka' }
  return { valid: true, message: '' }
}

// Validate email
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Validate username
export function validateUsername(username: string): { valid: boolean; message: string } {
  if (username.length < 3) return { valid: false, message: 'Username minimal 3 karakter' }
  if (username.length > 20) return { valid: false, message: 'Username maksimal 20 karakter' }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return { valid: false, message: 'Username hanya boleh huruf, angka, dan underscore' }
  return { valid: true, message: '' }
}
