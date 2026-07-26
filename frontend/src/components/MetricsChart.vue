<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const props = defineProps({
  points: { type: Array, default: () => [] }, // [{ t: 'YYYY-MM-DD HH:MM:SS', v: number|null }]
  label: { type: String, default: '' },
})

const width = 600
const height = 180
const pad = 28

const clean = computed(() => props.points.filter((p) => p.v != null))

const path = computed(() => {
  const pts = clean.value
  if (pts.length < 2) return ''
  const times = pts.map((p) => new Date(p.t.replace(' ', 'T')).getTime())
  const values = pts.map((p) => p.v)
  const minT = Math.min(...times), maxT = Math.max(...times)
  const minV = Math.min(...values), maxV = Math.max(...values)
  const spanT = maxT - minT || 1
  const spanV = maxV - minV || 1
  const x = (t) => pad + ((t - minT) / spanT) * (width - pad * 2)
  const y = (v) => height - pad - ((v - minV) / spanV) * (height - pad * 2)
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(times[i]).toFixed(1)} ${y(values[i]).toFixed(1)}`).join(' ')
})

const yMax = computed(() => clean.value.length ? Math.max(...clean.value.map((p) => p.v)) : null)
const yMin = computed(() => clean.value.length ? Math.min(...clean.value.map((p) => p.v)) : null)
</script>

<template>
  <div class="metrics-chart">
    <p v-if="clean.length < 2" class="empty">{{ t('metricsHistory.notEnoughData') }}</p>
    <svg v-else :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none" class="metrics-chart-svg">
      <line :x1="pad" :y1="height - pad" :x2="width - pad" :y2="height - pad" class="metrics-chart-axis" />
      <path :d="path" class="metrics-chart-line" fill="none" />
      <text :x="pad" y="16" class="metrics-chart-label">{{ t('metricsHistory.maxMin', { label, max: yMax, min: yMin }) }}</text>
    </svg>
  </div>
</template>
