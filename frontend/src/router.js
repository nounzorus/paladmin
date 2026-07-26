import { createRouter, createWebHistory } from 'vue-router'
import { currentRole } from './composables/useAuth'

import ServersView from './views/ServersView.vue'
import UsersView from './views/UsersView.vue'
import AuditLogView from './views/AuditLogView.vue'
import ServerScopeLayout from './components/ServerScopeLayout.vue'
import DashboardView from './views/DashboardView.vue'
import MapView from './views/MapView.vue'
import SettingsView from './views/SettingsView.vue'
import ConsoleView from './views/ConsoleView.vue'
import BansView from './views/BansView.vue'
import WhitelistView from './views/WhitelistView.vue'
import ScheduledTasksView from './views/ScheduledTasksView.vue'
import MetricsHistoryView from './views/MetricsHistoryView.vue'
import WebhooksView from './views/WebhooksView.vue'
import PublicWhitelistRequestView from './views/PublicWhitelistRequestView.vue'

const routes = [
  { path: '/', redirect: '/servers' },
  { path: '/join/:serverId', name: 'public-join', component: PublicWhitelistRequestView, meta: { public: true } },
  { path: '/servers', name: 'servers', component: ServersView },
  { path: '/users', name: 'users', component: UsersView, meta: { roles: ['admin'] } },
  { path: '/audit-log', name: 'audit-log', component: AuditLogView, meta: { roles: ['admin'] } },
  { path: '/webhooks', name: 'webhooks', component: WebhooksView, meta: { roles: ['admin'] } },
  {
    path: '/servers/:serverId',
    component: ServerScopeLayout,
    children: [
      { path: '', redirect: (to) => ({ name: 'server-dashboard', params: to.params }) },
      { path: 'dashboard', name: 'server-dashboard', component: DashboardView },
      { path: 'map', name: 'server-map', component: MapView },
      { path: 'settings', name: 'server-settings', component: SettingsView },
      { path: 'console', name: 'server-console', component: ConsoleView, meta: { roles: ['admin'] } },
      { path: 'bans', name: 'server-bans', component: BansView },
      { path: 'whitelist', name: 'server-whitelist', component: WhitelistView },
      { path: 'scheduled-tasks', name: 'server-scheduled-tasks', component: ScheduledTasksView, meta: { roles: ['admin'] } },
      { path: 'metrics-history', name: 'server-metrics-history', component: MetricsHistoryView },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: 'active',
  linkExactActiveClass: 'active',
})

router.beforeEach((to) => {
  if (to.meta.roles && !to.meta.roles.includes(currentRole.value)) {
    return '/'
  }
  return true
})

export default router
