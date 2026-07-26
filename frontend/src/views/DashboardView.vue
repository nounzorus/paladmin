<script setup>
import PlayersTable from '../components/PlayersTable.vue'
import AnnounceForm from '../components/AnnounceForm.vue'
import ModerationForm from '../components/ModerationForm.vue'
import ServerInfoPanel from '../components/ServerInfoPanel.vue'
import ServerActionsPanel from '../components/ServerActionsPanel.vue'
import { hasRole } from '../composables/useRole'
</script>

<template>
  <section id="tab-dashboard" class="tab-panel active">
    <div class="grid">
      <div class="col-main">
        <PlayersTable />
        <AnnounceForm v-if="hasRole('admin', 'moderator')" />
        <ModerationForm v-if="hasRole('admin', 'moderator')" />
      </div>
      <div class="col-side">
        <ServerInfoPanel />
        <ServerActionsPanel v-if="hasRole('admin')" />
      </div>
    </div>
  </section>
</template>
