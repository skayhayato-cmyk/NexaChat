// app/api/stickers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { saveFile } from '@/lib/upload'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const stickers = await prisma.sticker.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, username: true, displayName: true } }
    }
  })

  return NextResponse.json(stickers)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string
    const pack = formData.get('pack') as string || 'custom'

    if (!file || !name) {
      return NextResponse.json({ message: 'File dan nama stiker diperlukan' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'Stiker harus berupa gambar' }, { status: 400 })
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ message: 'Stiker maksimal 2MB' }, { status: 400 })
    }

    const { url } = await saveFile(file, 'stickers')

    const sticker = await prisma.sticker.create({
      data: {
        name: name.trim(),
        imageUrl: url,
        pack,
        userId: session.userId,
      },
      include: {
        user: { select: { id: true, username: true, displayName: true } }
      }
    })

    return NextResponse.json(sticker, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Gagal upload stiker' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { stickerId } = await req.json()
  const sticker = await prisma.sticker.findUnique({ where: { id: stickerId } })

  if (!sticker) return NextResponse.json({ message: 'Stiker tidak ditemukan' }, { status: 404 })
  if (sticker.userId !== session.userId) return NextResponse.json({ message: 'Tidak punya izin' }, { status: 403 })

  await prisma.sticker.delete({ where: { id: stickerId } })
  return NextResponse.json({ message: 'Stiker dihapus' })
}
