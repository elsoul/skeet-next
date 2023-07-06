import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import {
  ChatBubbleLeftIcon,
  PlusCircleIcon,
  QueueListIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import LogoHorizontal from '@/components/common/atoms/LogoHorizontal'
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
} from 'react'
import { fetchSkeetFunctions } from '@/lib/skeet'
import { CreateUserChatRoomParams } from '@/types/http/openai/createUserChatRoomParams'
import { useRecoilValue } from 'recoil'
import { userState } from '@/store/user'
import {
  GPTModel,
  allowedGPTModel,
  gptModelSchema,
  temperatureSchema,
  maxTokensSchema,
  systemContentSchema,
} from '@/utils/form'

import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format } from 'date-fns'
import ChatMenuLoading from '@/components/loading/ChatMenuLoading'
import { auth } from '@/lib/firebase'
import useToastMessage from '@/hooks/useToastMessage'
import { Dialog, Transition } from '@headlessui/react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import useLogout from '@/hooks/useLogout'

export type ChatRoom = {
  id: string
  createdAt: Timestamp
  updatedAt: Timestamp
  model: GPTModel
  maxTokens: number
  temperature: number
  title: string
}

const schema = z.object({
  model: gptModelSchema,
  maxTokens: maxTokensSchema,
  temperature: temperatureSchema,
  systemContent: systemContentSchema,
})

type Inputs = z.infer<typeof schema>

type Props = {
  isNewChatModalOpen: boolean
  setNewChatModalOpen: (_value: boolean) => void
  currentChatRoomId: string | null
  setCurrentChatRoomId: (_value: string | null) => void
}

