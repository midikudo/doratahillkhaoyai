<!-- src/components/LanguageSwitcher.vue -->
<template>
  <div class="lang-wrap" ref="wrap">
    <button class="lang-btn" @click="open = !open" :aria-expanded="open">
      {{ currentLabel }}
      <span class="chev">▾</span>
    </button>
    <ul v-if="open" class="menu" role="listbox">
      <li :class="{active: lang==='th'}" role="option" @click="set('th')">ไทย (TH)</li>
      <li :class="{active: lang==='en'}" role="option" @click="set('en')">Eng (EN)</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useLangStore } from '@/store/lang'

const store = useLangStore()
const lang = computed(() => store.lang)
const currentLabel = computed(() => lang.value === 'en' ? 'Eng' : 'ไทย')

const open = ref(false)
const wrap = ref(null)

function set(code){
  store.setLang(code)
  open.value = false
}

// click นอกเพื่อปิดเมนู
function onDocClick(e){
  if (!wrap.value) return
  if (!wrap.value.contains(e.target)) open.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
.lang-wrap{ position:relative }
.lang-btn{
  border:1px solid #e5e7eb; background:#fff; border-radius:10px;
  padding:8px 8px; display:flex; align-items:center; gap:6px; cursor:pointer;
}
.chev{ font-size:12px; opacity:.7 }
.menu{
  position:absolute; right:0; top:calc(100% + 6px);
  min-width:160px; background:#fff; border:1px solid #e5e7eb;
  border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,.08); padding:6px; z-index:40;
}
.menu li{
  list-style:none; padding:8px 10px; border-radius:8px; cursor:pointer;
}
.menu li:hover{ background:#f3f4f6 }
.menu li.active{ font-weight:700; background:#eef2ff }
</style>
