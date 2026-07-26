<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'
import { toast } from '../composables/useToast'
import { hasRole } from '../composables/useRole'

const { t } = useI18n()
const props = defineProps({ userid: String })
defineEmits(['close'])

const route = useRoute()
const notes = ref([])
const loading = ref(true)
const newNote = ref('')

function base() {
  return `/api/servers/${route.params.serverId}/players/${props.userid}/notes`
}

async function load() {
  loading.value = true
  try { notes.value = await api(base()) }
  catch (err) { toast(err.message, true) }
  finally { loading.value = false }
}
onMounted(load)

async function onAdd() {
  const note = newNote.value.trim()
  if (!note) return
  try {
    await api(base(), { method: 'POST', body: JSON.stringify({ note }) })
    newNote.value = ''
    await load()
  } catch (err) { toast(err.message, true) }
}

async function onDelete(id) {
  try {
    await api(`${base()}/${id}`, { method: 'DELETE' })
    await load()
  } catch (err) { toast(err.message, true) }
}
</script>

<template>
  <div class="card">
    <div class="card-head"><h2>{{ t('notes.title', { uid: userid }) }}</h2></div>
    <div v-if="loading" class="empty">{{ t('notes.loading') }}</div>
    <template v-else>
      <p v-if="!notes.length" class="empty">{{ t('notes.empty') }}</p>
      <div v-for="n in notes" :key="n.id" class="kv">
        <div>
          <dt>{{ n.created_by_username }} — {{ n.created_at }}</dt>
          <dd>{{ n.note }}
            <button v-if="hasRole('admin','moderator')" class="btn btn-sm btn-danger" style="margin-left:8px;" @click="onDelete(n.id)">{{ t('notes.delete') }}</button>
          </dd>
        </div>
      </div>
    </template>
    <form v-if="hasRole('admin','moderator')" class="inline-form" style="margin-top: 12px;" @submit.prevent="onAdd">
      <input v-model="newNote" type="text" :placeholder="t('notes.placeholder')" maxlength="1000">
      <button type="submit" class="btn btn-sm btn-primary">{{ t('notes.add') }}</button>
    </form>
    <button class="btn btn-sm" style="margin-top: 10px;" @click="$emit('close')">{{ t('notes.close') }}</button>
  </div>
</template>
