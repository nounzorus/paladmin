import { computed } from 'vue'
import { token, role, setSession, clearToken } from './session'
import { api } from './useApi'

export const isAuthenticated = computed(() => !!token.value)
export const currentRole = role

export async function login(username, password) {
  const data = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setSession(data.token, data.username, data.role)
}

export async function logout() {
  try { await api('/auth/logout', { method: 'POST' }) } catch {}
  clearToken()
}
