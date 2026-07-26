<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'
import MetricsChart from '../components/MetricsChart.vue'

const { t } = useI18n()
const route = useRoute()
const hours = ref(24)
const rows = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    rows.value = await api(`/api/servers/${route.params.serverId}/metrics-history?hours=${hours.value}`)
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(hours, load)

function points(field) {
  return rows.value.map((r) => ({ t: r.captured_at, v: r[field] }))
}
</script>

<template>
  <section class="tab-panel active">
    <div class="card">
      <div class="card-head">
        <h2>{{ t('metricsHistory.title') }}</h2>
        <select v-model.number="hours" style="width: auto;">
          <option :value="6">{{ t('metricsHistory.range6h') }}</option>
          <option :value="24">{{ t('metricsHistory.range24h') }}</option>
          <option :value="168">{{ t('metricsHistory.range7d') }}</option>
          <option :value="720">{{ t('metricsHistory.range30d') }}</option>
        </select>
      </div>
      <div v-if="loading" class="empty">{{ t('metricsHistory.loading') }}</div>
      <template v-else-if="!rows.length">
        <p class="empty">{{ t('metricsHistory.empty') }}</p>
      </template>
      <template v-else>
        <h3 style="font-size: 13px; color: var(--muted); margin: 16px 0 4px;">{{ t('metricsHistory.playersChart') }}</h3>
        <MetricsChart :points="points('player_count')" :label="t('metricsHistory.playersLabel')" />
        <h3 style="font-size: 13px; color: var(--muted); margin: 16px 0 4px;">{{ t('metricsHistory.fpsChart') }}</h3>
        <MetricsChart :points="points('fps')" :label="t('metricsHistory.fpsLabel')" />
      </template>
    </div>
  </section>
</template>
