import { ref } from 'vue'

export const token = ref(sessionStorage.getItem('pal_token') || '')
export const username = ref(sessionStorage.getItem('pal_username') || '')
export const role = ref(sessionStorage.getItem('pal_role') || '')

export function setSession(t, u, r) {
  token.value = t
  username.value = u
  role.value = r
  sessionStorage.setItem('pal_token', t)
  sessionStorage.setItem('pal_username', u)
  sessionStorage.setItem('pal_role', r)
}

export function clearToken() {
  token.value = ''
  username.value = ''
  role.value = ''
  sessionStorage.removeItem('pal_token')
  sessionStorage.removeItem('pal_username')
  sessionStorage.removeItem('pal_role')
}
