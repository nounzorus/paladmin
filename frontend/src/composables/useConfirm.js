import { reactive } from 'vue'

export const confirmState = reactive({ visible: false, title: 'Confirmer', text: '' })

let resolvePromise = null

export function confirmDialog(title, text) {
  confirmState.title = title
  confirmState.text = text
  confirmState.visible = true
  return new Promise((resolve) => { resolvePromise = resolve })
}

function done(value) {
  confirmState.visible = false
  const resolve = resolvePromise
  resolvePromise = null
  if (resolve) resolve(value)
}

export function handleOk() { done(true) }
export function handleCancel() { done(false) }
