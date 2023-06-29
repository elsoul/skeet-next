import { ReactElement } from 'react'
import UserLayout from '@/layouts/user/UserLayout'
import DiscordRow from '@/components/pages/common/DiscordRow'
import siteConfig from '@/config/site'
import { getStaticPaths, makeStaticProps } from '@/lib/getStatic'

const seo = {
  pathname: '/user/settings',
  title: {
    ja: 'ユーザー設定',
    en: 'User Settings',
  },
  description: {
    ja: siteConfig.descriptionJA,
    en: siteConfig.descriptionEN,
  },
  img: null,
}

const getStaticProps = makeStaticProps(['common', 'user'], seo)
export { getStaticPaths, getStaticProps }

export default function Settings() {
  return (
    <>
      <DiscordRow />
    </>
  )
}

Settings.getLayout = function getLayout(page: ReactElement) {
  return <UserLayout>{page}</UserLayout>
}