export default function ChatMenu({
  isNewChatModalOpen,
  setNewChatModalOpen,
  currentChatRoomId,
  setCurrentChatRoomId,
}: Props) {
  const { t, i18n } = useTranslation()
  const isJapanese = useMemo(() => i18n.language === 'ja', [i18n])
  const user = useRecoilValue(userState)
  const [isCreateLoading, setCreateLoading] = useState(false)
  const [isChatListModalOpen, setChatListModalOpen] = useState(false)
  const addToast = useToastMessage()
  const logout = useLogout()

  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 1,
      systemContent: isJapanese
        ? 'あなたは、親切で、創造的で、賢く、とてもフレンドリーなアシスタントです。'
        : 'You are the assistant who is helpful, creative, clever, and very friendly.',
    },
  })

  const [chatList, setChatList] = useState<ChatRoom[]>([])
  const [lastChat, setLastChat] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [reachLast, setReachLast] = useState(false)
  const [isDataLoading, setDataLoading] = useState(false)

  const queryMore = useCallback(async () => {
    let unsubscribe = () => {}
    if (db && user.uid && lastChat) {
      try {
        const q = query(
          collection(db, `User/${user.uid}/UserChatRoom`),
          orderBy('createdAt', 'desc'),
          limit(15),
          startAfter(lastChat)
        )

        unsubscribe = onSnapshot(q, (querySnapshot) => {
          setDataLoading(true)
          const list: ChatRoom[] = []
          querySnapshot.forEach((doc) => {
            const data = doc.data()
            list.push({ id: doc.id, ...data } as ChatRoom)
          })

          if (querySnapshot.docs[querySnapshot.docs.length - 1] === lastChat) {
            setReachLast(true)
          } else {
            setLastChat(querySnapshot.docs[querySnapshot.docs.length - 1])
            setChatList([...chatList, ...list])
          }
          setDataLoading(false)
        })
      } catch (err) {
        console.log(err)
        if (err instanceof Error && err.message.includes('permission-denied')) {
          addToast({
            type: 'error',
            title: t('errorTokenExpiredTitle'),
            description: t('errorTokenExpiredBody'),
          })
          if (auth) {
            logout()
          }
        } else {
          addToast({
            type: 'error',
            title: t('errorTitle'),
            description: t('errorBody'),
          })
        }
      }
    }
    return () => unsubscribe()
  }, [chatList, lastChat, t, user.uid, setDataLoading, addToast, logout])

  const chatMenuRef = useRef<HTMLDivElement>(null)
  const chatMenuRefMobile = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const current = chatMenuRef.current
    if (current) {
      const isBottom =
        current.scrollHeight - current.scrollTop === current.clientHeight
      if (isBottom) {
        queryMore()
      }
    }
  }, [queryMore, chatMenuRef])

  const handleScrollMobile = useCallback(() => {
    const current = chatMenuRefMobile.current

    if (current) {
      const isBottom =
        Math.floor(current.scrollHeight - current.scrollTop) ===
        current.clientHeight
      if (isBottom) {
        queryMore()
      }
    }
  }, [queryMore, chatMenuRefMobile])

  useEffect(() => {
    let unsubscribe = () => {}

    if (db && user.uid) {
      try {
        const q = query(
          collection(db, `User/${user.uid}/UserChatRoom`),
          orderBy('createdAt', 'desc'),
          limit(15)
        )

        unsubscribe = onSnapshot(q, (querySnapshot) => {
          setDataLoading(true)
          const list: ChatRoom[] = []
          querySnapshot.forEach((doc) => {
            const data = doc.data()
            list.push({ id: doc.id, ...data } as ChatRoom)
          })
          setChatList(list)
          setLastChat(querySnapshot.docs[querySnapshot.docs.length - 1])
          setDataLoading(false)
        })
      } catch (err) {
        console.log(err)
        if (err instanceof Error && err.message.includes('permission-denied')) {
          addToast({
            type: 'error',
            title: t('errorTokenExpiredTitle') ?? 'Token Expired.',
            description: t('errorTokenExpiredBody') ?? 'Please sign in again.',
          })
          if (auth) {
            logout()
          }
        } else {
          addToast({
            type: 'error',
            title: t('errorTitle') ?? 'Error',
            description:
              t('errorBody') ?? 'Something went wrong... Please try it again.',
          })
        }
      }
    }
    return () => unsubscribe()
  }, [user.uid, t, addToast, logout])

  const isDisabled = useMemo(() => {
    return (
      isCreateLoading ||
      errors.model != null ||
      errors.systemContent != null ||
      errors.maxTokens != null ||
      errors.temperature != null
    )
  }, [
    isCreateLoading,
    errors.model,
    errors.systemContent,
    errors.maxTokens,
    errors.temperature,
  ])

  const onSubmit = useCallback(
    async (data: Inputs) => {
      try {
        setCreateLoading(true)
        if (!isDisabled) {
          const res = await fetchSkeetFunctions<CreateUserChatRoomParams>(
            'openai',
            'createUserChatRoom',
            {
              model: data.model,
              systemContent: data.systemContent,
              maxTokens: data.maxTokens,
              temperature: data.temperature,
              stream: true,
            }
          )
          const resData = await res?.json()
          if (resData.status == 'error') {
            throw new Error(resData.message)
          }
          addToast({
            type: 'success',
            title: t('chat:chatRoomCreatedSuccessTitle'),
            description: t('chat:chatRoomCreatedSuccessBody'),
          })
          setCurrentChatRoomId(resData.userChatRoomRef.id)
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

          logout()
        } else {
          addToast({
            type: 'error',
            title: t('errorTitle'),
            description: t('errorBody'),
          })
        }
      } finally {
        setNewChatModalOpen(false)
        setCreateLoading(false)
      }
    },
    [
      setNewChatModalOpen,
      t,
      setCreateLoading,
      isDisabled,
      setCurrentChatRoomId,
      addToast,
      logout,
    ]
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        handleSubmit(onSubmit)()
      }
    },
    [handleSubmit, onSubmit]
  )

  return (
    <>
      <div className="flex w-full flex-col items-center justify-start pb-4 sm:w-64 sm:pb-0">
        <div className="w-full sm:hidden">
          <div className="flex w-full flex-row items-center justify-center">
            <button
              onClick={() => {
                setChatListModalOpen(true)
              }}
              className={clsx('flex flex-row items-center justify-center')}
            >
              <QueueListIcon
                className={clsx(
                  'h-6 w-6 flex-shrink-0 text-gray-900 dark:text-white'
                )}
              />
            </button>
            <div className="flex-grow" />
            <h2 className="text-center font-bold">{t('chat:title')}</h2>
            <div className="flex-grow" />
            <button
              onClick={() => {
                setNewChatModalOpen(true)
              }}
              className={clsx('flex flex-row items-center justify-center')}
            >
              <PlusCircleIcon
                className={clsx(
                  'h-6 w-6 flex-shrink-0 text-gray-900 dark:text-white'
                )}
              />
            </button>
          </div>
        </div>
        <div
          ref={chatMenuRef}
          onScroll={handleScroll}
          className="content-height hidden w-full overflow-auto p-2 sm:flex"
        >
          <div className="flex w-full flex-col gap-6">
            <button
              onClick={() => {
                setNewChatModalOpen(true)
              }}
              className={clsx(
                'flex w-full flex-row items-center justify-center bg-gray-900 px-3 py-2 dark:bg-gray-600'
              )}
            >
              <PlusCircleIcon className="mr-3 h-6 w-6 flex-shrink-0 text-white" />
              <span className="text-center text-lg font-bold text-white">
                {t('chat:newChat')}
              </span>
            </button>
            <div className="flex flex-col gap-3 pb-20">
              {chatList.map((chat) => (
                <div
                  onClick={() => {
                    setCurrentChatRoomId(chat.id)
                  }}
                  key={`ChatMenu Desktop ${chat.id}`}
                  className={clsx(
                    currentChatRoomId === chat.id &&
                      'border-2 border-gray-900 dark:border-gray-50',
                    'flex flex-row items-start justify-start gap-2 bg-gray-50 p-2 hover:cursor-pointer dark:bg-gray-800'
                  )}
                >
                  <ChatBubbleLeftIcon
                    className={clsx(
                      'h-5 w-5 flex-shrink-0 text-gray-900 dark:text-white'
                    )}
                  />
                  <div className="flex flex-col gap-2">
                    {chat.title !== '' ? (
                      <p className="font-medium text-gray-900 dark:text-white">
                        {chat.title.length > 20
                          ? `${chat.title.slice(0, 20)} ...`
                          : chat.title}
                      </p>
                    ) : (
                      <p className="font-light italic text-gray-600 dark:text-gray-300">
                        {t('noTitle')}
                      </p>
                    )}
                    <p className="text-sm font-light text-gray-700 dark:text-gray-200">
                      {format(chat.createdAt.toDate(), 'yyyy-MM-dd HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {isDataLoading && <ChatMenuLoading />}
          </div>
        </div>
      </div>
      <Transition appear show={isNewChatModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setNewChatModalOpen(false)}
        >
          <div className="text-center">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="my-8 inline-block w-full max-w-xl -translate-y-10 transform overflow-hidden bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-900">
                <div className="flex w-full flex-col pb-8">
                  <div className="flex flex-row items-center justify-center p-4">
                    <LogoHorizontal className="w-24" />
                    <div className="flex-grow" />
                    <button
                      onClick={() => {
                        setNewChatModalOpen(false)
                      }}
                      className="h-5 w-5 text-gray-900 hover:cursor-pointer hover:text-gray-700 dark:text-gray-50 dark:hover:text-gray-200"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex flex-grow flex-col gap-2">
                    <p className="text-center text-lg font-bold">
                      {t('chat:newChat')}
                    </p>
                    <div className="w-full sm:mx-auto sm:max-w-xl">
                      <div className="gap-6  sm:px-10">
                        <form onSubmit={handleSubmit(onSubmit)}>
                          <div className="flex flex-col gap-6  py-6 sm:px-10">
                            <div>
                              <p className="text-sm font-medium leading-6 text-gray-900 dark:text-gray-50">
                                {t('chat:model')}
                                {errors.model && (
                                  <span className="text-xs text-red-500 dark:text-red-300">
                                    {' : '}
                                    {t('chat:modelErrorText')}
                                  </span>
                                )}
                              </p>
                              <div className="mt-2">
                                <Controller
                                  name="model"
                                  control={control}
                                  render={({ field }) => (
                                    <select
                                      {...field}
                                      className="w-full border-2 border-gray-900 p-3 text-lg font-bold text-gray-900 dark:border-gray-50 dark:text-white sm:leading-6"
                                    >
                                      {allowedGPTModel.map((model) => (
                                        <option key={model} value={model}>
                                          {model}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium leading-6 text-gray-900 dark:text-gray-50">
                                {t('chat:maxTokens')}
                                {errors.maxTokens && (
                                  <span className="text-xs text-red-500 dark:text-red-300">
                                    {' : '}
                                    {t('chat:maxTokensErrorText')}
                                  </span>
                                )}
                              </p>
                              <div className="mt-2">
                                <Controller
                                  name="maxTokens"
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      className="w-full border-2 border-gray-900 p-3 text-lg font-bold text-gray-900 dark:border-gray-50 dark:text-white sm:leading-6"
                                      type="number"
                                      inputMode="numeric"
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value
                                            ? parseFloat(e.target.value)
                                            : 0
                                        )
                                      }
                                    />
                                  )}
                                />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium leading-6 text-gray-900 dark:text-gray-50">
                                {t('chat:temperature')}
                                {errors.temperature && (
                                  <span className="text-xs text-red-500 dark:text-red-300">
                                    {' : '}
                                    {t('chat:temperatureErrorText')}
                                  </span>
                                )}
                              </p>
                              <div className="mt-2">
                                <Controller
                                  name="temperature"
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      type="number"
                                      inputMode="decimal"
                                      className="w-full border-2 border-gray-900 p-3 text-lg font-bold text-gray-900 dark:border-gray-50 dark:text-white sm:leading-6"
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value
                                            ? parseFloat(e.target.value)
                                            : 0
                                        )
                                      }
                                    />
                                  )}
                                />
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium leading-6 text-gray-900 dark:text-gray-50">
                                {t('chat:systemContent')}
                                {errors.systemContent && (
                                  <span className="text-xs text-red-500 dark:text-red-300">
                                    {' : '}
                                    {t('chat:systemContentErrorText')}
                                  </span>
                                )}
                              </p>
                              <div className="mt-2">
                                <Controller
                                  name="systemContent"
                                  control={control}
                                  render={({ field }) => (
                                    <textarea
                                      {...field}
                                      onKeyDown={onKeyDown}
                                      className="w-full border-2 border-gray-900 p-3 text-lg font-bold text-gray-900 dark:border-gray-50 dark:text-white sm:leading-6"
                                    />
                                  )}
                                />
                              </div>
                            </div>

                            <div>
                              <button
                                type="submit"
                                disabled={isDisabled}
                                className={clsx(
                                  isDisabled
                                    ? 'cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                    : 'bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200',
                                  'w-full px-3 py-2 text-center text-lg font-bold'
                                )}
                              >
                                {t('chat:createChatRoom')}
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={isChatListModalOpen} as={Fragment}>
        <Dialog
          as="div"
          ref={chatMenuRefMobile}
          onScroll={handleScrollMobile}
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setChatListModalOpen(false)}
        >
          <div className=" text-center">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="my-8 inline-block w-full max-w-xl -translate-y-10 transform overflow-hidden bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-900">
                <div className="flex w-full flex-col bg-white pb-12 dark:bg-gray-900">
                  <div className="flex flex-row items-center justify-center p-4">
                    <LogoHorizontal className="w-24" />
                    <div className="flex-grow" />
                    <button
                      onClick={() => {
                        setChatListModalOpen(false)
                      }}
                      className="h-5 w-5 hover:cursor-pointer"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-900 hover:text-gray-800 dark:text-gray-50 dark:hover:text-gray-100" />
                    </button>
                  </div>
                  <div className="flex w-full flex-grow flex-col gap-2">
                    <p className="text-center text-lg font-bold">
                      {t('chat:chatList')}
                    </p>
                    <div className="w-full sm:mx-auto sm:max-w-xl">
                      <div className="flex flex-col gap-3 pb-20 sm:px-10">
                        {chatList.map((chat) => (
                          <div
                            onClick={() => {
                              setCurrentChatRoomId(chat.id)
                              setChatListModalOpen(false)
                            }}
                            key={`ChatMenu Mobile ${chat.id}`}
                            className={clsx(
                              currentChatRoomId === chat.id &&
                                'border-2 border-gray-900 dark:border-gray-50',
                              'flex flex-row items-start justify-start gap-2 bg-gray-50 p-2 hover:cursor-pointer dark:bg-gray-800'
                            )}
                          >
                            <ChatBubbleLeftIcon
                              className={clsx(
                                'h-5 w-5 flex-shrink-0 text-gray-900 dark:text-white'
                              )}
                            />
                            <div className="flex flex-col gap-2">
                              {chat.title !== '' ? (
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {chat.title.length > 20
                                    ? `${chat.title.slice(0, 20)} ...`
                                    : chat.title}
                                </p>
                              ) : (
                                <p className="font-light italic text-gray-600 dark:text-gray-300">
                                  {t('noTitle')}
                                </p>
                              )}

                              <p className="text-sm font-light text-gray-700 dark:text-gray-200">
                                {format(
                                  chat.createdAt.toDate(),
                                  'yyyy-MM-dd HH:mm'
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {isDataLoading && <ChatMenuLoading />}
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
