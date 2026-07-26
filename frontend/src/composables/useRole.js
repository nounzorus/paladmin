import { currentRole } from './useAuth'

export function hasRole(...allowed) {
  return allowed.includes(currentRole.value)
}
