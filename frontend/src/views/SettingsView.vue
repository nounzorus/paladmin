<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'

const { t } = useI18n()
const loading = ref(true)
const errorMessage = ref('')
const entries = ref([])
const route = useRoute()

onMounted(async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const s = await api(`/api/servers/${route.params.serverId}/settings`)
    entries.value = Object.entries(s)
  } catch (e) {
    errorMessage.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section id="tab-settings" class="tab-panel active">
    <div class="card">
      <div class="card-head">
        <h2>{{ t('settings.title') }}</h2>
        <span class="card-hint">{{ t('settings.hint') }}</span>
      </div>
      <div class="table-wrap">
        <table id="settings-table">
          <thead><tr><th>{{ t('settings.key') }}</th><th>{{ t('settings.value') }}</th></tr></thead>
          <tbody id="settings-body">
            <tr v-if="loading"><td colspan="2" class="empty">{{ t('settings.loading') }}</td></tr>
            <tr v-else-if="errorMessage"><td colspan="2" class="empty">{{ errorMessage }}</td></tr>
            <tr v-else-if="!entries.length"><td colspan="2" class="empty">{{ t('settings.empty') }}</td></tr>
            <template v-else>
              <tr v-for="[k, v] in entries" :key="k">
                <td class="mono">{{ k }}</td>
                <td>{{ v }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
