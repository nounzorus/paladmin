import { reactive } from 'vue'

export const toastState = reactive({ message: '', isError: false, visible: false })

let toastTimer
export function toast(msg, isError = false) {
  toastState.message = msg
  toastState.isError = isError
  toastState.visible = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastState.visible = false }, 4000)
}
