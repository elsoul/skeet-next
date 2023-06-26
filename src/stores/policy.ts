import { atom } from 'recoil'

type PolicyAgreedState = boolean

export const policyAgreedState = atom<PolicyAgreedState>({
  key: 'policyAgreedState',
  default: false,
})
