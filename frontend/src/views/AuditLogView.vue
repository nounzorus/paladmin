<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'

const { t } = useI18n()
const rows = ref([])
const total = ref(0)
const limit = 50
const offset = ref(0)
const actionFilter = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset.value) })
  if (actionFilter.value) params.set('action', actionFilter.value)
  try {
    const data = await api(`/api/audit-log?${params.toString()}`)
    rows.value = data.rows
    total.value = data.total
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(actionFilter, () => { offset.value = 0; load() })
watch(offset, load)

function next() { if (offset.value + limit < total.value) offset.value += limit }
function prev() { offset.value = Math.max(0, offset.value - limit) }

function detailText(row) {
  if (!row.detail) return ''
  try { return JSON.stringify(JSON.parse(row.detail)) } catch { return row.detail }
}
</script>

<template>
  <main>
    <section class="tab-panel active">
      <div class="card">
        <div class="card-head">
          <h2>{{ t('auditLog.title') }}</h2>
          <select v-model="actionFilter" style="width: auto;">
            <option value="">{{ t('auditLog.allActions') }}</option>
            <option value="kick">kick</option>
            <option value="ban">ban</option>
            <option value="unban">unban</option>
            <option value="announce">announce</option>
            <option value="save">save</option>
            <option value="shutdown">shutdown</option>
            <option value="stop">stop</option>
            <option value="rcon">rcon</option>
            <option value="user.create">user.create</option>
            <option value="user.update">user.update</option>
            <option value="user.delete">user.delete</option>
            <option value="server.create">server.create</option>
            <option value="server.update">server.update</option>
            <option value="server.delete">server.delete</option>
          </select>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>{{ t('auditLog.date') }}</th><th>{{ t('auditLog.user') }}</th><th>{{ t('auditLog.server') }}</th><th>{{ t('auditLog.action') }}</th><th>{{ t('auditLog.target') }}</th><th>{{ t('auditLog.detail') }}</th></tr></thead>
            <tbody>
              <tr v-if="loading"><td colspan="6" class="empty">{{ t('auditLog.loading') }}</td></tr>
              <tr v-else-if="!rows.length"><td colspan="6" class="empty">{{ t('auditLog.empty') }}</td></tr>
              <tr v-for="r in rows" :key="r.id" v-else>
                <td class="mono">{{ r.created_at }}</td>
                <td>{{ r.username }}</td>
                <td>{{ r.server_name || '–' }}</td>
                <td class="mono">{{ r.action }}</td>
                <td class="mono">{{ r.target || '–' }}</td>
                <td class="mono">{{ detailText(r) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="btn-row" style="margin-top: 12px; justify-content: space-between;">
          <span class="card-hint">{{ t('auditLog.entries', { count: total }) }}</span>
          <div class="btn-row">
            <button class="btn btn-sm" :disabled="offset === 0" @click="prev">{{ t('auditLog.previous') }}</button>
            <button class="btn btn-sm" :disabled="offset + limit >= total" @click="next">{{ t('auditLog.next') }}</button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
