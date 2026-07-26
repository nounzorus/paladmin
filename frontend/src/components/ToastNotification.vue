<script setup>
import { toastState } from '../composables/useToast'
</script>

<template>
  <div id="toast" class="toast" :class="{ error: toastState.isError }" :hidden="!toastState.visible">
    {{ toastState.message }}
  </div>
</template>
