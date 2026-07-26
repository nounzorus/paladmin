<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { servers, loadServers } from '../composables/useServers'
import { api } from '../composables/useApi'
import { toast } from '../composables/useToast'
import { confirmDialog } from '../composables/useConfirm'
import { hasRole } from '../composables/useRole'

const { t } = useI18n()
onMounted(loadServers)

function emptyForm() {
  return { name: '', host: '', apiPort: 8212, adminPassword: '', rconEnabled: false, rconPort: 25575 }
}

const form = ref(emptyForm())
const editingId = ref(null)

function startCreate() {
  editingId.value = null
  form.value = emptyForm()
}

function startEdit(s) {
  editingId.value = s.id
  form.value = { name: s.name, host: s.host, apiPort: s.api_port, adminPassword: '', rconEnabled: !!s.rcon_enabled, rconPort: s.rcon_port }
}

async function onSubmit() {
  try {
    if (editingId.value) {
      await api(`/api/servers/${editingId.value}`, { method: 'PUT', body: JSON.stringify(form.value) })
      toast(t('servers.updated'))
    } else {
      await api('/api/servers', { method: 'POST', body: JSON.stringify(form.value) })
      toast(t('servers.added'))
    }
    startCreate()
    await loadServers()
  } catch (err) {
    toast(err.message, true)
  }
}

async function onDelete(s) {
  if (!(await confirmDialog(t('confirm.title'), t('servers.confirmDelete', { name: s.name })))) return
  try {
    await api(`/api/servers/${s.id}`, { method: 'DELETE' })
    toast(t('servers.deleted'))
    await loadServers()
  } catch (err) {
    toast(err.message, true)
  }
}
</script>

<template>
  <main>
    <section class="tab-panel active">
      <div class="grid">
        <div class="col-main">
          <div class="card">
            <div class="card-head"><h2>{{ t('servers.title') }}</h2></div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>{{ t('servers.name') }}</th><th>{{ t('servers.host') }}</th><th>{{ t('servers.apiPort') }}</th><th v-if="hasRole('admin')" class="th-actions">{{ t('servers.actions') }}</th></tr></thead>
                <tbody>
                  <tr v-if="!servers.length"><td colspan="4" class="empty">{{ t('servers.empty') }}</td></tr>
                  <tr v-for="s in servers" :key="s.id">
                    <td><router-link :to="{ name: 'server-dashboard', params: { serverId: s.id } }">{{ s.name }}</router-link></td>
                    <td class="mono">{{ s.host }}</td>
                    <td class="mono">{{ s.api_port }}</td>
                    <td v-if="hasRole('admin')" class="actions">
                      <button class="btn btn-sm" @click="startEdit(s)">{{ t('servers.edit') }}</button>
                      <button class="btn btn-sm btn-danger" @click="onDelete(s)">{{ t('servers.delete') }}</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div v-if="hasRole('admin')" class="col-side">
          <div class="card">
            <div class="card-head"><h2>{{ editingId ? t('servers.editTitle') : t('servers.addTitle') }}</h2></div>
            <form class="inline-form" style="flex-direction: column; align-items: stretch;" @submit.prevent="onSubmit">
              <input v-model="form.name" type="text" :placeholder="t('servers.namePlaceholder')" required>
              <input v-model="form.host" type="text" :placeholder="t('servers.hostPlaceholder')" required>
              <input v-model.number="form.apiPort" type="number" :placeholder="t('servers.apiPortPlaceholder')" min="1" max="65535">
              <input v-model="form.adminPassword" type="password" :placeholder="editingId ? t('servers.adminPasswordEditPlaceholder') : t('servers.adminPasswordPlaceholder')" :required="!editingId">
              <label><input v-model="form.rconEnabled" type="checkbox"> {{ t('servers.rconEnabled') }}</label>
              <input v-model.number="form.rconPort" type="number" :placeholder="t('servers.rconPortPlaceholder')" min="1" max="65535">
              <div class="btn-row">
                <button type="submit" class="btn btn-primary">{{ editingId ? t('servers.save') : t('servers.add') }}</button>
                <button v-if="editingId" type="button" class="btn" @click="startCreate">{{ t('servers.cancel') }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
