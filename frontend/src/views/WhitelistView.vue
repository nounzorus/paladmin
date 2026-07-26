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
const entries = ref([])
const enabled = ref(false)
const loading = ref(true)
const errorMessage = ref('')

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
onMounted(load)

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
</script>

<template>
  <section class="tab-panel active">
    <div class="grid">
      <div class="col-main">
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
