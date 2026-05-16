// app/chat/page.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ChatClient } from '@/components/ChatClient'

export default async function ChatPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return <ChatClient currentUser={user} />
}
