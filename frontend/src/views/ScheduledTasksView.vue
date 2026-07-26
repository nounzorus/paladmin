<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'
import { toast } from '../composables/useToast'
import { confirmDialog } from '../composables/useConfirm'

const { t } = useI18n()
const route = useRoute()
const tasks = ref([])
const loading = ref(true)

function emptyForm() {
  // restartMessage left empty on purpose — the backend falls back to its own
  // default ("Server restarting in {minutes} minutes.") when none is provided.
  return { type: 'auto_save', cronExpression: '0 4 * * *', restartWarnings: '', restartMessage: '' }
}
const form = ref(emptyForm())

async function load() {
  loading.value = true
  try { tasks.value = await api(`/api/servers/${route.params.serverId}/scheduled-tasks`) }
  finally { loading.value = false }
}
onMounted(load)

async function onCreate() {
  const body = {
    type: form.value.type,
    cronExpression: form.value.cronExpression,
  }
  if (form.value.type === 'restart') {
    body.restartWarnings = form.value.restartWarnings
      ? form.value.restartWarnings.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n))
      : []
    body.restartMessage = form.value.restartMessage
  }
  try {
    await api(`/api/servers/${route.params.serverId}/scheduled-tasks`, { method: 'POST', body: JSON.stringify(body) })
    toast(t('scheduledTasks.created'))
    form.value = emptyForm()
    await load()
  } catch (err) {
    toast(err.message, true)
  }
}

async function onToggle(task) {
  try {
    await api(`/api/servers/${route.params.serverId}/scheduled-tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ enabled: !task.enabled }) })
    await load()
  } catch (err) { toast(err.message, true) }
}

async function onDelete(task) {
  if (!(await confirmDialog(t('confirm.title'), t('scheduledTasks.confirmDelete')))) return
  try {
    await api(`/api/servers/${route.params.serverId}/scheduled-tasks/${task.id}`, { method: 'DELETE' })
    toast(t('scheduledTasks.deleted'))
    await load()
  } catch (err) { toast(err.message, true) }
}
</script>

<template>
  <section class="tab-panel active">
    <div class="grid">
      <div class="col-main">
        <div class="card">
          <div class="card-head"><h2>{{ t('scheduledTasks.title') }}</h2></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>{{ t('scheduledTasks.type') }}</th><th>{{ t('scheduledTasks.cron') }}</th><th>{{ t('scheduledTasks.warnings') }}</th><th>{{ t('scheduledTasks.lastRun') }}</th><th>{{ t('scheduledTasks.status') }}</th><th class="th-actions">{{ t('scheduledTasks.actions') }}</th></tr></thead>
              <tbody>
                <tr v-if="loading"><td colspan="6" class="empty">{{ t('scheduledTasks.loading') }}</td></tr>
                <tr v-else-if="!tasks.length"><td colspan="6" class="empty">{{ t('scheduledTasks.empty') }}</td></tr>
                <tr v-for="task in tasks" :key="task.id" v-else>
                  <td>{{ task.type === 'auto_save' ? t('scheduledTasks.typeAutoSave') : t('scheduledTasks.typeRestart') }}</td>
                  <td class="mono">{{ task.cron_expression }}</td>
                  <td class="mono">{{ task.restart_warnings ? JSON.parse(task.restart_warnings).join(', ') + ' ' + t('scheduledTasks.minutesSuffix') : '–' }}</td>
                  <td class="mono">{{ task.last_run_at || '–' }}</td>
                  <td>{{ task.enabled ? t('scheduledTasks.enabledStatus') : t('scheduledTasks.disabledStatus') }}</td>
                  <td class="actions">
                    <button class="btn btn-sm" @click="onToggle(task)">{{ task.enabled ? t('scheduledTasks.disable') : t('scheduledTasks.enable') }}</button>
                    <button class="btn btn-sm btn-danger" @click="onDelete(task)">{{ t('scheduledTasks.delete') }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="col-side">
        <div class="card">
          <div class="card-head"><h2>{{ t('scheduledTasks.newTitle') }}</h2></div>
          <form class="inline-form" style="flex-direction: column; align-items: stretch;" @submit.prevent="onCreate">
            <select v-model="form.type">
              <option value="auto_save">{{ t('scheduledTasks.typeAutoSaveOption') }}</option>
              <option value="restart">{{ t('scheduledTasks.typeRestartOption') }}</option>
            </select>
            <input v-model="form.cronExpression" type="text" :placeholder="t('scheduledTasks.cronPlaceholder')" required>
            <template v-if="form.type === 'restart'">
              <input v-model="form.restartWarnings" type="text" :placeholder="t('scheduledTasks.warningsPlaceholder')">
              <input v-model="form.restartMessage" type="text" :placeholder="t('scheduledTasks.warningMessagePlaceholder')">
            </template>
            <button type="submit" class="btn btn-primary">{{ t('scheduledTasks.create') }}</button>
            <p class="fine">{{ t('scheduledTasks.hint') }}</p>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
