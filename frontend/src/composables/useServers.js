import { ref } from 'vue'
import { api } from './useApi'

export const servers = ref([])
export const serversLoaded = ref(false)

export async function loadServers() {
  servers.value = await api('/api/servers')
  serversLoaded.value = true
}
