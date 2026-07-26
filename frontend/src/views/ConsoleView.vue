<script setup>
import { ref, inject, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'

const { t } = useI18n()
const route = useRoute()
const serverInfo = inject('serverInfo')

const command = ref('')
const output = ref(t('console.welcome'))
const outputEl = ref(null)

async function onSubmit() {
  const cmd = command.value.trim()
  if (!cmd) return
  output.value += `\n> ${cmd}\n`
  command.value = ''
  try {
    const data = await api(`/api/servers/${route.params.serverId}/rcon`, { method: 'POST', body: JSON.stringify({ command: cmd }) })
    output.value += data.output + '\n'
  } catch (err) {
    output.value += t('console.errorPrefix') + ' ' + err.message + '\n'
  }
  await nextTick()
  if (outputEl.value) outputEl.value.scrollTop = outputEl.value.scrollHeight
}
</script>

<template>
  <section id="tab-console" class="tab-panel active">
    <div class="card">
      <div class="card-head">
        <h2>{{ t('console.title') }}</h2>
        <span class="card-hint">{{ t('console.hint') }}</span>
      </div>
      <div id="rcon-disabled" class="notice" :hidden="serverInfo?.rcon_enabled">
        {{ t('console.disabled') }}
      </div>
      <pre id="rcon-output" class="rcon-output" ref="outputEl">{{ output }}</pre>
      <form id="rcon-form" class="inline-form" @submit.prevent="onSubmit">
        <span class="rcon-prompt">&gt;</span>
        <input id="rcon-input" v-model="command" type="text" :placeholder="t('console.placeholder')" autocomplete="off" :disabled="!serverInfo?.rcon_enabled">
        <button type="submit" class="btn btn-primary">{{ t('console.submit') }}</button>
      </form>
    </div>
  </section>
</template>
