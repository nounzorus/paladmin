<script setup>
import { useI18n } from 'vue-i18n'
import { logout } from '../composables/useAuth'
import { hasRole } from '../composables/useRole'
import LanguageSwitcher from './LanguageSwitcher.vue'

const { t } = useI18n()
</script>

<template>
  <header class="navbar">
    <div class="login-mark navbar-mark">PAL<span>ADMIN</span></div>
    <nav class="navbar-links">
      <router-link :to="{ name: 'servers' }">{{ t('nav.servers') }}</router-link>
      <router-link v-if="hasRole('admin')" :to="{ name: 'users' }">{{ t('nav.users') }}</router-link>
      <router-link v-if="hasRole('admin')" :to="{ name: 'audit-log' }">{{ t('nav.auditLog') }}</router-link>
      <router-link v-if="hasRole('admin')" :to="{ name: 'webhooks' }">{{ t('nav.webhooks') }}</router-link>
    </nav>
    <LanguageSwitcher />
    <button class="btn btn-ghost" @click="logout">{{ t('nav.logout') }}</button>
  </header>
</template>
