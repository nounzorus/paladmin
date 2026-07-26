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

// ---------- Live settings (read-only, from the REST API) ----------
const loading = ref(true)
const errorMessage = ref('')
const entries = ref([])

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
onMounted(loadLive)

// ---------- Config generator ----------
// Admin-only: generates PalWorldSettings.ini text to copy onto the server's own disk.
// The panel has no filesystem access and the REST API doesn't support config writes, so
// this never touches the real server; it's purely a text generator. Settings not in our
// catalog (unknownRaw) are carried through unchanged so a paste-then-regenerate cycle
// never silently drops a setting we don't know about.
const form = reactive(defaultFormValues(SETTINGS))
let unknownRaw = {}
const unknownCount = ref(0)
const pasteText = ref('')
const searchQuery = ref('')
const expanded = reactive(Object.fromEntries(CATEGORIES.map((c, i) => [c.id, i === 0])))

async function loadFromLive() {
  const s = await loadLive()
  if (!s) { toast(errorMessage.value, true); return }
  const result = apiValuesToForm(s, SETTINGS)
  Object.assign(form, result.formValues)
  unknownRaw = result.unknownRaw
  unknownCount.value = Object.keys(unknownRaw).length
  toast(t('settings.loadedFromLive'))
}

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
        <h2>{{ t('settings.title') }}</h2>
        <span class="card-hint">{{ t('settings.hint') }}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>{{ t('settings.key') }}</th><th>{{ t('settings.value') }}</th></tr></thead>
          <tbody>
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

    <div v-if="hasRole('admin')" class="card" style="margin-top: 20px;">
      <div class="card-head">
        <h2>{{ t('settings.generatorTitle') }}</h2>
        <span class="card-hint">{{ t('settings.generatorCount', { count: SETTINGS.length, categories: CATEGORIES.length }) }}</span>
      </div>
      <p class="fine">{{ t('settings.generatorHint') }}</p>

      <div class="btn-row" style="flex-wrap: wrap; margin-bottom: 16px;">
        <button type="button" class="btn" @click="loadFromLive">{{ t('settings.loadFromLive') }}</button>
        <button type="button" class="btn btn-danger" @click="resetDefaults">{{ t('settings.resetDefaults') }}</button>
      </div>

      <details class="config-paste">
        <summary>{{ t('settings.pasteSummary') }}</summary>
        <textarea v-model="pasteText" rows="4" :placeholder="t('settings.pastePlaceholder')"></textarea>
        <button type="button" class="btn" @click="parsePasted">{{ t('settings.parseButton') }}</button>
      </details>

      <input
        v-model="searchQuery"
        type="text"
        class="config-search"
        :placeholder="t('settings.searchPlaceholder')"
      >

      <div class="config-categories">
        <div v-for="cat in filteredCategories" :key="cat.id" class="config-category">
          <button type="button" class="config-category-head" @click="toggleCategory(cat.id)">
            <span>{{ cat.label }}</span>
            <span class="config-category-count">{{ cat.settings.length }}</span>
          </button>
          <div v-show="expanded[cat.id] || searchQuery.trim()" class="config-category-body">
            <div v-for="s in cat.settings" :key="s.id" class="config-field">
              <label :for="'cfg-' + s.id">
                {{ s.label }}
                <span class="config-key mono">{{ s.id }}</span>
                <span v-if="s.desc" class="config-help" :title="s.desc">?</span>
              </label>
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
            </div>
          </div>
        </div>
      </div>

      <div class="config-output">
        <div class="card-head">
          <h3>{{ t('settings.outputTitle') }}</h3>
          <button type="button" class="btn btn-sm" @click="copyOutput">{{ t('settings.copyOutput') }}</button>
        </div>
        <p v-if="unknownCount" class="card-hint">{{ t('settings.unknownPreserved', { count: unknownCount }) }}</p>
        <textarea readonly rows="6" class="config-output-text">{{ output }}</textarea>
      </div>
    </div>
  </section>
</template>
