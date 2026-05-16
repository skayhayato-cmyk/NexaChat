// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { saveFile, getFileCategory, isAllowedType } from '@/lib/upload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const category = (formData.get('category') as string) || 'misc'

    if (!file) return NextResponse.json({ message: 'Tidak ada file' }, { status: 400 })

    if (!isAllowedType(file.type)) {
      return NextResponse.json({
        message: `Tipe file tidak didukung: ${file.type}`
      }, { status: 400 })
    }

    const result = await saveFile(file, category)
    const fileCategory = getFileCategory(file.type)

    return NextResponse.json({
      ...result,
      category: fileCategory,
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Upload gagal' }, { status: 500 })
  }
}
