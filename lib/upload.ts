// lib/upload.ts
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'sticker'

export function getFileCategory(mimeType: string): FileCategory {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'document'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export async function saveFile(file: File, category: string): Promise<{
  url: string
  fileName: string
  fileSize: number
  fileMime: string
}> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File terlalu besar (maksimal 50MB)')
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = file.name.split('.').pop() || 'bin'
  const uniqueName = `${uuidv4()}.${ext}`
  const dir = join(UPLOAD_DIR, category)

  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, uniqueName), buffer)

  return {
    url: `/uploads/${category}/${uniqueName}`,
    fileName: file.name,
    fileSize: file.size,
    fileMime: file.type,
  }
}

export const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/mp4'],
  document: [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
}

export function isAllowedType(mimeType: string): boolean {
  return Object.values(ALLOWED_TYPES).flat().includes(mimeType)
}
