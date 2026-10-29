<!-- src/views/RoomsList.vue -->
<template>
  <div class="wrap">
    <header class="head">
      <div class="left-tools">
        <button class="ghost back" @click="goHome" aria-label="กลับหน้าแรก">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M15 18l-6-6 6-6"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="label">{{ t('rooms.backToList') || 'กลับหน้าแรก' }}</span>
        </button>
         <h1>{{ t('rooms.title') || 'ห้องพักของเรา' }}</h1>
      </div>

     

      <div class="tools">
        <input
          v-model.trim="q"
          class="search"
          :placeholder="t('rooms.searchPlaceholder') || 'ค้นหาชื่อห้อง…'"
        />
        <button class="btn" @click="load" :disabled="loading">
          {{
            loading
              ? (t('common.loading') || 'กำลังโหลด…')
              : (t('common.refresh') || 'รีเฟรช')
          }}
        </button>
      </div>
    </header>

    <!-- states -->
    <div v-if="error" class="state error">
      {{ t('common.errorPrefix') || 'เกิดข้อผิดพลาด:' }} {{ error }}
    </div>
    <div v-else-if="loading" class="state">
      {{ t('common.loading') || 'กำลังโหลดข้อมูล…' }}
    </div>
    <div v-else-if="filtered.length === 0" class="state">
      {{ t('rooms.empty') || 'ยังไม่มีห้อง หรือไม่พบตามคำค้น' }}
    </div>

    <!-- Rooms -->
    <section class="rooms" v-else>
      <div class="grid">
        <article
          v-for="r in filtered"
          :key="r.id"
          class="card"
          style="background-color: #fff; border-radius: 30px"
        >
          <!-- คลิกคอลลาจเพื่อไปหน้า RoomDetail -->
          <section class="collage5" @click="goDetail(r)">
            <div class="col left">
              <figure class="ph a">
                <img
                  :src="imgAt(r, 0)"
                  loading="eager"
                  @error="onErr"
                  :alt="r.name + ' 1'"
                />
              </figure>
              <figure class="ph c" v-if="has(r, 2)">
                <img
                  :src="imgAt(r, 2)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 3'"
                />
              </figure>
            </div>

            <div class="col right">
              <figure class="ph b" v-if="has(r, 1)">
                <img
                  :src="imgAt(r, 1)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 2'"
                />
              </figure>
              <figure class="ph d" v-if="has(r, 3)">
                <img
                  :src="imgAt(r, 3)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 4'"
                />
              </figure>
              <figure class="ph e" v-if="has(r, 4)">
                <img
                  :src="imgAt(r, 4)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 5'"
                />
              </figure>
            </div>
          </section>

          <div class="meta">
            <h3 class="title" v-if="lang=='th'">{{ r.name_th }}</h3>
            <h3 class="title" v-if="lang=='en'">{{ r.name_en }}</h3>
            <p
              class="desc"
              v-if="r.description_th && lang === 'th'"
              v-html="r.description_th"
            >
            </p>
            <p
              class="desc"
              v-if="r.description_en && lang === 'en'"
              v-html="r.description_en"
            >
            </p>

            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <!-- ปุ่มดูรูปทั้งหมด (เปิด lightbox) -->
              <button class="btn light" @click.stop="openGallery(r)">
                {{ t('rooms.viewPhotos') || 'ดูรูปทั้งหมด' }}
              </button>

              <!-- ลิงก์ไปหน้า RoomDetail -->
              <RouterLink
                :to="{ name: 'room-detail', params: { id: r.id } }"
                class="link"
              >
                {{ t('common.details') || 'รายละเอียด' }}
              </RouterLink>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- Lightbox -->
    <dialog ref="lightbox" class="lightbox" @click.self="closeLightbox">
      <button class="close" @click="closeLightbox">×</button>
      <div class="lb-wrap" v-if="active">
        <img
          :src="active.images[activeIndex].file_path"
          :alt="active.name"
          @error="onImgError"
        />
        <div class="lb-ctrl">
          <button class="btn" @click="prev" :disabled="activeIndex === 0">
            ‹ {{ t('rooms.prev') || 'ก่อนหน้า' }}
          </button>
          <span>{{ activeIndex + 1 }} / {{ active.images.length }}</span>
          <button
            class="btn"
            @click="next"
            :disabled="activeIndex >= active.images.length - 1"
          >
            {{ t('rooms.next') || 'ถัดไป' }} ›
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useT } from '@/components/useT'

const router = useRouter()
const { t, locale, withLang } = useT()
const lang = computed(() => locale.value);
const rooms = ref([])
const loading = ref(false)
const error = ref('')
const q = ref('')

// Lightbox
const lightbox = ref()
const active = ref(null)
const activeIndex = ref(0)

// helpers รูป
const ph = 'https://placehold.co/800x600?text=No+Image'
function imgAt (r, i) {
  return r?.images?.[i]?.file_path || ph
}
function has (r, i) {
  return Array.isArray(r?.images) && !!r.images[i]?.file_path
}
function onErr (e) {
  e.target.src = ph;
}
function onImgError (e) {
  e.target.src = ph;
}

// filter ตามชื่อห้อง (ใช้ name ที่ backend คืนมาตามภาษา)
const filtered = computed(() => {
  const s = q.value.toLowerCase()
  if (!s) return rooms.value
  return rooms.value.filter(r => r.name?.toLowerCase().includes(s))
})

