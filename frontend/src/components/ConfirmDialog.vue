<script setup>
import { useI18n } from 'vue-i18n'
import { confirmState, handleOk, handleCancel } from '../composables/useConfirm'

const { t } = useI18n()
</script>

<template>
  <div id="confirm-backdrop" class="confirm-backdrop" :hidden="!confirmState.visible">
    <div class="confirm-box" role="dialog" aria-modal="true">
      <h3 id="confirm-title">{{ confirmState.title }}</h3>
      <p id="confirm-text">{{ confirmState.text }}</p>
      <div class="btn-row">
        <button id="confirm-cancel" class="btn" @click="handleCancel">{{ t('confirm.cancel') }}</button>
        <button id="confirm-ok" class="btn btn-danger" @click="handleOk">{{ t('confirm.confirm') }}</button>
      </div>
    </div>
  </div>
</template>
