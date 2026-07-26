<script setup>
import { inject, computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const dashboard = inject('dashboardData')

// Palpagos Islands landscape bounds (Unreal world-space), used to place player dots
// as a percentage position — no map artwork from the game is shipped with the project.
// If the machine running this instance has a local frontend/public/map-background.webp
// (gitignored, never committed/redistributed — see .gitignore and CLAUDE.md), it's used
// as the plot background instead of the generated grid. Bring your own image, own the
// rights to it; this repo does not ship or fetch one.
const WORLD_MIN_X = -999940
const WORLD_MAX_X = 447900
const WORLD_MIN_Y = -738920
const WORLD_MAX_Y = 708920

const customBackground = ref(false)
onMounted(() => {
  const probe = new Image()
  probe.onload = () => { customBackground.value = true }
  probe.src = '/map-background.webp'
})

function uidOf(p) {
  return p.userId || p.userid || p.playerId || ''
}

function hasPosition(p) {
  return typeof p.location_x === 'number' && typeof p.location_y === 'number'
}

function posOf(p) {
  const nx = (p.location_x - WORLD_MIN_X) / (WORLD_MAX_X - WORLD_MIN_X)
  const ny = (p.location_y - WORLD_MIN_Y) / (WORLD_MAX_Y - WORLD_MIN_Y)
  return {
    left: Math.min(100, Math.max(0, nx * 100)) + '%',
    top: Math.min(100, Math.max(0, (1 - ny) * 100)) + '%',
  }
}

const positioned = computed(() => (dashboard.players.value || []).filter(hasPosition))
const unpositioned = computed(() => (dashboard.players.value || []).filter((p) => !hasPosition(p)))
</script>

<template>
  <section class="tab-panel active">
    <div class="card">
      <div class="card-head">
        <h2>{{ t('map.title') }}</h2>
        <span class="card-hint">{{ dashboard.playersRefreshedLabel.value }}</span>
      </div>
      <div class="card-hint" style="margin-bottom: 16px;">{{ customBackground ? t('map.hintCustom') : t('map.hint') }}</div>

      <div v-if="!dashboard.playersLoaded.value" class="empty">{{ t('players.loading') }}</div>
      <div v-else-if="dashboard.playersError.value" class="empty">{{ dashboard.playersError.value }}</div>
      <template v-else>
        <div class="map-plot" :class="{ 'has-custom-bg': customBackground }">
          <div v-if="!customBackground" class="map-grid"></div>
          <div v-if="!positioned.length" class="empty map-empty">{{ t('map.noPositions') }}</div>
          <div
            v-for="p in positioned"
            :key="uidOf(p)"
            class="map-dot"
            :style="posOf(p)"
          >
            <span class="map-dot-ping"></span>
            <span class="map-dot-label">{{ p.name }}</span>
          </div>
        </div>
        <p v-if="unpositioned.length" class="card-hint" style="margin-top: 12px;">
          {{ t('map.unpositioned', { count: unpositioned.length }) }}
        </p>
      </template>
    </div>
  </section>
</template>