// โหลดข้อมูลห้อง (แนบ ?lang=th|en ด้วย withLang)
async function load () {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(withLang('/api/rooms_list.php'), {
      credentials: 'include'
    })
    const raw = await res.text()
    let data
    try {
      data = JSON.parse(raw)
    } catch (e) {
      throw new Error(`Response is not JSON: ${raw.slice(0, 200)}`)
    }
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`)
    }
    rooms.value = (data.rooms || []).map(x => ({
      ...x,
      images: (x.images || []).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      )
    }))
  } catch (e) {
    console.error(e)
    error.value = e.message || 'unknown_error'
  } finally {
    loading.value = false
  }
}

// คลิกการ์ด / คอลลาจ -> ไปหน้า RoomDetail
function goDetail (r) {
  router.push({ name: 'room-detail', params: { id: r.id } })
}

// ปุ่มกลับหน้าแรก
function goHome () {
  router.push({ name: 'home' }) // หรือ router.push('/')
}

// Lightbox control
function openGallery (r, index = 0) {
  if (!r.images || r.images.length === 0) return
  active.value = r
  activeIndex.value = index
  lightbox.value?.showModal?.()
}
function closeLightbox () {
  lightbox.value?.close?.()
  active.value = null
  activeIndex.value = 0
}
function prev () {
  if (activeIndex.value > 0) activeIndex.value--
}
function next () {
  if (active.value && activeIndex.value < active.value.images.length - 1) {
    activeIndex.value++
  }
}

onMounted(load)

// เปลี่ยนภาษา → โหลดข้อมูลห้องใหม่ (ชื่อ/คำอธิบายจะเป็นภาษานั้น)
watch(locale, () => {
  load()
})
</script>

<style scoped>
:root {
  --bg: #f7f8fb;
  --card: #fff;
  --text: #1a1d22;
  --muted: #6b7280;
  --ring: #e5e7eb;
  --accent: #7aa63a;
  --shadow: 0 14px 30px rgba(16, 24, 40, 0.08);
  --radius: 18px;
}

.head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

h1 {
  font-size: 28px;
  margin: 0;
}

.left-tools{
  display: flex;
  align-items: center;
  justify-content: start;

}
/* ปุ่มกลับ */
.ghost {
  border: 1px solid var(--ring);
  background: #fff;
  color: var(--text);
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
}
.ghost.back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  margin-right: 10px;
}

/* กลุ่มเครื่องมือชิดขวา */
.tools {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-self: end;
  flex-wrap: nowrap;
}

/* ช่องค้นหา */
.search {
  padding: 10px 12px;
  border: 1px solid var(--ring);
  border-radius: 12px;
  min-width: 220px;
}

/* ปุ่ม */
.btn {
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 700;
  background: linear-gradient(180deg, #8fc857, #7aa63a);
  color: #fff;
  cursor: pointer;
}
.btn.light {
  background: #eef1f4;
  color: #374151;
}

/* ย่อบนจอเล็ก */
@media (max-width: 640px) {
  .ghost.back {
    padding: 8px;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    justify-content: center;
  }
  .ghost.back .label {
    display: none;
  }
  h1 {
    font-size: 22px;
  }
  .search {
    min-width: 140px;
  }
  .head {
    display: block;
    margin-bottom: 14px;
  }
}

.wrap {
  padding: 18px;
  max-width: 1200px;
  margin: auto;
}

.state {
  padding: 16px;
  border: 1px dashed var(--ring);
  border-radius: 12px;
  color: var(--muted);
}
.state.error {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fff1f2;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
@media (max-width: 980px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: var(--card);
  border: 1px solid var(--ring);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
}

/* Collage 5 รูป */
.collage5 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 10px;
  cursor: pointer;
}
.collage5 .col {
  display: grid;
  gap: 14px;
}
.collage5 .left {
  grid-template-rows: auto auto;
}
.collage5 .right {
  grid-template-rows: auto auto auto;
}
.collage5 figure {
  border-radius: 18px;
  overflow: hidden;
  background: #eef1f4;
}
.collage5 img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
.collage5 .a,
.collage5 .b,
.collage5 .d,
.collage5 .e {
  aspect-ratio: 4 / 3;
}
.collage5 .c {
  aspect-ratio: 3 / 4;
}

.meta {
  padding: 12px;
}
.title {
  margin: 2px 0 6px;
  font-size: 18px;
}
.desc {
  color: var(--muted);
  font-size: 14px;
  margin: 0 0 10px;
}
.link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 700;
}

/* Lightbox */
.lightbox::backdrop {
  background: rgba(0, 0, 0, 0.6);
}
.lightbox {
  width: min(96vw, 1100px);
  border: 0;
  border-radius: 14px;
  padding: 0;
  overflow: hidden;
  background: #000;
  margin: auto;
}
.lb-wrap {
  display: grid;
  gap: 8px;
  padding: 8px;
}
.lightbox img {
  width: 100%;
  height: auto;
  max-height: 76vh;
  object-fit: contain;
  background: #000;
}
.lb-ctrl {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #fff;
}
.close {
  position: absolute;
  top: 6px;
  right: 10px;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 28px;
  cursor: pointer;
}
</style>
