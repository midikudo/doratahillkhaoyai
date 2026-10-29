import { defineStore } from 'pinia'
import { i18n } from '@/i18n'

export const useLangStore = defineStore('lang', {
  state: () => ({ lang: 'th' }),
  actions: {
    init() {
      const ls = localStorage.getItem('site_lang')
      this.lang = (ls === 'en') ? 'en' : 'th'
      i18n.global.locale.value = this.lang
    },
    setLang(l) {
      this.lang = (l === 'en') ? 'en' : 'th'
      localStorage.setItem('site_lang', this.lang)
      i18n.global.locale.value = this.lang
    }
  }
})
