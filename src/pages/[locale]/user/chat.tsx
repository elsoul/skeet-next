import { ReactElement } from 'react'
import UserLayout from '@/layouts/user/UserLayout'
import DiscordRow from '@/components/pages/common/DiscordRow'
import siteConfig from '@/config/site'
import { getStaticPaths, makeStaticProps } from '@/lib/getStatic'

const seo = {
  pathname: '/user/chat',
  title: {
    ja: 'AIチャット',
    en: 'AI Chat',
  },
  description: {
    ja: siteConfig.descriptionJA,
    en: siteConfig.descriptionEN,
  },
  img: null,
}

const getStaticProps = makeStaticProps(['common', 'user'], seo)
export { getStaticPaths, getStaticProps }

export default function Chat() {
  return (
    <>
      <DiscordRow />
    </>
  )
}

Chat.getLayout = function getLayout(page: ReactElement) {
  return <UserLayout>{page}</UserLayout>
}
