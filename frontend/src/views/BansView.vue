<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'
import { toast } from '../composables/useToast'
import { confirmDialog } from '../composables/useConfirm'
import { hasRole } from '../composables/useRole'

const { t } = useI18n()
const route = useRoute()
const bans = ref([])
const loading = ref(true)
const errorMessage = ref('')

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    bans.value = await api(`/api/servers/${route.params.serverId}/players/bans`)
  } catch (e) {
    errorMessage.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function onUnban(userid) {
  if (!(await confirmDialog(t('confirm.title'), t('bans.confirmUnban', { uid: userid })))) return
  try {
    await api(`/api/servers/${route.params.serverId}/players/unban`, { method: 'POST', body: JSON.stringify({ userid }) })
    toast(t('bans.unbanned', { uid: userid }))
    load()
  } catch (err) {
    toast(err.message, true)
  }
}
</script>

<template>
  <section class="tab-panel active">
    <div class="card">
      <div class="card-head">
        <h2>{{ t('bans.title') }}</h2>
        <span class="card-hint">{{ t('bans.hint') }}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>{{ t('bans.id') }}</th><th>{{ t('bans.bannedBy') }}</th><th>{{ t('bans.date') }}</th><th v-if="hasRole('admin','moderator')" class="th-actions">{{ t('bans.actions') }}</th></tr></thead>
          <tbody>
            <tr v-if="loading"><td colspan="4" class="empty">{{ t('bans.loading') }}</td></tr>
            <tr v-else-if="errorMessage"><td colspan="4" class="empty">{{ errorMessage }}</td></tr>
            <tr v-else-if="!bans.length"><td colspan="4" class="empty">{{ t('bans.empty') }}</td></tr>
            <tr v-for="b in bans" :key="b.userid" v-else>
              <td class="mono">{{ b.userid }}</td>
              <td>{{ b.banned_by }}</td>
              <td class="mono">{{ b.created_at }}</td>
              <td v-if="hasRole('admin','moderator')" class="actions">
                <button class="btn btn-sm" @click="onUnban(b.userid)">{{ t('bans.unban') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
