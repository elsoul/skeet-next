import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { PaperAirplaneIcon, PlusCircleIcon } from '@heroicons/react/24/outline'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { userState } from '@/store/user'
import { auth, db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore'
import { chatContentSchema } from '@/utils/form'
import { fetchSkeetFunctions } from '@/lib/skeet'
import Image from 'next/image'
import { ChatRoom } from './ChatMenu'
import { AddStreamUserChatRoomMessageParams } from '@/types/http/openai/addStreamUserChatRoomMessageParams'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextDecoder } from 'text-encoding'
import useToastMessage from '@/hooks/useToastMessage'
import useLogout from '@/hooks/useLogout'

type ChatMessage = {
  id: string
  role: string
  createdAt: string
  updatedAt: string
  content: string
}

const schema = z.object({
  chatContent: chatContentSchema,
})

type Inputs = z.infer<typeof schema>

type Props = {
  setNewChatModalOpen: (_value: boolean) => void
  currentChatRoomId: string | null
}

export default function ChatBox({
  setNewChatModalOpen,
  currentChatRoomId,
}: Props) {
  const { t } = useTranslation()
  const user = useRecoilValue(userState)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const addToast = useToastMessage()
  const logout = useLogout()

  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      chatContent: '',
    },
  })

  // const scrollViewRef = useRef<ScrollView>(null)
  // const scrollToEnd = useCallback(() => {
  //   if (currentChatRoomId) {
  //     scrollViewRef.current?.scrollToEnd({ animated: false })
  //   }
  // }, [scrollViewRef, currentChatRoomId])
  // useEffect(() => {
  //   if (chatMessages.length > 0) {
  //     scrollToEnd()
  //   }
  // }, [chatMessages, scrollToEnd])
  const [isFirstMessage, setFirstMessage] = useState(true)

  const getChatRoom = useCallback(async () => {
    if (db && user.uid && currentChatRoomId) {
      const docRef = doc(
        db,
        `User/${user.uid}/UserChatRoom/${currentChatRoomId}`
      )
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.title !== '') {
          setFirstMessage(false)
        }
        setChatRoom({ id: docSnap.id, ...data } as ChatRoom)
      } else {
        console.log('No such document!')
      }
    }
  }, [currentChatRoomId, user.uid])

  useEffect(() => {
    getChatRoom()
  }, [getChatRoom])

  const [isSending, setSending] = useState(false)

  const getUserChatRoomMessage = useCallback(async () => {
    if (db && user.uid && currentChatRoomId) {
      const q = query(
        collection(
          db,
          `User/${user.uid}/UserChatRoom/${currentChatRoomId}/UserChatRoomMessage`
        ),
        orderBy('createdAt', 'asc')
      )
      const querySnapshot = await getDocs(q)
      const messages: ChatMessage[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        messages.push({
          id: doc.id,
          ...data,
        } as ChatMessage)
      })
      setChatMessages(messages)
    }
  }, [currentChatRoomId, user.uid])

  useEffect(() => {
    getUserChatRoomMessage()
  }, [getUserChatRoomMessage])

  const isDisabled = useMemo(() => {
    return isSending || errors.chatContent != null
  }, [isSending, errors.chatContent])

  const onSubmit = useCallback(
    async (data: Inputs) => {
      try {
        if (!isDisabled && user.uid && currentChatRoomId) {
          setSending(true)
          setChatMessages((prev) => {
            prev.push({
              id: `UserSendingMessage${new Date().toISOString()}`,
              role: 'user',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              content: data.chatContent,
            })
            prev.push({
              id: `AssistantAnsweringMessage${new Date().toISOString()}`,
              role: 'assistant',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              content: '',
            })
            return [...prev]
          })
          const res =
            await fetchSkeetFunctions<AddStreamUserChatRoomMessageParams>(
              'openai',
              'addStreamUserChatRoomMessage',
              {
                userChatRoomId: currentChatRoomId,
                content: data.chatContent,
                isFirstMessage,
              }
            )
          const reader = await res?.body?.getReader()
          const decoder = new TextDecoder('utf-8')

          const readChunk = async () => {
            return reader?.read().then(({ value, done }): any => {
              try {
                if (!done) {
                  const dataString = decoder.decode(value)
                  if (dataString != 'Stream done') {
                    const data = JSON.parse(dataString)
                    setChatMessages((prev) => {
                      prev[prev.length - 1].content =
                        prev[prev.length - 1].content + data.text
                      return [...prev]
                    })
                  }
                } else {
                  // done
                }
              } catch (error) {
                console.log(error)
              }
              if (!done) {
                return readChunk()
              }
            })
          }
          await readChunk()

          if (chatRoom && chatRoom.title == '') {
            await getChatRoom()
          }
          await getUserChatRoomMessage()
          setFirstMessage(false)
        } else {
          throw new Error('validateError')
        }
      } catch (err) {
        console.error(err)
        if (
          err instanceof Error &&
          (err.message.includes('Firebase ID token has expired.') ||
            err.message.includes('Error: getUserAuth'))
        ) {
          addToast({
            type: 'error',
            title: t('errorTokenExpiredTitle'),
            description: t('errorTokenExpiredBody'),
          })
          if (auth) {
            await logout()
          }
        } else {
          addToast({
            type: 'error',
            title: t('errorTitle'),
            description: t('errorBody'),
          })
        }
      } finally {
        setSending(false)
      }
    },
    [
      isDisabled,
      t,
      currentChatRoomId,
      user.uid,
      setFirstMessage,
      isFirstMessage,
      chatRoom,
      getChatRoom,
      getUserChatRoomMessage,
    ]
  )

  return (
    <>
      <div className="w-full p-4 sm:flex-1">
        {!currentChatRoomId && (
          <div className="flex w-full flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
            <div className="flex w-full flex-col items-center justify-center gap-2 p-4">
              <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                {t('chat:chatGPTCustom')}
              </h2>
              <button
                onClick={() => {
                  setNewChatModalOpen(true)
                }}
                className={clsx(
                  'flex w-full flex-row items-center justify-center gap-4 bg-gray-900 px-3 py-2 dark:bg-gray-600'
                )}
              >
                <PlusCircleIcon className="h-6 w-6 text-white" />
                <span className="text-lg font-bold text-white">
                  {t('chat:newChat')}
                </span>
              </button>
            </div>
          </div>
        )}
        {currentChatRoomId && (
          <div className="flex w-full flex-col justify-between gap-4">
            <div className="flex w-full flex-1">
              <div className="pb-24">
                {chatMessages.map((chatMessage) => (
                  <div
                    key={chatMessage.id}
                    className={clsx(
                      chatMessage.role === 'system' &&
                        'bg-gray-100 dark:bg-gray-700',
                      chatMessage.role === 'assistant' &&
                        'bg-blue-50 dark:bg-gray-800',
                      'flex flex-row items-start justify-start gap-4 p-4 md:gap-6'
                    )}
                  >
                    {chatMessage.role === 'user' && (
                      <div className="flex">
                        <Image
                          src={user.iconUrl}
                          alt="User icon"
                          className="aspect-square h-6 w-6 rounded-full sm:h-10 sm:w-10"
                          unoptimized
                          width={40}
                          height={40}
                        />
                      </div>
                    )}
                    {(chatMessage.role === 'assistant' ||
                      chatMessage.role === 'system') &&
                      chatRoom?.model === 'gpt-3.5-turbo' && (
                        <div className="flex">
                          <Image
                            src={
                              'https://storage.googleapis.com/epics-bucket/BuidlersCollective/Jake.png'
                            }
                            alt="Jake icon"
                            className="aspect-square h-6 w-6 rounded-full sm:h-10 sm:w-10"
                            unoptimized
                            width={40}
                            height={40}
                          />
                        </div>
                      )}
                    {(chatMessage.role === 'assistant' ||
                      chatMessage.role === 'system') &&
                      chatRoom?.model === 'gpt-4' && (
                        <div className="flex">
                          <Image
                            src={
                              'https://storage.googleapis.com/epics-bucket/BuidlersCollective/Legend.png'
                            }
                            alt="Legend icon"
                            className="aspect-square h-6 w-6 rounded-full sm:h-10 sm:w-10"
                            unoptimized
                            width={40}
                            height={40}
                          />
                        </div>
                      )}
                    <div className="flex-auto">
                      {chatMessage.role === 'system' && (
                        <div className="pb-2">
                          <p className="text-base font-bold text-gray-900 dark:text-white">
                            {chatRoom?.title ? chatRoom?.title : t('noTitle')}
                          </p>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {chatRoom?.model}: {chatRoom?.maxTokens}{' '}
                            {t('tokens')}
                          </p>
                        </div>
                      )}
                      <p className="font-normal text-gray-900 dark:text-white">
                        {chatMessage.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-row items-end gap-4">
              <form onSubmit={handleSubmit(onSubmit)}>
                <Controller
                  name="chatContent"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      className="flex-1 border-2 border-gray-900 p-1 text-sm font-normal text-gray-900 dark:border-gray-50 dark:text-white sm:text-lg"
                      rows={5}
                    />
                  )}
                />

                <button
                  type="submit"
                  disabled={isDisabled}
                  className={clsx(
                    'flex h-10 w-10 flex-row items-center justify-center bg-gray-900 px-3 py-2',
                    isDisabled
                      ? 'bg-gray-300 dark:bg-gray-800 dark:text-gray-400'
                      : 'dark:bg-gray-600'
                  )}
                >
                  <PaperAirplaneIcon className="mx-3 h-6 w-6 flex-shrink-0 text-white" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
