<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <a
    class="coffee-widget"
    href="https://buymeacoffee.com/nounzor"
    target="_blank"
    rel="noopener"
    :title="t('nav.coffee')"
  >
    ☕ <span class="coffee-widget-label">{{ t('nav.coffee') }}</span>
  </a>
</template>
