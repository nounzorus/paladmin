<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { login } from '../composables/useAuth'
import LanguageSwitcher from './LanguageSwitcher.vue'

const { t } = useI18n()
const username = ref('')
const password = ref('')
const errorMessage = ref('')

async function onSubmit() {
  errorMessage.value = ''
  try {
    await login(username.value, password.value)
    password.value = ''
  } catch (err) {
    errorMessage.value = err.message
  }
}
</script>

<template>
  <section id="login-screen" class="login-screen">
    <form id="login-form" class="login-card" autocomplete="off" @submit.prevent="onSubmit">
      <div class="login-card-head">
        <div class="login-mark">PAL<span>WORLD</span></div>
        <LanguageSwitcher />
      </div>
      <h1>{{ t('login.title') }}</h1>
      <p class="login-sub">{{ t('login.subtitle') }}</p>
      <label for="login-username">{{ t('login.username') }}</label>
      <input id="login-username" v-model="username" type="text" required autofocus autocapitalize="off">
      <label for="login-password">{{ t('login.password') }}</label>
      <input id="login-password" v-model="password" type="password" required>
      <button type="submit" class="btn btn-primary btn-block">{{ t('login.submit') }}</button>
      <p id="login-error" class="login-error" v-if="errorMessage">{{ errorMessage }}</p>
    </form>
  </section>
</template>
