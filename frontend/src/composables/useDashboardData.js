import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from './useApi'

function fmtUptime(s) {
  if (s == null) return '–'
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`
}

export function useDashboardData(serverId) {
  const { t } = useI18n()
  const base = () => `/api/servers/${serverId.value}`

  const hbServername = ref('—')
  const hbVersion = ref('')
  const hbDotClass = ref('') // '', 'online', 'offline'
  const hbFps = ref('–')
  const hbUptime = ref('–')
  const hbDays = ref('–')
  const hbPlayers = ref('–')

  const infoName = ref('–')
  const infoVersion = ref('–')
  const infoDesc = ref('–')
  const infoFrametime = ref('–')
  const infoCapacity = ref('–')

  const players = ref([])
  const playersLoaded = ref(false)
  const playersError = ref('')
  const playersRefreshedLabel = ref('—')

  async function refreshAll() {
    // Infos serveur
    try {
      const info = await api(`${base()}/info`)
      hbServername.value = info.servername || t('heartbeat.defaultName')
      hbVersion.value = info.version ? 'v' + info.version : ''
      infoName.value = info.servername || '–'
      infoVersion.value = info.version || '–'
      infoDesc.value = info.description || '–'
      hbDotClass.value = 'online'
    } catch (e) {
      hbDotClass.value = 'offline'
      hbServername.value = t('heartbeat.offline')
      hbVersion.value = ''
    }

    // Métriques
    try {
      const m = await api(`${base()}/metrics`)
      hbFps.value = m.serverfps ?? '–'
      hbUptime.value = fmtUptime(m.uptime)
      hbDays.value = m.days ?? '–'
      hbPlayers.value = (m.currentplayernum ?? '–') + (m.maxplayernum ? ' / ' + m.maxplayernum : '')
      infoFrametime.value = m.serverframetime != null ? m.serverframetime.toFixed(2) + ' ms' : '–'
      infoCapacity.value = m.maxplayernum != null ? m.maxplayernum + ' ' + t('serverInfo.capacitySuffix') : '–'
    } catch {}

    // Joueurs
    try {
      const data = await api(`${base()}/players`)
      players.value = data.players || []
      playersLoaded.value = true
      playersError.value = ''
      playersRefreshedLabel.value = t('players.refreshedAt', { time: new Date().toLocaleTimeString() })
    } catch (e) {
      playersLoaded.value = true
      playersError.value = e.message
    }
  }

  return {
    hbServername, hbVersion, hbDotClass, hbFps, hbUptime, hbDays, hbPlayers,
    infoName, infoVersion, infoDesc, infoFrametime, infoCapacity,
    players, playersLoaded, playersError, playersRefreshedLabel,
    refreshAll,
  }
}
