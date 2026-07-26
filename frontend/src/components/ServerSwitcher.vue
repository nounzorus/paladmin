<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { servers, loadServers } from '../composables/useServers'

const { t } = useI18n()
defineProps({ currentServerId: [String, Number] })
const route = useRoute()
const router = useRouter()

onMounted(() => { if (!servers.value.length) loadServers() })

function onChange(e) {
  router.push({ name: route.name, params: { ...route.params, serverId: e.target.value } })
}
</script>

<template>
  <div class="server-switcher">
    <select :value="String(currentServerId)" @change="onChange">
      <option v-for="s in servers" :key="s.id" :value="String(s.id)">{{ s.name }}</option>
    </select>
    <router-link class="btn btn-sm btn-ghost" :to="{ name: 'servers' }">{{ t('serverSwitcher.allServers') }}</router-link>
  </div>
</template>
