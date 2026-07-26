<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'
import { toast } from '../composables/useToast'
import { hasRole } from '../composables/useRole'
import { CATEGORIES, SETTINGS } from '../consts/palSettings'
import {
  parseOptionSettings,
  splitKnownUnknown,
  serializeOptionSettings,
  apiValuesToForm,
  defaultFormValues,
} from '../lib/palIni'

const { t } = useI18n()
const route = useRoute()

// One categorized view for everyone (matches the RBAC "view settings" tier: admin,
// moderator, and viewer can all see current settings). Admins additionally get an
// editable draft + generator; viewer/moderator just get the same values read-only,
// which is a strict upgrade over a flat key/value table (named, described, categorized).
const loading = ref(true)
const errorMessage = ref('')
const entries = ref([])
const liveMap = computed(() => Object.fromEntries(entries.value))
const otherEntries = computed(() => entries.value.filter(([k]) => !SETTINGS.some((s) => s.id === k)))

async function loadLive() {
  loading.value = true
  errorMessage.value = ''
  try {
    const s = await api(`/api/servers/${route.params.serverId}/settings`)
    entries.value = Object.entries(s)
    return s
  } catch (e) {
    errorMessage.value = e.message
    return null
  } finally {
    loading.value = false
  }
}

// ---------- Config generator (admin only) ----------
// Generates PalWorldSettings.ini text to copy onto the server's own disk. The panel has
// no filesystem access and the REST API doesn't support config writes, so this never
// touches the real server; it's purely a text generator. Settings not in our catalog
// (unknownRaw) are carried through unchanged so a paste-then-regenerate cycle never
// silently drops a setting we don't know about.
const form = reactive(defaultFormValues(SETTINGS))
let unknownRaw = {}
const unknownCount = ref(0)
const pasteText = ref('')
const searchQuery = ref('')
const expanded = reactive(Object.fromEntries(CATEGORIES.map((c, i) => [c.id, i === 0])))

async function loadFromLive(silent) {
  const s = await loadLive()
  if (!s) { if (!silent) toast(errorMessage.value, true); return }
  const result = apiValuesToForm(s, SETTINGS)
  Object.assign(form, result.formValues)
  unknownRaw = result.unknownRaw
  unknownCount.value = Object.keys(unknownRaw).length
  if (!silent) toast(t('settings.loadedFromLive'))
}

onMounted(() => { hasRole('admin') ? loadFromLive(true) : loadLive() })

function parsePasted() {
  if (!pasteText.value.trim()) { toast(t('settings.pasteEmpty'), true); return }
  try {
    const raw = parseOptionSettings(pasteText.value)
    if (!Object.keys(raw).length) throw new Error('empty')
    const result = splitKnownUnknown(raw, SETTINGS)
    Object.assign(form, result.formValues)
    unknownRaw = result.unknownRaw
    unknownCount.value = Object.keys(unknownRaw).length
    toast(t('settings.parsed', { count: Object.keys(raw).length }))
  } catch {
    toast(t('settings.parseError'), true)
  }
}

function resetDefaults() {
  Object.assign(form, defaultFormValues(SETTINGS))
  unknownRaw = {}
  unknownCount.value = 0
  toast(t('settings.wasReset'))
}

const output = computed(() => serializeOptionSettings(form, SETTINGS, unknownRaw))

async function copyOutput() {
  try {
    await navigator.clipboard.writeText(output.value)
    toast(t('settings.copied'))
  } catch {
    toast(output.value)
  }
}

const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return CATEGORIES.map((cat) => ({
    ...cat,
    settings: SETTINGS.filter((s) => s.category === cat.id && (
      !q || s.label.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.desc || '').toLowerCase().includes(q)
    )),
  })).filter((cat) => cat.settings.length > 0)
})

watch(searchQuery, (q) => {
  if (q.trim()) CATEGORIES.forEach((c) => { expanded[c.id] = true })
})

function toggleCategory(id) {
  expanded[id] = !expanded[id]
}
</script>

