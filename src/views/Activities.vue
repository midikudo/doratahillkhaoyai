<!-- src/views/Activities.vue -->
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
         <h1>{{ t('activities.title') || 'กิจกรรม & ที่เที่ยวใกล้เคียง' }}</h1>
      </div>
     
    </header>

    <!-- ====== กิจกรรมภายในบ้าน (Facilities: activity) ====== -->
    <section class="block">
      <div class="block-head">
        <h2>{{ t('activities.inhouse') || 'กิจกรรมภายในบ้าน' }}</h2>
        <div class="tools">
          <input
            v-model.trim="qAct"
            class="search"
            :placeholder="t('activities.searchActivity') || 'ค้นหากิจกรรม…'"
          />
          <button class="btn" @click="loadFacilities" :disabled="loadingAct">
            {{
              loadingAct
                ? (t('common.loading') || 'กำลังโหลด…')
                : (t('common.refresh') || 'รีเฟรช')
            }}
          </button>
        </div>
      </div>

      <div v-if="errAct" class="state error">
        {{ t('common.errorPrefix') || 'เกิดข้อผิดพลาด:' }} {{ errAct }}
      </div>
      <div v-else-if="loadingAct" class="state">
        {{ t('common.loading') || 'กำลังโหลดข้อมูล…' }}
      </div>
      <div v-else-if="pagedAct.items.length === 0" class="state">
        {{ t('activities.emptyActivity') || 'ไม่พบกิจกรรม' }}
      </div>

      <div class="grid" v-if="pagedAct.items.length">
        <article v-for="it in pagedAct.items" :key="it.id" class="card">
          <div class="thumb" @click="openLightbox('act', it, 0)">
            <img
              :src="cover(it)"
              :alt="it.title"
              loading="lazy"
              @error="onImgError"
            />
          </div>
          <div class="meta">
            <h3 class="title" v-if="lang=='th'">{{ it.title_th }}</h3>
            <h3 class="title" v-else="lang=='en'">{{ it.title_en }}</h3>
            <p class="desc " style="    pointer-events: none;
    -webkit-user-modify: read-write-plaintext-only;
    white-space: pre-line; 
    " v-if="it.description_th && lang=='th'">{{ it.description_th }}</p>
            <p class="desc" style="    pointer-events: none;
    -webkit-user-modify: read-write-plaintext-only;
    white-space: pre-line; " v-else="it.description_en && lang=='en'">{{ it.description_en }}</p>

            <div class="imgs" v-if="(it.images?.length || 0) > 1">
              <img
                v-for="(im, i) in it.images.slice(1, 5)"
                :key="i"
                :src="im.file_path"
                :alt="it.title + ' photo ' + (i + 2)"
                loading="lazy"
                @click="openLightbox('act', it, i + 1)"
                @error="onImgError"
              />
              <span v-if="it.images.length > 5" class="more">
                +{{ it.images.length - 5 }}
              </span>
            </div>
          </div>
        </article>
      </div>

      <div class="pager" v-if="pagedAct.totalPages > 1">
        <button class="btn sm" @click="actPage--" :disabled="actPage === 1">
          ‹
        </button>
        <span>
          {{ t('common.page') || 'หน้า' }} {{ actPage }} /
          {{ pagedAct.totalPages }}
        </span>
        <button
          class="btn sm"
          @click="actPage++"
          :disabled="actPage === pagedAct.totalPages"
        >
          ›
        </button>
      </div>
    </section>

    <!-- ====== สถานที่เที่ยวใกล้เคียง (Attractions) ====== -->
    <section class="block">
      <div class="block-head">
        <h2>{{ t('activities.nearby') || 'สถานที่เที่ยวใกล้เคียง' }}</h2>
        <div class="tools">
          <input
            v-model.trim="qAtt"
            class="search"
            :placeholder="t('activities.search') || 'ค้นหาสถานที่…'"
          />
          <button class="btn" @click="loadAttractions" :disabled="loadingAtt">
            {{
              loadingAtt
                ? (t('common.loading') || 'กำลังโหลด…')
                : (t('common.refresh') || 'รีเฟรช')
            }}
          </button>
        </div>
      </div>

      <div v-if="errAtt" class="state error">
        {{ t('common.errorPrefix') || 'เกิดข้อผิดพลาด:' }} {{ errAtt }}
      </div>
      <div v-else-if="loadingAtt" class="state">
        {{ t('common.loading') || 'กำลังโหลดข้อมูล…' }}
      </div>
      <div v-else-if="pagedAtt.items.length === 0" class="state">
        {{ t('activities.emptyPlace') || 'ไม่พบสถานที่เที่ยว' }}
      </div>

      <div class="grid" v-if="pagedAtt.items.length">
        <article v-for="a in pagedAtt.items" :key="a.id" class="card">
          <div class="thumb" @click="openLightbox('att', a, 0)">
            <img
              :src="cover(a)"
              :alt="a.title"
              loading="lazy"
              @error="onImgError"
            />
          </div>
          <div class="meta">
            <h3 class="title">{{ a.title }}</h3>
            <p class="desc" v-if="a.description">{{ a.description }}</p>
            <div class="links">
              <a
                v-if="a.map_link"
                :href="a.map_link"
                target="_blank"
                rel="noopener"
              >
                {{ t('activities.viewMap') || 'ดูแผนที่' }}
              </a>
            </div>

            <div class="imgs" v-if="(a.images?.length || 0) > 1">
              <img
                v-for="(im, i) in a.images.slice(1, 5)"
                :key="i"
                :src="im.file_path"
                :alt="a.title + ' photo ' + (i + 2)"
                loading="lazy"
                @click="openLightbox('att', a, i + 1)"
                @error="onImgError"
              />
              <span v-if="a.images.length > 5" class="more">
                +{{ a.images.length - 5 }}
              </span>
            </div>
          </div>
        </article>
      </div>

      <div class="pager" v-if="pagedAtt.totalPages > 1">
        <button class="btn sm" @click="attPage--" :disabled="attPage === 1">
          ‹
        </button>
        <span>
          {{ t('common.page') || 'หน้า' }} {{ attPage }} /
          {{ pagedAtt.totalPages }}
        </span>
        <button
          class="btn sm"
          @click="attPage++"
          :disabled="attPage === pagedAtt.totalPages"
        >
          ›
        </button>
      </div>
    </section>

    <!-- Lightbox รวม -->
    <dialog ref="lightbox" class="lightbox" @click.self="closeLightbox">
      <button class="close" @click="closeLightbox">×</button>
      <div class="lb-wrap" v-if="active">
        <img
          :src="active.images[activeIndex].file_path"
          :alt="active.title || active.name"
          @error="onImgError"
        />
        <div class="lb-ctrl">
          <button class="btn" @click="prev" :disabled="activeIndex === 0">
            ‹ {{ t('activities.prev') || 'ก่อนหน้า' }}
          </button>
          <span>{{ activeIndex + 1 }} / {{ active.images.length }}</span>
          <button
            class="btn"
            @click="next"
            :disabled="activeIndex >= active.images.length - 1"
          >
            {{ t('activities.next') || 'ถัดไป' }} ›
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useT } from '@/components/useT'
import { useRouter } from 'vue-router'
const router = useRouter()
const { t, locale, withLang } = useT()
const lang = computed(() => locale.value) // ถ้าจะใช้ต่อที่อื่นได้

