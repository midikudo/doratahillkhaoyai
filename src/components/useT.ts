// src/composables/useT.ts
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

export function useT() {
  const { t, locale } = useI18n()

  const lang = computed(() => (locale.value === 'en' ? 'en' : 'th'))

  function withLang(url: string) {
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}lang=${lang.value}`
  }

  return { t, lang, locale, withLang }
}
