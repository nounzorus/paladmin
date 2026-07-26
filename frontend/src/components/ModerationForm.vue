<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'
import { toast } from '../composables/useToast'
import { confirmDialog } from '../composables/useConfirm'

const { t } = useI18n()
const userid = ref('')
const reason = ref('')
const route = useRoute()

const actionLabelKeys = { kick: 'moderation.actionKick', ban: 'moderation.actionBan', unban: 'moderation.actionUnban' }

async function onAction(act) {
  const uid = userid.value.trim()
  const message = reason.value.trim()
  if (!uid) return toast(t('moderation.useridRequired'), true)
  if (act !== 'unban') {
    const ok = await confirmDialog(t('confirm.title'), act === 'ban' ? t('moderation.confirmBan', { uid }) : t('moderation.confirmKick', { uid }))
    if (!ok) return
  }
  try {
    await api(`/api/servers/${route.params.serverId}/players/${act}`, { method: 'POST', body: JSON.stringify({ userid: uid, message }) })
    toast(t('moderation.actionDone', { act: t(actionLabelKeys[act]), uid }))
  } catch (err) {
    toast(err.message, true)
  }
}
</script>

<template>
  <div class="card">
    <div class="card-head"><h2>{{ t('moderation.title') }}</h2>
      <span class="card-hint">{{ t('moderation.hint') }}</span>
    </div>
    <form id="mod-form" class="inline-form" @submit.prevent>
      <input id="mod-userid" v-model="userid" type="text" :placeholder="t('moderation.useridPlaceholder')" required>
      <input id="mod-reason" v-model="reason" type="text" :placeholder="t('moderation.reasonPlaceholder')">
      <div class="btn-row">
        <button type="button" class="btn" data-mod="kick" @click="onAction('kick')">{{ t('moderation.kick') }}</button>
        <button type="button" class="btn btn-danger" data-mod="ban" @click="onAction('ban')">{{ t('moderation.ban') }}</button>
        <button type="button" class="btn" data-mod="unban" @click="onAction('unban')">{{ t('moderation.unban') }}</button>
      </div>
    </form>
  </div>
</template>
