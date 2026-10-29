// import { createApp } from 'vue'
// import App from './App.vue'
// import router from './router'
// import './assets/main.css'

// createApp(App).use(router).mount('#app')


import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { createPinia } from 'pinia'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

// ⬇️ ต้อง .use(pinia) ก่อนอะไรก็ตามที่จะใช้ store
app.use(pinia)
app.use(router)
app.use(i18n)
app.mount('#app')