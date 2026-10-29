<template>
  <div class="wrap">
    <!-- ปุ่มย้อนกลับ -->
    <RouterLink to="/rooms" class="back">
      ‹ {{ t('rooms.backToList') || 'ย้อนกลับไปหน้าห้องพัก' }}
    </RouterLink>

    <!-- state ต่าง ๆ -->
    <div v-if="loading" class="state">
      {{ t('common.loading') || 'กำลังโหลดข้อมูลห้องพัก…' }}
    </div>
    <div v-else-if="error" class="state error">
      {{ error }}
    </div>
    <div v-else-if="!room" class="state">
      {{ t('rooms.notFound') || 'ไม่พบข้อมูลห้องพัก' }}
    </div>

    <!-- รายละเอียดห้อง -->
    <section v-else class="room-detail">
      <header class="head">
        <h1 v-if="lang==='th' && room.name_th">{{ room.name_th }}</h1>
        <h1 v-else-if="lang==='en' && room.name_en">{{ room.name_en }}</h1>
        <h1 v-else>{{ room.name_th || room.name_en || 'Room' }}</h1>

        <!-- ใช้ข้อความธรรมดา + pre-line เพื่อรักษา \n -->
        <p
          v-if="lang==='th' && room.description_th"
          class="desc preline" style="    pointer-events: none;
    -webkit-user-modify: read-write-plaintext-only;"
        >
          {{ room.description_th }}
        </p>
        <p
          v-else-if="lang==='en' && room.description_en"
          class="desc preline"
        >
          {{ room.description_en }}
        </p>
      </header>

      <!-- แกลเลอรีรูปหลัก (คลิกเพื่อเปิด Lightbox) -->
      <section class="collage5" v-if="room.images?.length">
        <div class="col left">
          <figure class="ph a" @click="openLightbox(0)">
            <img :src="imgAt(room, 0)" :alt="(room.name_th||room.name_en)+' 1'" @error="onErr" />
          </figure>
          <figure class="ph c" v-if="has(room, 2)" @click="openLightbox(2)">
            <img :src="imgAt(room, 2)" :alt="(room.name_th||room.name_en)+' 3'" @error="onErr" />
          </figure>
        </div>

        <div class="col right">
          <figure class="ph b" v-if="has(room, 1)" @click="openLightbox(1)">
            <img :src="imgAt(room, 1)" :alt="(room.name_th||room.name_en)+' 2'" @error="onErr" />
          </figure>
          <figure class="ph d" v-if="has(room, 3)" @click="openLightbox(3)">
            <img :src="imgAt(room, 3)" :alt="(room.name_th||room.name_en)+' 4'" @error="onErr" />
          </figure>
          <figure class="ph e" v-if="has(room, 4)" @click="openLightbox(4)">
            <img :src="imgAt(room, 4)" :alt="(room.name_th||room.name_en)+' 5'" @error="onErr" />
          </figure>
        </div>
      </section>
    </section>

    <!-- ========== LIGHTBOX ========== -->
    <div
      v-if="lightboxOpen && currentImage"
      class="lb-backdrop"
      @click.self="closeLightbox"
    >
      <div class="lb-inner">
        <button class="lb-close" @click="closeLightbox">×</button>

        <button
          v-if="totalImages > 1"
          class="lb-nav lb-prev"
          @click.stop="prevImage"
        >
          ‹
        </button>
        <button
          v-if="totalImages > 1"
          class="lb-nav lb-next"
          @click.stop="nextImage"
        >
          ›
        </button>

        <div class="lb-main">
          <img
            :src="currentImage || ph"
            :alt="(room?.name_th||room?.name_en) || 'image'"
            @error="onErr"
          />
        </div>

        <div v-if="totalImages > 1" class="lb-thumbs">
          <button
            v-for="(im, i) in room.images"
            :key="i"
            class="lb-thumb"
            :class="{ active: i === lightboxIndex }"
            @click.stop="goImage(i)"
          >
            <img :src="im.file_path" :alt="(room?.name_th||room?.name_en) + ' ' + (i + 1)" />
          </button>
        </div>
      </div>
    </div>
    <!-- /LIGHTBOX -->
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useT } from '@/components/useT'

const { t, locale, withLang } = useT()
const route = useRoute()
const lang = computed(() => locale.value)

const room = ref(null)
const loading = ref(true)
const error = ref('')

const ph = 'https://placehold.co/800x600?text=No+Image'
const onErr = (e) => { e.target.src = ph }

const imgAt = (r, i) => r?.images?.[i]?.file_path || ph
const has = (r, i) => Array.isArray(r?.images) && r.images[i] && r.images[i].file_path

