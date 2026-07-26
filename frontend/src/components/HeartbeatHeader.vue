<script setup>
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const dashboard = inject('dashboardData')
</script>

<template>
  <header class="heartbeat">
    <div class="hb-left">
      <span id="hb-dot" class="hb-dot" :class="dashboard.hbDotClass.value"></span>
      <span class="hb-name" id="hb-servername">{{ dashboard.hbServername.value }}</span>
      <span class="hb-version" id="hb-version">{{ dashboard.hbVersion.value }}</span>
    </div>
    <div class="hb-stats">
      <div class="hb-stat"><span class="hb-label">{{ t('heartbeat.players') }}</span><span class="hb-value" id="hb-players">{{ dashboard.hbPlayers.value }}</span></div>
      <div class="hb-stat"><span class="hb-label">{{ t('heartbeat.fps') }}</span><span class="hb-value" id="hb-fps">{{ dashboard.hbFps.value }}</span></div>
      <div class="hb-stat"><span class="hb-label">{{ t('heartbeat.uptime') }}</span><span class="hb-value" id="hb-uptime">{{ dashboard.hbUptime.value }}</span></div>
      <div class="hb-stat"><span class="hb-label">{{ t('heartbeat.day') }}</span><span class="hb-value" id="hb-days">{{ dashboard.hbDays.value }}</span></div>
    </div>
  </header>
</template>
