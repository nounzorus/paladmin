<script setup>
import { useRoute } from 'vue-router'
import { isAuthenticated } from './composables/useAuth'
import LoginScreen from './components/LoginScreen.vue'
import NavBar from './components/NavBar.vue'
import ToastNotification from './components/ToastNotification.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'

const route = useRoute()
</script>

<template>
  <router-view v-if="route.meta.public" />
  <LoginScreen v-else-if="!isAuthenticated" />
  <div id="app" v-else>
    <NavBar />
    <router-view />
    <ToastNotification />
    <ConfirmDialog />
  </div>
</template>
