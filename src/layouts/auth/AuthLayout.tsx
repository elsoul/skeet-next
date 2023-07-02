import type { ReactNode } from 'react'
import { useEffect, useCallback, useState } from 'react'
import CommonFooter from '@/layouts/common/CommonFooter'
import { User } from 'firebase/auth'

import { useRouter } from 'next/router'
import AuthHeader from './AuthHeader'
import { useRecoilState } from 'recoil'
import { userState } from '@/store/user'
import { auth, db } from '@/lib/firebase'
import useLogout from '@/hooks/useLogout'
import { doc, getDoc } from 'firebase/firestore'

type Props = {
  children: ReactNode
}

const mainContentId = 'authMainContent'

export default function AuthLayout({ children }: Props) {
  const router = useRouter()

  const resetWindowScrollPosition = useCallback(() => {
    const element = document.getElementById(mainContentId)
    if (element) {
      element.scrollIntoView({ block: 'start' })
    }
  }, [])
  useEffect(() => {
    ;(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      if (!router.asPath.includes('#')) {
        resetWindowScrollPosition()
      }
    })()
  }, [router.asPath, resetWindowScrollPosition])

  const [initializing, setInitializing] = useState(true)
  const [_user, setUser] = useRecoilState(userState)
  const logout = useLogout()

  const onAuthStateChanged = useCallback(
    async (fbUser: User | null) => {
      if (initializing) setInitializing(false)
      if (auth && db && fbUser && fbUser.emailVerified) {
        const docRef = doc(db, 'User', fbUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email ?? '',
            username: docSnap.data().username,
            iconUrl: docSnap.data().iconUrl,
            emailVerified: fbUser.emailVerified,
          })
          router.push('/user/chat')
        } else {
          await logout()
        }
      } else {
        await logout()
      }
    },
    [setUser, initializing, setInitializing]
  )

  useEffect(() => {
    if (auth) {
      const subscriber = auth.onAuthStateChanged(onAuthStateChanged)
      return subscriber
    }
  }, [onAuthStateChanged])

  return (
    <>
      <div className="relative h-full w-full bg-white dark:bg-gray-900">
        <AuthHeader />
        <div id={mainContentId} className="min-h-screen">
          {children}
        </div>
        <CommonFooter />
      </div>
    </>
  )
}
