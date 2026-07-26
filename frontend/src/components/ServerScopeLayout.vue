<script setup>
import { computed, provide, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'
import { useDashboardData } from '../composables/useDashboardData'
import { usePolling } from '../composables/usePolling'
import { hasRole } from '../composables/useRole'
import HeartbeatHeader from './HeartbeatHeader.vue'
import ServerSwitcher from './ServerSwitcher.vue'

const { t } = useI18n()
const route = useRoute()
const serverId = computed(() => route.params.serverId)

const dashboardData = useDashboardData(serverId)
provide('dashboardData', dashboardData)

const serverInfo = ref(null)
provide('serverInfo', serverInfo)

async function loadServerInfo() {
  try {
    serverInfo.value = await api(`/api/servers/${serverId.value}`)
  } catch {
    serverInfo.value = null
  }
}

const polling = usePolling(dashboardData.refreshAll, 10_000)
onMounted(() => polling.start())
onUnmounted(() => polling.stop())

watch(serverId, () => {
  dashboardData.refreshAll()
  loadServerInfo()
}, { immediate: true })
</script>

<template>
  <HeartbeatHeader />
  <ServerSwitcher :current-server-id="serverId" />
  <nav class="tabs">
    <router-link class="tab" :to="{ name: 'server-dashboard', params: { serverId } }">{{ t('serverNav.dashboard') }}</router-link>
    <router-link class="tab" :to="{ name: 'server-settings', params: { serverId } }">{{ t('serverNav.settings') }}</router-link>
    <router-link class="tab" :to="{ name: 'server-bans', params: { serverId } }">{{ t('serverNav.bans') }}</router-link>
    <router-link class="tab" :to="{ name: 'server-metrics-history', params: { serverId } }">{{ t('serverNav.history') }}</router-link>
    <router-link v-if="hasRole('admin')" class="tab" :to="{ name: 'server-console', params: { serverId } }">{{ t('serverNav.console') }}</router-link>
    <router-link v-if="hasRole('admin')" class="tab" :to="{ name: 'server-scheduled-tasks', params: { serverId } }">{{ t('serverNav.scheduledTasks') }}</router-link>
  </nav>
  <main>
    <router-view />
  </main>
</template>