<template>
  <section class="tab-panel active">
    <div class="card">
      <div class="card-head">
        <h2>{{ hasRole('admin') ? t('settings.generatorTitle') : t('settings.title') }}</h2>
        <span class="card-hint">{{ t('settings.generatorCount', { count: SETTINGS.length, categories: CATEGORIES.length }) }}</span>
      </div>
      <p class="fine">{{ hasRole('admin') ? t('settings.generatorHint') : t('settings.hint') }}</p>
      <p v-if="errorMessage" class="fine" style="color: var(--danger);">{{ errorMessage }}</p>

      <template v-if="hasRole('admin')">
        <div class="btn-row" style="flex-wrap: wrap; margin: 16px 0;">
          <button type="button" class="btn" @click="loadFromLive()">{{ t('settings.loadFromLive') }}</button>
          <button type="button" class="btn btn-danger" @click="resetDefaults">{{ t('settings.resetDefaults') }}</button>
        </div>

        <details class="config-paste">
          <summary>{{ t('settings.pasteSummary') }}</summary>
          <textarea v-model="pasteText" rows="4" :placeholder="t('settings.pastePlaceholder')"></textarea>
          <button type="button" class="btn" @click="parsePasted">{{ t('settings.parseButton') }}</button>
        </details>
      </template>

      <input
        v-model="searchQuery"
        type="text"
        class="config-search"
        style="margin-top: 16px;"
        :placeholder="t('settings.searchPlaceholder')"
      >

      <div v-if="loading" class="empty">{{ t('settings.loading') }}</div>
      <template v-else>
        <div class="config-categories">
          <div v-for="cat in filteredCategories" :key="cat.id" class="config-category">
            <button type="button" class="config-category-head" @click="toggleCategory(cat.id)">
              <span>{{ cat.label }}</span>
              <span class="config-category-count">{{ cat.settings.length }}</span>
            </button>
            <div v-show="expanded[cat.id] || searchQuery.trim()" class="config-category-body">
              <div v-for="s in cat.settings" :key="s.id" class="config-field">
                <label :for="'cfg-' + s.id" class="config-field-label">
                  <span class="config-field-name">{{ s.label }}</span>
                  <span v-if="s.desc" class="config-field-desc">{{ s.desc }}</span>
                  <span class="config-key mono">{{ s.id }}</span>
                </label>
                <template v-if="hasRole('admin')">
                  <input v-if="s.type === 'boolean'" :id="'cfg-' + s.id" type="checkbox" v-model="form[s.id]">
                  <input
                    v-else-if="s.type === 'integer'"
                    :id="'cfg-' + s.id"
                    type="number"
                    step="1"
                    :min="s.range?.[0]"
                    :max="s.range?.[1]"
                    v-model.number="form[s.id]"
                  >
                  <input
                    v-else-if="s.type === 'float'"
                    :id="'cfg-' + s.id"
                    type="number"
                    step="0.1"
                    :min="s.range?.[0]"
                    :max="s.range?.[1]"
                    v-model.number="form[s.id]"
                  >
                  <select v-else-if="s.type === 'select'" :id="'cfg-' + s.id" v-model="form[s.id]">
                    <option v-for="o in s.options" :key="o" :value="o">{{ o }}</option>
                  </select>
                  <input
                    v-else
                    :id="'cfg-' + s.id"
                    type="text"
                    v-model="form[s.id]"
                    :placeholder="s.type === 'array' ? t('settings.arrayPlaceholder') : ''"
                  >
                </template>
                <span v-else class="config-value mono">{{ liveMap[s.id] ?? '—' }}</span>
              </div>
            </div>
          </div>

          <div v-if="otherEntries.length" class="config-category">
            <button type="button" class="config-category-head" @click="toggleCategory('other')">
              <span>{{ t('settings.otherCategory') }}</span>
              <span class="config-category-count">{{ otherEntries.length }}</span>
            </button>
            <div v-show="expanded.other" class="config-category-body">
              <div v-for="[k, v] in otherEntries" :key="k" class="config-field">
                <label class="config-field-label">
                  <span class="config-key mono">{{ k }}</span>
                </label>
                <span class="config-value mono">{{ v }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="hasRole('admin')" class="config-output">
          <div class="card-head">
            <h3>{{ t('settings.outputTitle') }}</h3>
            <button type="button" class="btn btn-sm" @click="copyOutput">{{ t('settings.copyOutput') }}</button>
          </div>
          <p v-if="unknownCount" class="card-hint">{{ t('settings.unknownPreserved', { count: unknownCount }) }}</p>
          <textarea readonly rows="6" class="config-output-text">{{ output }}</textarea>
        </div>
      </template>
    </div>
  </section>
</template>
