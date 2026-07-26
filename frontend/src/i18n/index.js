import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import fr from './locales/fr.json'
import es from './locales/es.json'
import zh from './locales/zh.json'

export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
]

const STORAGE_KEY = 'pal_locale'

function detectLocale() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED_LOCALES.some((l) => l.code === stored)) return stored
  const browser = (navigator.language || 'en').slice(0, 2).toLowerCase()
  if (SUPPORTED_LOCALES.some((l) => l.code === browser)) return browser
  return 'en'
}

const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { en, fr, es, zh },
})

export function setLocale(code) {
  i18n.global.locale.value = code
  localStorage.setItem(STORAGE_KEY, code)
}

export default i18n
