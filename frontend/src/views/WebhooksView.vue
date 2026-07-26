<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'
import { toast } from '../composables/useToast'
import { confirmDialog } from '../composables/useConfirm'
import { servers, loadServers } from '../composables/useServers'

const { t, te } = useI18n()

const EVENTS = [
  { key: 'ban_issued', labelKey: 'webhooks.eventBanIssued' },
  { key: 'server_up', labelKey: 'webhooks.eventServerUp' },
  { key: 'server_down', labelKey: 'webhooks.eventServerDown' },
  { key: 'restart_imminent', labelKey: 'webhooks.eventRestartImminent' },
]

const webhooks = ref([])
const loading = ref(true)

function emptyForm() {
  return { serverId: '', url: '', label: '', events: [] }
}
const form = ref(emptyForm())

async function load() {
  loading.value = true
  try { webhooks.value = await api('/api/webhooks') }
  finally { loading.value = false }
}
onMounted(() => { load(); if (!servers.value.length) loadServers() })

function serverName(id) {
  if (!id) return t('webhooks.allServers')
  return servers.value.find((s) => s.id === id)?.name || `#${id}`
}

function statusText(w) {
  const key = `errors.${w.last_status}`
  const status = w.last_status ? (te(key) ? t(key) : w.last_status) : '–'
  return `${status} (${w.enabled ? t('webhooks.enabledSuffix') : t('webhooks.disabledSuffix')})`
}

async function onCreate() {
  if (!form.value.url || !form.value.events.length) return toast(t('webhooks.createError'), true)
  try {
    await api('/api/webhooks', {
      method: 'POST',
      body: JSON.stringify({ ...form.value, serverId: form.value.serverId || null }),
    })
    toast(t('webhooks.created'))
    form.value = emptyForm()
    await load()
  } catch (err) { toast(err.message, true) }
}

async function onToggle(w) {
  try {
    await api(`/api/webhooks/${w.id}`, { method: 'PUT', body: JSON.stringify({ enabled: !w.enabled }) })
    await load()
  } catch (err) { toast(err.message, true) }
}

async function onDelete(w) {
  if (!(await confirmDialog(t('confirm.title'), t('webhooks.confirmDelete', { label: w.label || w.url })))) return
  try {
    await api(`/api/webhooks/${w.id}`, { method: 'DELETE' })
    toast(t('webhooks.deleted'))
    await load()
  } catch (err) { toast(err.message, true) }
}

async function onTest(w) {
  try {
    await api(`/api/webhooks/${w.id}/test`, { method: 'POST' })
    toast(t('webhooks.tested'))
    await load()
  } catch (err) { toast(err.message, true) }
}
</script>

<template>
  <main>
    <section class="tab-panel active">
      <div class="grid">
        <div class="col-main">
          <div class="card">
            <div class="card-head"><h2>{{ t('webhooks.title') }}</h2></div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>{{ t('webhooks.labelUrl') }}</th><th>{{ t('webhooks.scope') }}</th><th>{{ t('webhooks.events') }}</th><th>{{ t('webhooks.lastStatus') }}</th><th class="th-actions">{{ t('webhooks.actions') }}</th></tr></thead>
                <tbody>
                  <tr v-if="loading"><td colspan="5" class="empty">{{ t('webhooks.loading') }}</td></tr>
                  <tr v-else-if="!webhooks.length"><td colspan="5" class="empty">{{ t('webhooks.empty') }}</td></tr>
                  <tr v-for="w in webhooks" :key="w.id" v-else>
                    <td class="mono">{{ w.label || w.url }}</td>
                    <td>{{ serverName(w.server_id) }}</td>
                    <td class="mono">{{ JSON.parse(w.events).join(', ') }}</td>
                    <td class="mono">{{ statusText(w) }}</td>
                    <td class="actions">
                      <button class="btn btn-sm" @click="onTest(w)">{{ t('webhooks.test') }}</button>
                      <button class="btn btn-sm" @click="onToggle(w)">{{ w.enabled ? t('webhooks.disable') : t('webhooks.enable') }}</button>
                      <button class="btn btn-sm btn-danger" @click="onDelete(w)">{{ t('webhooks.delete') }}</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-side">
          <div class="card">
            <div class="card-head"><h2>{{ t('webhooks.addTitle') }}</h2></div>
            <form class="inline-form" style="flex-direction: column; align-items: stretch;" @submit.prevent="onCreate">
              <select v-model="form.serverId">
                <option value="">{{ t('webhooks.allServers') }}</option>
                <option v-for="s in servers" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
              <input v-model="form.label" type="text" :placeholder="t('webhooks.labelPlaceholder')">
              <input v-model="form.url" type="text" :placeholder="t('webhooks.urlPlaceholder')" required>
              <div class="btn-row" style="flex-wrap: wrap;">
                <label v-for="e in EVENTS" :key="e.key" class="btn" style="cursor:pointer;">
                  <input type="checkbox" :value="e.key" v-model="form.events"> {{ t(e.labelKey) }}
                </label>
              </div>
              <button type="submit" class="btn btn-primary">{{ t('webhooks.create') }}</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
