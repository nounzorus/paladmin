<script setup>
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const dashboard = inject('dashboardData')
</script>

<template>
  <div class="card">
    <div class="card-head"><h2>{{ t('serverInfo.title') }}</h2></div>
    <dl class="kv" id="server-info">
      <div><dt>{{ t('serverInfo.name') }}</dt><dd id="info-name">{{ dashboard.infoName.value }}</dd></div>
      <div><dt>{{ t('serverInfo.version') }}</dt><dd id="info-version">{{ dashboard.infoVersion.value }}</dd></div>
      <div><dt>{{ t('serverInfo.description') }}</dt><dd id="info-desc">{{ dashboard.infoDesc.value }}</dd></div>
      <div><dt>{{ t('serverInfo.frametime') }}</dt><dd id="info-frametime">{{ dashboard.infoFrametime.value }}</dd></div>
      <div><dt>{{ t('serverInfo.capacity') }}</dt><dd id="info-capacity">{{ dashboard.infoCapacity.value }}</dd></div>
    </dl>
  </div>
</template>
