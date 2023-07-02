import ChatMenu from '@/components/pages/user/chat/ChatMenu'
import ChatBox from '@/components/pages/user/chat/ChatBox'
import { useState } from 'react'

export default function ChatScreen() {
  const [isNewChatModalOpen, setNewChatModalOpen] = useState(false)
  const [currentChatRoomId, setCurrentChatRoomId] = useState<string | null>(
    null
  )
  return (
    <>
      <div className="flex flex-col items-start justify-start sm:flex-row">
        <ChatMenu
          isNewChatModalOpen={isNewChatModalOpen}
          setNewChatModalOpen={setNewChatModalOpen}
          currentChatRoomId={currentChatRoomId}
          setCurrentChatRoomId={setCurrentChatRoomId}
        />
        <ChatBox
          setNewChatModalOpen={setNewChatModalOpen}
          currentChatRoomId={currentChatRoomId}
        />
      </div>
    </>
  )
}