/* ===== state: activities (facilities: activity) ===== */
const acts = ref([])
const loadingAct = ref(false)
const errAct = ref('')
const qAct = ref('')
const actPage = ref(1)
const actPerPage = ref(6)

/* ===== state: attractions ===== */
const atts = ref([])
const loadingAtt = ref(false)
const errAtt = ref('')
const qAtt = ref('')
const attPage = ref(1)
const attPerPage = ref(6)

/* ===== lightbox ===== */
const lightbox = ref(null)
const active = ref(null) // item ที่กำลังเปิด
const activeIndex = ref(0)
const activeType = ref('act') // 'act' | 'att'

/* ===== helpers ===== */
function onImgError (e) {
  e.target.src = 'https://placehold.co/800x600?text=No+Image'
}
function cover (item) {
  return item.images?.[0]?.file_path || 'https://placehold.co/800x600?text=No+Image'
}

function paginate (arr, page, perPage) {
  const total = arr.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const p = Math.min(Math.max(1, page), totalPages)
  const start = (p - 1) * perPage
  const end = start + perPage
  return { items: arr.slice(start, end), total, totalPages, page: p }
}

const filteredActs = computed(() => {
  const s = qAct.value.toLowerCase()
  const list = s
    ? acts.value.filter(
        x =>
          (x.title || '').toLowerCase().includes(s) ||
          (x.description || '').toLowerCase().includes(s)
      )
    : acts.value
  return list
})

