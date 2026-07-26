<script setup>
import { inject, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'
import { toast } from '../composables/useToast'
import { confirmDialog } from '../composables/useConfirm'
import { hasRole } from '../composables/useRole'
import PlayerNotesPanel from './PlayerNotesPanel.vue'

const { t } = useI18n()
const dashboard = inject('dashboardData')
const route = useRoute()
const notesForUid = ref(null)

function uidOf(p) {
  return p.userId || p.userid || p.playerId || ''
}

async function onAction(act, uid, name) {
  const confirmMsg = act === 'ban' ? t('players.confirmBan', { name, uid }) : t('players.confirmKick', { name, uid })
  if (!(await confirmDialog(t('confirm.title'), confirmMsg))) return
  try {
    await api(`/api/servers/${route.params.serverId}/players/${act}`, { method: 'POST', body: JSON.stringify({ userid: uid }) })
    toast(act === 'ban' ? t('players.banned', { name }) : t('players.kicked', { name }))
    dashboard.refreshAll()
  } catch (err) {
    toast(err.message, true)
  }
}
</script>

<template>
  <div class="card">
    <div class="card-head">
      <h2>{{ t('players.title') }}</h2>
      <span class="card-hint" id="players-refreshed">{{ dashboard.playersRefreshedLabel.value }}</span>
    </div>
    <div class="table-wrap">
      <table id="players-table">
        <thead>
          <tr><th>{{ t('players.name') }}</th><th>{{ t('players.level') }}</th><th>{{ t('players.ping') }}</th><th>{{ t('players.id') }}</th><th class="th-actions">{{ t('players.actions') }}</th></tr>
        </thead>
        <tbody id="players-body">
          <tr v-if="!dashboard.playersLoaded.value"><td colspan="5" class="empty">{{ t('players.loading') }}</td></tr>
          <tr v-else-if="dashboard.playersError.value"><td colspan="5" class="empty">{{ dashboard.playersError.value }}</td></tr>
          <tr v-else-if="!dashboard.players.value.length"><td colspan="5" class="empty">{{ t('players.empty') }}</td></tr>
          <template v-else>
            <tr v-for="p in dashboard.players.value" :key="uidOf(p)">
              <td>{{ p.name }}</td>
              <td>{{ p.level ?? '–' }}</td>
              <td>{{ p.ping != null ? Math.round(p.ping) + ' ms' : '–' }}</td>
              <td class="mono">{{ uidOf(p) }}</td>
              <td class="actions">
                <button class="btn btn-sm" @click="notesForUid = uidOf(p)">{{ t('players.notes') }}</button>
                <template v-if="hasRole('admin','moderator')">
                  <button class="btn btn-sm" @click="onAction('kick', uidOf(p), p.name)">{{ t('players.kick') }}</button>
                  <button class="btn btn-sm btn-danger" @click="onAction('ban', uidOf(p), p.name)">{{ t('players.ban') }}</button>
                </template>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
  <PlayerNotesPanel v-if="notesForUid" :userid="notesForUid" @close="notesForUid = null" />
</template>
