<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'
import { toast } from '../composables/useToast'
import { confirmDialog } from '../composables/useConfirm'
import { hasRole } from '../composables/useRole'

const { t } = useI18n()
const route = useRoute()
const entries = ref([])
const enabled = ref(false)
const loading = ref(true)
const errorMessage = ref('')

const requests = ref([])
const requestsLoading = ref(true)

const publicJoinUrl = computed(() => `${window.location.origin}/join/${route.params.serverId}`)

function emptyForm() {
  return { userid: '', label: '' }
}
const form = ref(emptyForm())

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await api(`/api/servers/${route.params.serverId}/whitelist`)
    entries.value = data.entries
    enabled.value = data.enabled
  } catch (e) {
    errorMessage.value = e.message
  } finally {
    loading.value = false
  }
}

async function loadRequests() {
  requestsLoading.value = true
  try {
    requests.value = await api(`/api/servers/${route.params.serverId}/whitelist-requests?status=pending`)
  } catch {
    requests.value = []
  } finally {
    requestsLoading.value = false
  }
}

onMounted(() => { load(); loadRequests() })

async function onToggleEnabled() {
  const next = !enabled.value
  try {
    await api(`/api/servers/${route.params.serverId}/whitelist/settings`, {
      method: 'PUT',
      body: JSON.stringify({ enabled: next }),
    })
    enabled.value = next
    toast(next ? t('whitelist.enabled') : t('whitelist.disabled'))
  } catch (err) {
    toast(err.message, true)
  }
}

async function onAdd() {
  if (!form.value.userid) return
  try {
    await api(`/api/servers/${route.params.serverId}/whitelist`, {
      method: 'POST',
      body: JSON.stringify(form.value),
    })
    toast(t('whitelist.added'))
    form.value = emptyForm()
    await load()
  } catch (err) {
    toast(err.message, true)
  }
}

async function onRemove(entry) {
  if (!(await confirmDialog(t('confirm.title'), t('whitelist.confirmRemove', { uid: entry.player_userid })))) return
  try {
    await api(`/api/servers/${route.params.serverId}/whitelist/${entry.id}`, { method: 'DELETE' })
    toast(t('whitelist.removed'))
    await load()
  } catch (err) {
    toast(err.message, true)
  }
}

async function onApprove(reqRow) {
  try {
    await api(`/api/servers/${route.params.serverId}/whitelist-requests/${reqRow.id}/approve`, { method: 'POST' })
    toast(t('whitelistRequests.approved', { uid: reqRow.player_userid }))
    await Promise.all([load(), loadRequests()])
  } catch (err) {
    toast(err.message, true)
  }
}

async function onReject(reqRow) {
  if (!(await confirmDialog(t('confirm.title'), t('whitelistRequests.confirmReject', { uid: reqRow.player_userid })))) return
  try {
    await api(`/api/servers/${route.params.serverId}/whitelist-requests/${reqRow.id}/reject`, { method: 'POST' })
    toast(t('whitelistRequests.rejected', { uid: reqRow.player_userid }))
    await loadRequests()
  } catch (err) {
    toast(err.message, true)
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(publicJoinUrl.value)
    toast(t('whitelistRequests.linkCopied'))
  } catch {
    toast(publicJoinUrl.value)
  }
}
</script>

<template>
  <section class="tab-panel active">
    <div class="grid">
      <div class="col-main">
        <div v-if="hasRole('admin', 'moderator')" class="card">
          <div class="card-head">
            <h2>{{ t('whitelistRequests.title') }}</h2>
            <span class="card-hint">{{ t('whitelistRequests.hint') }}</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{{ t('whitelist.userid') }}</th>
                  <th>{{ t('whitelist.label') }}</th>
                  <th>{{ t('whitelistRequests.message') }}</th>
                  <th>{{ t('whitelist.date') }}</th>
                  <th class="th-actions">{{ t('whitelist.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="requestsLoading"><td colspan="5" class="empty">{{ t('whitelist.loading') }}</td></tr>
                <tr v-else-if="!requests.length"><td colspan="5" class="empty">{{ t('whitelistRequests.empty') }}</td></tr>
                <tr v-for="r in requests" :key="r.id" v-else>
                  <td class="mono">{{ r.player_userid }}</td>
                  <td>{{ r.player_name || '—' }}</td>
                  <td>{{ r.message || '—' }}</td>
                  <td class="mono">{{ r.created_at }}</td>
                  <td class="actions">
                    <button class="btn btn-sm" @click="onApprove(r)">{{ t('whitelistRequests.approve') }}</button>
                    <button class="btn btn-sm btn-danger" @click="onReject(r)">{{ t('whitelistRequests.reject') }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <h2>{{ t('whitelist.title') }}</h2>
            <label style="cursor: pointer; display: flex; align-items: center; gap: 6px;">
              <input type="checkbox" :checked="enabled" :disabled="!hasRole('admin')" @change="onToggleEnabled">
              {{ enabled ? t('whitelist.enforcementOn') : t('whitelist.enforcementOff') }}
            </label>
          </div>
          <div class="card-hint" style="margin-bottom: 16px;">{{ t('whitelist.hint') }}</div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{{ t('whitelist.userid') }}</th>
                  <th>{{ t('whitelist.label') }}</th>
                  <th>{{ t('whitelist.addedBy') }}</th>
                  <th>{{ t('whitelist.date') }}</th>
                  <th v-if="hasRole('admin', 'moderator')" class="th-actions">{{ t('whitelist.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading"><td colspan="5" class="empty">{{ t('whitelist.loading') }}</td></tr>
                <tr v-else-if="errorMessage"><td colspan="5" class="empty">{{ errorMessage }}</td></tr>
                <tr v-else-if="!entries.length"><td colspan="5" class="empty">{{ t('whitelist.empty') }}</td></tr>
                <tr v-for="e in entries" :key="e.id" v-else>
                  <td class="mono">{{ e.player_userid }}</td>
                  <td>{{ e.label || '—' }}</td>
                  <td>{{ e.added_by_username || '—' }}</td>
                  <td class="mono">{{ e.created_at }}</td>
                  <td v-if="hasRole('admin', 'moderator')" class="actions">
                    <button class="btn btn-sm btn-danger" @click="onRemove(e)">{{ t('whitelist.remove') }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div v-if="hasRole('admin', 'moderator')" class="col-side">
        <div class="card">
          <div class="card-head"><h2>{{ t('whitelistRequests.linkTitle') }}</h2></div>
          <div class="card-hint" style="margin-bottom: 12px;">{{ t('whitelistRequests.linkHint') }}</div>
          <div class="inline-form" style="flex-direction: column; align-items: stretch;">
            <input :value="publicJoinUrl" type="text" readonly @click="$event.target.select()">
            <button type="button" class="btn" @click="copyLink">{{ t('whitelistRequests.copyLink') }}</button>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h2>{{ t('whitelist.addTitle') }}</h2></div>
          <form class="inline-form" style="flex-direction: column; align-items: stretch;" @submit.prevent="onAdd">
            <input v-model="form.userid" type="text" :placeholder="t('whitelist.useridPlaceholder')" required>
            <input v-model="form.label" type="text" :placeholder="t('whitelist.labelPlaceholder')">
            <button type="submit" class="btn btn-primary">{{ t('whitelist.add') }}</button>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
