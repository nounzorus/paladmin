import { token, clearToken } from './session'
import i18n from '../i18n'

function translateApiError(code, params) {
  const key = `errors.${code}`
  if (i18n.global.te(key)) return i18n.global.t(key, params || {})
  return code
}

export async function api(path, opts = {}) {
  const r = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token.value,
      ...(opts.headers || {}),
    },
  })
  const data = await r.json().catch(() => ({}))
  if (r.status === 401 && path !== '/auth/login') {
    clearToken()
    throw new Error(i18n.global.t('errors.SESSION_EXPIRED'))
  }
  if (!r.ok) throw new Error(data.error ? translateApiError(data.error, data.params) : `Error ${r.status}`)
  return data
}
