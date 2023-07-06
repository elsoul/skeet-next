import { useRecoilCallback } from 'recoil'
import { userState } from '@/store/user'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'

export default function useLogout() {
  const logout = useRecoilCallback(({ reset }) => () => {
    if (auth) {
      reset(userState)
      signOut(auth)
    }
  })
  return logout
}
