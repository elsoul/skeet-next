import type { ReactNode } from 'react'
import { useEffect, useCallback } from 'react'
import CommonFooter from '@/layouts/common/CommonFooter'

import { useRouter } from 'next/router'
import AuthHeader from './AuthHeader'

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
