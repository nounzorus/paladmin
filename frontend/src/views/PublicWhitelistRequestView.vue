<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from '../composables/useApi'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const { t } = useI18n()
const route = useRoute()

const serverName = ref('')
const loadingServer = ref(true)
const serverError = ref('')

const userid = ref('')
const name = ref('')
const message = ref('')
const website = ref('') // honeypot, must stay empty
const submitting = ref(false)
const errorMessage = ref('')
const submitted = ref(false)

async function loadServer() {
  loadingServer.value = true
  try {
    const data = await api(`/public/servers/${route.params.serverId}`)
    serverName.value = data.name
  } catch (e) {
    serverError.value = e.message
  } finally {
    loadingServer.value = false
  }
}
onMounted(loadServer)

async function onSubmit() {
  errorMessage.value = ''
  submitting.value = true
  try {
    await api(`/public/servers/${route.params.serverId}/whitelist-requests`, {
      method: 'POST',
      body: JSON.stringify({ userid: userid.value, name: name.value, message: message.value, website: website.value }),
    })
    submitted.value = true
  } catch (e) {
    errorMessage.value = e.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="login-screen">
    <div class="login-card">
      <div class="login-card-head">
        <div class="login-mark">PAL<span>ADMIN</span></div>
        <LanguageSwitcher />
      </div>

      <template v-if="loadingServer">
        <p class="login-sub">{{ t('publicJoin.loading') }}</p>
      </template>

      <template v-else-if="serverError">
        <h1>{{ t('publicJoin.title') }}</h1>
        <p class="login-error">{{ serverError }}</p>
      </template>

      <template v-else-if="submitted">
        <h1>{{ t('publicJoin.submittedTitle') }}</h1>
        <p class="login-sub">{{ t('publicJoin.submittedBody') }}</p>
      </template>

      <form v-else autocomplete="off" @submit.prevent="onSubmit">
        <h1>{{ t('publicJoin.title') }}</h1>
        <p class="login-sub">{{ t('publicJoin.subtitle', { server: serverName }) }}</p>

        <label for="join-userid">{{ t('publicJoin.userid') }}</label>
        <input id="join-userid" v-model="userid" type="text" required autofocus :placeholder="t('publicJoin.useridPlaceholder')">

        <label for="join-name">{{ t('publicJoin.name') }}</label>
        <input id="join-name" v-model="name" type="text" :placeholder="t('publicJoin.namePlaceholder')">

        <label for="join-message">{{ t('publicJoin.message') }}</label>
        <input id="join-message" v-model="message" type="text" :placeholder="t('publicJoin.messagePlaceholder')">

        <div aria-hidden="true" style="position: absolute; left: -9999px;">
          <label for="join-website">Leave this field empty</label>
          <input id="join-website" v-model="website" type="text" tabindex="-1" autocomplete="off">
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="submitting">{{ t('publicJoin.submit') }}</button>
        <p class="login-error" v-if="errorMessage">{{ errorMessage }}</p>
      </form>
    </div>
  </section>
</template>
