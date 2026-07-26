<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'
import { toast } from '../composables/useToast'
import { confirmDialog } from '../composables/useConfirm'

const { t } = useI18n()
const shutdownDelay = ref(60)
const shutdownMsg = ref('')
const route = useRoute()

async function onSave() {
  try {
    await api(`/api/servers/${route.params.serverId}/save`, { method: 'POST' })
    toast(t('serverActions.saved'))
  } catch (err) {
    toast(err.message, true)
  }
}

async function onShutdown() {
  const waittime = parseInt(shutdownDelay.value, 10) || 60
  if (!(await confirmDialog(t('serverActions.confirmShutdownTitle'), t('serverActions.confirmShutdown', { seconds: waittime })))) return
  try {
    await api(`/api/servers/${route.params.serverId}/shutdown`, {
      method: 'POST',
      body: JSON.stringify({ waittime, message: shutdownMsg.value }),
    })
    toast(t('serverActions.shutdownScheduled', { seconds: waittime }))
  } catch (err) {
    toast(err.message, true)
  }
}

async function onStop() {
  if (!(await confirmDialog(t('serverActions.confirmStopTitle'), t('serverActions.confirmStop')))) return
  try {
    await api(`/api/servers/${route.params.serverId}/stop`, { method: 'POST' })
    toast(t('serverActions.stopped'))
  } catch (err) {
    toast(err.message, true)
  }
}
</script>

<template>
  <div class="card card-actions">
    <div class="card-head"><h2>{{ t('serverActions.title') }}</h2></div>
    <button id="btn-save" class="btn btn-block" @click="onSave">{{ t('serverActions.save') }}</button>
    <div class="shutdown-row">
      <input id="shutdown-delay" v-model="shutdownDelay" type="number" min="1" max="3600" :aria-label="t('serverActions.delaySeconds')">
      <span class="unit">s</span>
      <button id="btn-shutdown" class="btn btn-warn" @click="onShutdown">{{ t('serverActions.scheduledShutdown') }}</button>
    </div>
    <input id="shutdown-msg" v-model="shutdownMsg" type="text" maxlength="200" :placeholder="t('serverActions.shutdownMsgPlaceholder')">
    <button id="btn-stop" class="btn btn-danger btn-block" @click="onStop">{{ t('serverActions.immediateStop') }}</button>
    <p class="fine">{{ t('serverActions.fine') }}</p>
  </div>
</template>
