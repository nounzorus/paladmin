export function usePolling(callback, intervalMs) {
  let timer = null

  function start() {
    callback()
    timer = setInterval(callback, intervalMs)
  }

  function stop() {
    clearInterval(timer)
    timer = null
  }

  return { start, stop }
}
