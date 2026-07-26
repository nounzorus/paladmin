<script setup>
import { inject, computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const dashboard = inject('dashboardData')

// TEMPORARY (debugging the coordinate transform): pause the shared 10s auto-refresh while
// this page is open, so a player's dot doesn't move mid-inspection, and offer a manual
// refresh button instead. Resumes normal polling on leaving the page. Revert once the
// map coordinates are confirmed correct, see MapView.vue's posOf() and the map-related
// entries in CLAUDE.md/project-paladmin memory for context.
//
// nextTick is required here: child onMounted fires before the parent's (ServerScopeLayout
// calls polling.start() in its own onMounted, which runs after this one), so calling
// polling.stop() synchronously here is a no-op against a timer that doesn't exist yet.
const polling = inject('polling')
onMounted(() => nextTick(() => polling?.stop()))
onUnmounted(() => polling?.start())

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

// Calibration reset: two attempts at fitting a correction on top of the landscape-bounds
// transform (per-axis linear, then a full 6-param affine with cross terms) both made
// positions worse against the reference map image, not better -- meaning the calibration
// data (hand-estimated percentages against a since-replaced image) wasn't trustworthy
// enough to fit against. Back to the plain landscape-bounds transform, no correction, to
// re-baseline against the current map-background image (see the probe below) before trying
// to calibrate again -- and if re-calibrating, prefer precise pixel measurements over
// eyeballed percentages, and points spread across the whole map rather than clustered.
const CALIBRATION = { leftA: 1, leftB: 0, leftC: 0, topA: 0, topB: 1, topC: 0 }

const customBackground = ref(false)
const backgroundUrl = ref('')
onMounted(() => {
  const candidates = ['/map-background.png', '/map-background.webp']
  function tryNext(i) {
    if (i >= candidates.length) return
    const probe = new Image()
    probe.onload = () => { customBackground.value = true; backgroundUrl.value = candidates[i] }
    probe.onerror = () => tryNext(i + 1)
    probe.src = candidates[i]
  }
  tryNext(0)
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
  const rawLeft = (1 - nx) * 100
  const rawTop = ny * 100
  const left = CALIBRATION.leftA * rawLeft + CALIBRATION.leftB * rawTop + CALIBRATION.leftC
  const top = CALIBRATION.topA * rawLeft + CALIBRATION.topB * rawTop + CALIBRATION.topC
  return {
    left: Math.min(100, Math.max(0, left)) + '%',
    top: Math.min(100, Math.max(0, top)) + '%',
  }
}

const positioned = computed(() => (dashboard.players.value || []).filter(hasPosition))
const unpositioned = computed(() => (dashboard.players.value || []).filter((p) => !hasPosition(p)))

// ---------- Zoom & pan ----------
// .map-plot is translated+scaled as one unit (background and dot positions move
// together, since left/top percentages resolve against the untransformed layout size).
// Each dot then counter-scales by 1/zoom so it stays a constant screen size instead of
// growing with the map, matching how markers behave on any normal map viewer.
const MIN_ZOOM = 1
const MAX_ZOOM = 6
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)
const viewport = ref(null)
const dragging = ref(false)

const plotStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value})`,
  ...(customBackground.value ? { backgroundImage: `url("${backgroundUrl.value}")` } : {}),
}))

function dotStyle(p) {
  const pos = posOf(p)
  return { ...pos, '--counter-scale': 1 / zoom.value }
}

function clampPan() {
  const el = viewport.value
  if (!el) return
  const w = el.clientWidth
  const h = el.clientHeight
  const minX = w - w * zoom.value
  const minY = h - h * zoom.value
  panX.value = Math.min(0, Math.max(minX, panX.value))
  panY.value = Math.min(0, Math.max(minY, panY.value))
}

function setZoomAt(nextZoom, cx, cy) {
  const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))
  const contentX = (cx - panX.value) / zoom.value
  const contentY = (cy - panY.value) / zoom.value
  panX.value = cx - z * contentX
  panY.value = cy - z * contentY
  zoom.value = z
  clampPan()
}

function onWheel(e) {
  e.preventDefault()
  const rect = viewport.value.getBoundingClientRect()
  const cx = e.clientX - rect.left
  const cy = e.clientY - rect.top
  const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2
  setZoomAt(zoom.value * factor, cx, cy)
}

function zoomStep(factor) {
  const el = viewport.value
  if (!el) return
  setZoomAt(zoom.value * factor, el.clientWidth / 2, el.clientHeight / 2)
}

function resetView() {
  zoom.value = MIN_ZOOM
  panX.value = 0
  panY.value = 0
}

let dragStart = null
function onPointerDown(e) {
  if (zoom.value <= MIN_ZOOM) return
  dragging.value = true
  dragStart = { x: e.clientX, y: e.clientY, panX: panX.value, panY: panY.value }
}
function onPointerMove(e) {
  if (!dragging.value || !dragStart) return
  panX.value = dragStart.panX + (e.clientX - dragStart.x)
  panY.value = dragStart.panY + (e.clientY - dragStart.y)
  clampPan()
}
function onPointerUp() {
  dragging.value = false
  dragStart = null
}

// Touch: one finger pans, two fingers pinch-zoom.
let pinchStart = null
function touchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.hypot(dx, dy)
}
function onTouchStart(e) {
  if (e.touches.length === 1) {
    dragging.value = true
    dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX: panX.value, panY: panY.value }
  } else if (e.touches.length === 2) {
    dragging.value = false
    const rect = viewport.value.getBoundingClientRect()
    pinchStart = {
      dist: touchDist(e.touches),
      zoom: zoom.value,
      cx: (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left,
      cy: (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top,
    }
  }
}
function onTouchMove(e) {
  e.preventDefault()
  if (e.touches.length === 1 && dragging.value && dragStart) {
    panX.value = dragStart.panX + (e.touches[0].clientX - dragStart.x)
    panY.value = dragStart.panY + (e.touches[0].clientY - dragStart.y)
    clampPan()
  } else if (e.touches.length === 2 && pinchStart) {
    const scale = touchDist(e.touches) / pinchStart.dist
    setZoomAt(pinchStart.zoom * scale, pinchStart.cx, pinchStart.cy)
  }
}
function onTouchEnd(e) {
  if (e.touches.length === 0) { dragging.value = false; dragStart = null; pinchStart = null }
}
</script>

<template>
  <section class="tab-panel active">
    <div class="card">
      <div class="card-head">
        <h2>{{ t('map.title') }}</h2>
        <span style="display: flex; align-items: center; gap: 10px;">
          <span class="card-hint">{{ dashboard.playersRefreshedLabel.value }}</span>
          <button type="button" class="btn btn-sm" @click="dashboard.refreshAll">{{ t('map.refresh') }}</button>
        </span>
      </div>
      <div class="card-hint" style="margin-bottom: 16px;">{{ customBackground ? t('map.hintCustom') : t('map.hint') }}</div>

      <div v-if="!dashboard.playersLoaded.value" class="empty">{{ t('players.loading') }}</div>
      <div v-else-if="dashboard.playersError.value" class="empty">{{ dashboard.playersError.value }}</div>
      <template v-else>
        <div
          ref="viewport"
          class="map-viewport"
          :class="{ dragging, zoomed: zoom > MIN_ZOOM }"
          @wheel="onWheel"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointerleave="onPointerUp"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <div class="map-plot" :class="{ 'has-custom-bg': customBackground }" :style="plotStyle">
            <div v-if="!customBackground" class="map-grid"></div>
            <div
              v-for="p in positioned"
              :key="uidOf(p)"
              class="map-dot"
              :style="dotStyle(p)"
            >
              <span class="map-dot-ping"></span>
              <span class="map-dot-label">{{ p.name }}</span>
            </div>
          </div>
          <div v-if="!positioned.length" class="empty map-empty">{{ t('map.noPositions') }}</div>

          <div class="map-zoom-controls">
            <button type="button" class="btn btn-sm" @click="zoomStep(1.4)">+</button>
            <button type="button" class="btn btn-sm" @click="zoomStep(1 / 1.4)">−</button>
            <button type="button" class="btn btn-sm" @click="resetView">{{ t('map.resetZoom') }}</button>
          </div>
        </div>
        <p v-if="unpositioned.length" class="card-hint" style="margin-top: 12px;">
          {{ t('map.unpositioned', { count: unpositioned.length }) }}
        </p>
      </template>
    </div>
  </section>
</template>
