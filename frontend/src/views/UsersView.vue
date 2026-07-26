<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'
import { toast } from '../composables/useToast'
import { confirmDialog } from '../composables/useConfirm'
import { servers, loadServers } from '../composables/useServers'

const { t } = useI18n()
const users = ref([])
const loading = ref(true)

async function loadUsers() {
  loading.value = true
  try { users.value = await api('/api/users') }
  finally { loading.value = false }
}

onMounted(() => { loadUsers(); if (!servers.value.length) loadServers() })

const form = ref({ username: '', password: '', role: 'moderator' })

async function onCreate() {
  try {
    await api('/api/users', { method: 'POST', body: JSON.stringify(form.value) })
    toast(t('users.created'))
    form.value = { username: '', password: '', role: 'moderator' }
    await loadUsers()
  } catch (err) { toast(err.message, true) }
}

async function onDelete(u) {
  if (!(await confirmDialog(t('confirm.title'), t('users.confirmDelete', { username: u.username })))) return
  try {
    await api(`/api/users/${u.id}`, { method: 'DELETE' })
    toast(t('users.deleted'))
    await loadUsers()
  } catch (err) { toast(err.message, true) }
}

async function onToggleDisabled(u) {
  try {
    await api(`/api/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ disabled: !u.disabled }) })
    toast(u.disabled ? t('users.reenabled') : t('users.disabledMsg'))
    await loadUsers()
  } catch (err) { toast(err.message, true) }
}

async function onRoleChange(u, e) {
  try {
    await api(`/api/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ role: e.target.value }) })
    toast(t('users.roleUpdated'))
    await loadUsers()
  } catch (err) { toast(err.message, true) }
}

const assigningUser = ref(null)
const assignedServerIds = ref([])

async function openAssign(u) {
  assigningUser.value = u
  assignedServerIds.value = await api(`/api/users/${u.id}/servers`)
}

function toggleAssign(id) {
  const idx = assignedServerIds.value.indexOf(id)
  if (idx === -1) assignedServerIds.value.push(id)
  else assignedServerIds.value.splice(idx, 1)
}

async function saveAssign() {
  try {
    await api(`/api/users/${assigningUser.value.id}/servers`, {
      method: 'PUT',
      body: JSON.stringify({ serverIds: assignedServerIds.value }),
    })
    toast(t('users.accessUpdated'))
    assigningUser.value = null
  } catch (err) { toast(err.message, true) }
}
</script>

<template>
  <main>
    <section class="tab-panel active">
      <div class="grid">
        <div class="col-main">
          <div class="card">
            <div class="card-head"><h2>{{ t('users.title') }}</h2></div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>{{ t('users.username') }}</th><th>{{ t('users.role') }}</th><th>{{ t('users.status') }}</th><th class="th-actions">{{ t('users.actions') }}</th></tr></thead>
                <tbody>
                  <tr v-if="loading"><td colspan="4" class="empty">{{ t('users.loading') }}</td></tr>
                  <tr v-else-if="!users.length"><td colspan="4" class="empty">{{ t('users.empty') }}</td></tr>
                  <tr v-for="u in users" :key="u.id" v-else>
                    <td>{{ u.username }}</td>
                    <td>
                      <select :value="u.role" @change="onRoleChange(u, $event)">
                        <option value="admin">admin</option>
                        <option value="moderator">moderator</option>
                        <option value="viewer">viewer</option>
                      </select>
                    </td>
                    <td>{{ u.disabled ? t('users.disabledStatus') : t('users.active') }}</td>
                    <td class="actions">
                      <button class="btn btn-sm" @click="openAssign(u)">{{ t('users.servers') }}</button>
                      <button class="btn btn-sm" @click="onToggleDisabled(u)">{{ u.disabled ? t('users.enable') : t('users.disable') }}</button>
                      <button class="btn btn-sm btn-danger" @click="onDelete(u)">{{ t('users.delete') }}</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="assigningUser" class="card">
            <div class="card-head"><h2>{{ t('users.serverAccessTitle', { username: assigningUser.username }) }}</h2></div>
            <div class="btn-row" style="flex-wrap: wrap;">
              <label v-for="s in servers" :key="s.id" class="btn" style="cursor:pointer;">
                <input type="checkbox" :checked="assignedServerIds.includes(s.id)" @change="toggleAssign(s.id)"> {{ s.name }}
              </label>
            </div>
            <div class="btn-row" style="margin-top: 12px;">
              <button class="btn btn-primary" @click="saveAssign">{{ t('users.save') }}</button>
              <button class="btn" @click="assigningUser = null">{{ t('users.cancel') }}</button>
            </div>
          </div>
        </div>

        <div class="col-side">
          <div class="card">
            <div class="card-head"><h2>{{ t('users.addTitle') }}</h2></div>
            <form class="inline-form" style="flex-direction: column; align-items: stretch;" @submit.prevent="onCreate">
              <input v-model="form.username" type="text" :placeholder="t('users.usernamePlaceholder')" required>
              <input v-model="form.password" type="password" :placeholder="t('users.passwordPlaceholder')" required>
              <select v-model="form.role">
                <option value="admin">admin</option>
                <option value="moderator">moderator</option>
                <option value="viewer">viewer</option>
              </select>
              <button type="submit" class="btn btn-primary">{{ t('users.create') }}</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
