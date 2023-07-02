import { useRecoilCallback } from 'recoil'
import { userState } from '@/store/user'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'

export default function useLogout() {
  const logout = useRecoilCallback(({ reset }) => async () => {
    if (auth) {
      reset(userState)
      await signOut(auth)
    }
  })
  return logout
}