async function loadRoom () {
  loading.value = true
  error.value = ''
  room.value = null

  const id = Number(route.params.id)
  if (!id) {
    error.value = 'missing_id'
    loading.value = false
    return
  }

  try {
    // ใช้ withLang เพื่อแนบ ?lang=th|en
    const res = await fetch(withLang('/api/rooms_list.php'))
    const data = await res.json()

    const list = data.rooms || []
    room.value = list.find(r => r.id === id) || null

    if (!room.value) {
      error.value = t('rooms.notFound') || 'ไม่พบห้องนี้ในระบบ'
    }
  } catch (e) {
    console.error(e)
    error.value = t('common.loadFailed') || 'โหลดข้อมูลไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

onMounted(loadRoom)
// เปลี่ยนภาษา → โหลดใหม่
watch(locale, () => loadRoom())
// เปลี่ยน id ห้อง → โหลดใหม่
watch(() => route.params.id, () => loadRoom())

/* ========== Lightbox ========== */
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const totalImages = computed(() => room.value?.images?.length || 0)
const currentImage = computed(() =>
  room.value?.images?.[lightboxIndex.value]?.file_path || null
)

function openLightbox (index = 0) {
  if (!totalImages.value) return
  lightboxIndex.value = index
  lightboxOpen.value = true
}
function closeLightbox () { lightboxOpen.value = false }
function nextImage () {
  if (!totalImages.value) return
  lightboxIndex.value = (lightboxIndex.value + 1) % totalImages.value
}
function prevImage () {
  if (!totalImages.value) return
  lightboxIndex.value = (lightboxIndex.value - 1 + totalImages.value) % totalImages.value
}
function goImage (i) {
  if (i < 0 || i >= totalImages.value) return
  lightboxIndex.value = i
}

/* ปิด / เลื่อนรูปด้วยคีย์บอร์ด */
const onKey = (e) => {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') return closeLightbox()
  if (e.key === 'ArrowRight') return nextImage()
  if (e.key === 'ArrowLeft') return prevImage()
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 18px 16px 32px;
}

.back {
  display: inline-block;
  margin-bottom: 12px;
  text-decoration: none;
  color: #2563eb;
}

.state {
  padding: 12px;
  border-radius: 12px;
  border: 1px dashed #e5e7eb;
}
.state.error {
  color: #b91c1c;
}

.head h1 {
  margin: 0 0 6px;
  font-size: clamp(22px, 3vw, 30px);
}
.head .desc {
  margin: 0 0 18px;
  color: #6b7280;
}
/* ทำให้ \n ถูกแสดงเป็นขึ้นบรรทัดใหม่ */
.preline { white-space: pre-line; }

/* collage5 layout เหมือนหน้า Home */
.collage5 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 10px 0;
}
.collage5 .col { display: grid; gap: 14px; }
.collage5 .left { grid-template-rows: auto auto; }
.collage5 .right { grid-template-rows: auto auto auto; }
.collage5 figure {
  border-radius: 18px;
  overflow: hidden;
  background: #eef1f4;
  cursor: zoom-in;
}
.collage5 .a, .collage5 .b, .collage5 .d, .collage5 .e { aspect-ratio: 4 / 3; }
.collage5 .c { aspect-ratio: 3 / 4; }
.collage5 img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

@media (max-width: 680px) {
  .collage5 { grid-template-columns: 1fr; }
}

/* ========== Lightbox styles ========== */
.lb-backdrop {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.88);
  display: flex; align-items: center; justify-content: center;
  z-index: 60;
}
.lb-inner {
  position: relative;
  max-width: min(1024px, 96vw);
  max-height: 92vh;
  width: 100%;
  padding: 16px; box-sizing: border-box;
}
.lb-main {
  background: #020617;
  border-radius: 16px; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  max-height: 70vh;
}
.lb-main img {
  max-width: 100%; max-height: 70vh;
  object-fit: contain; display: block;
}
.lb-close {
  position: absolute; top: 8px; right: 16px;
  width: 32px; height: 32px; border-radius: 999px;
  border: 0; background: rgba(15, 23, 42, 0.85);
  color: #e5e7eb; font-size: 22px; cursor: pointer;
}
.lb-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 40px; height: 40px; border-radius: 999px;
  border: 0; background: rgba(15, 23, 42, 0.85);
  color: #e5e7eb; font-size: 22px; cursor: pointer;
}
.lb-prev { left: 10px; }
.lb-next { right: 10px; }

.lb-thumbs {
  margin-top: 10px; display: flex; gap: 6px; overflow-x: auto;
}
.lb-thumb {
  border: 0; padding: 0; background: transparent;
  border-radius: 8px; overflow: hidden;
  width: 64px; height: 48px; flex: 0 0 auto;
  opacity: 0.6; cursor: pointer;
}
.lb-thumb.active { outline: 2px solid #22c55e; opacity: 1; }
.lb-thumb img { width: 100%; height: 100%; object-fit: cover; }
</style>
