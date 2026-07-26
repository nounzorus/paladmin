<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'
import { toast } from '../composables/useToast'

const { t } = useI18n()
const message = ref('')
const route = useRoute()
const presets = ref([])
const selectedPreset = ref('')
const savingPreset = ref(false)
const presetLabel = ref('')

async function loadPresets() {
  try { presets.value = await api(`/api/servers/${route.params.serverId}/announce-presets`) } catch {}
}
onMounted(loadPresets)

function onPresetChange() {
  const preset = presets.value.find((p) => String(p.id) === selectedPreset.value)
  if (preset) message.value = preset.message
}

async function onSubmit() {
  try {
    await api(`/api/servers/${route.params.serverId}/announce`, { method: 'POST', body: JSON.stringify({ message: message.value }) })
    toast(t('announce.sent'))
    message.value = ''
    selectedPreset.value = ''
  } catch (err) {
    toast(err.message, true)
  }
}

async function onSavePreset() {
  const label = presetLabel.value.trim()
  if (!label || !message.value.trim()) return toast(t('announce.presetSaveError'), true)
  try {
    await api(`/api/servers/${route.params.serverId}/announce-presets`, {
      method: 'POST',
      body: JSON.stringify({ label, message: message.value }),
    })
    toast(t('announce.presetSaved'))
    presetLabel.value = ''
    savingPreset.value = false
    await loadPresets()
  } catch (err) {
    toast(err.message, true)
  }
}
</script>

<template>
  <div class="card">
    <div class="card-head"><h2>{{ t('announce.title') }}</h2></div>
    <form id="announce-form" class="inline-form" @submit.prevent="onSubmit">
      <select v-if="presets.length" v-model="selectedPreset" style="width: auto;" @change="onPresetChange">
        <option value="">{{ t('announce.presetDefault') }}</option>
        <option v-for="p in presets" :key="p.id" :value="String(p.id)">{{ p.label }}</option>
      </select>
      <input id="announce-msg" v-model="message" type="text" maxlength="500" :placeholder="t('announce.placeholder')" required>
      <button type="submit" class="btn btn-primary">{{ t('announce.submit') }}</button>
      <button type="button" class="btn btn-sm" @click="savingPreset = !savingPreset">{{ t('announce.savePreset') }}</button>
    </form>
    <form v-if="savingPreset" class="inline-form" style="margin-top: 10px;" @submit.prevent="onSavePreset">
      <input v-model="presetLabel" type="text" :placeholder="t('announce.presetLabelPlaceholder')" maxlength="100">
      <button type="submit" class="btn btn-sm btn-primary">{{ t('announce.save') }}</button>
    </form>
  </div>
</template>