const filteredAtts = computed(() => {
  const s = qAtt.value.toLowerCase()
  const list = s
    ? atts.value.filter(
        x =>
          (x.title || '').toLowerCase().includes(s) ||
          (x.description || '').toLowerCase().includes(s)
      )
    : atts.value
  return list
})

const pagedAct = computed(() =>
  paginate(filteredActs.value, actPage.value, actPerPage.value)
)
const pagedAtt = computed(() =>
  paginate(filteredAtts.value, attPage.value, attPerPage.value)
)

watch(qAct, () => {
  actPage.value = 1
})
watch(qAtt, () => {
  attPage.value = 1
})

/* ===== load APIs ===== */
async function loadFacilities () {
  loadingAct.value = true
  errAct.value = ''
  try {
    // แนบ lang เข้าไปด้วย และ filter category=activity
    const res = await fetch(
      withLang('/api/facilities/list.php?category=activity'),
      { credentials: 'include' }
    )
    const raw = await res.text()
    let data
    try {
      data = JSON.parse(raw)
    } catch (e) {
      throw new Error(`Facilities not JSON: ${raw.slice(0, 200)}`)
    }
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`)
    }

    // backend เวอร์ชันใหม่จะส่ง title/description ที่เลือกตามภาษาให้แล้ว
    acts.value = (data.items || [])
      .filter(it => it.category === 'activity') // กันเหนียว
      .map(it => ({
        ...it,
        images: (it.images || []).sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        )
      }))
  } catch (e) {
    console.error(e)
    errAct.value = e.message || 'load_failed'
  } finally {
    loadingAct.value = false
  }
}

async function loadAttractions () {
  loadingAtt.value = true
  errAtt.value = ''
  try {
    // แนบ lang เข้าไปด้วย
    const res = await fetch(withLang('/api/attractions/list.php'), {
      credentials: 'include'
    })
    const raw = await res.text()
    let data
    try {
      data = JSON.parse(raw)
    } catch (e) {
      throw new Error(`Attractions not JSON: ${raw.slice(0, 200)}`)
    }
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`)
    }

    // backend attractions/list.php แบบใหม่ก็เลือก title/description ตามภาษาให้แล้ว
    atts.value = (data.items || []).map(it => ({
      ...it,
      images: (it.images || []).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      )
    }))
  } catch (e) {
    console.error(e)
    errAtt.value = e.message || 'load_failed'
  } finally {
    loadingAtt.value = false
  }
}

/* ===== lightbox ===== */
function openLightbox (type, item, idx = 0) {
  if (!item.images || item.images.length === 0) return
  activeType.value = type
  active.value = item
  activeIndex.value = idx
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
// ปุ่มกลับหน้าแรก
function goHome () {
  router.push({ name: 'home' }) // หรือ router.push('/')
}
onMounted(() => {
  loadFacilities()
  loadAttractions()
})

// เปลี่ยนภาษา → โหลดใหม่ทั้งสองชุด
watch(locale, () => {
  loadFacilities()
  loadAttractions()
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
.wrap {
  padding: 18px;
  max-width: 1200px;
  margin: auto;
}
.head {
  margin-bottom: 8px;
}
h1 {
  font-size: 28px;
  margin: 0 0 10px;
}

dialog{
  margin: auto;
}
.block {
  margin-top: 20px;
}
.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.block h2 {
  margin: 0;
  font-size: 22px;
}
.tools {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
.search {
  padding: 10px 12px;
  border: 1px solid var(--ring);
  border-radius: 12px;
  min-width: 220px;
}
.btn {
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 700;
  background: linear-gradient(180deg, #8fc857, #7aa63a);
  color: #fff;
  cursor: pointer;
}
.btn.sm {
  padding: 8px 10px;
  font-weight: 700;
}
.state {
  padding: 14px;
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
.thumb {
  aspect-ratio: 16 / 10;
  background: #eef0f4;
  cursor: zoom-in;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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
.links a {
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}

.imgs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.imgs img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--ring);
  cursor: zoom-in;
}
.more {
  display: grid;
  place-items: center;
  border: 1px dashed var(--ring);
  border-radius: 10px;
  color: var(--muted);
  font-size: 14px;
}

.pager {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  margin-top: 12px;
}

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
</style>
