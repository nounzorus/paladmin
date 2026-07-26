<script setup>
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, setLocale } from '../i18n'

const { locale } = useI18n()
</script>

<template>
  <select class="language-switcher" :value="locale" @change="setLocale($event.target.value)">
    <option v-for="l in SUPPORTED_LOCALES" :key="l.code" :value="l.code">{{ l.label }}</option>
  </select>
</template>
