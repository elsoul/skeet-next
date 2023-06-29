import { ReactElement } from 'react'
import AuthLayout from '@/layouts/auth/AuthLayout'
import DiscordRow from '@/components/pages/common/DiscordRow'
import siteConfig from '@/config/site'
import { getStaticPaths, makeStaticProps } from '@/lib/getStatic'

const seo = {
  pathname: '/auth/login',
  title: {
    ja: 'ログイン',
    en: 'Sign in',
  },
  description: {
    ja: siteConfig.descriptionJA,
    en: siteConfig.descriptionEN,
  },
  img: null,
}

const getStaticProps = makeStaticProps(['common', 'auth'], seo)
export { getStaticPaths, getStaticProps }

export default function Login() {
  return (
    <>
      <DiscordRow />
    </>
  )
}

Login.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>
}
