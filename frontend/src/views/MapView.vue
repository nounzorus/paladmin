<script setup>
import { inject, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const dashboard = inject('dashboardData')

// Palpagos Islands landscape bounds (Unreal world-space), used only to place player
// dots on a generated coordinate grid — no map artwork from the game is used or shipped.
const WORLD_MIN_X = -999940
const WORLD_MAX_X = 447900
const WORLD_MIN_Y = -738920
const WORLD_MAX_Y = 708920

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
      <div class="card-hint" style="margin-bottom: 16px;">{{ t('map.hint') }}</div>

      <div v-if="!dashboard.playersLoaded.value" class="empty">{{ t('players.loading') }}</div>
      <div v-else-if="dashboard.playersError.value" class="empty">{{ dashboard.playersError.value }}</div>
      <template v-else>
        <div class="map-plot">
          <div class="map-grid"></div>
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
