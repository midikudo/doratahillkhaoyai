<!-- src/views/Reviews.vue -->
<template>
  <div class="wrap">
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
        <h1>{{ t('reviews.title') || 'รีวิวจากลูกค้า' }}</h1>
      </div>
    

    <div v-if="loading" class="state">
      {{ t('common.loading') || 'กำลังโหลด…' }}
    </div>

    <div v-else-if="items.length === 0" class="state">
      {{ t('reviews.empty') || 'ยังไม่มีรีวิว' }}
    </div>

    <section class="grid" v-else>
      <article v-for="rv in items" :key="rv.id" class="card">
        <div class="top">
          <strong>
            {{
              rv.author_name ||
              t('reviews.anonymous') ||
              'ผู้ใช้ไม่ระบุชื่อ'
            }}
          </strong>

          <span class="muted">
            ⭐ {{ rv.rating }}/5
          </span>

          <span class="muted" v-if="rv.visited_at">
            ·
            {{
              t('reviews.stayDate', { date: rv.visited_at }) ||
              ('เข้าพัก ' + rv.visited_at)
            }}
          </span>
        </div>

        <div class="thumb" v-if="rv.images?.length" @click="open(rv, 0)">
          <img
            :src="rv.images[0].file_path"
            :alt="rv.author_name || 'review image'"
            @error="onErr"
          />
        </div>

        <!-- เนื้อหารีวิวตามภาษา -->
        <p
          v-if="lang === 'th' && (rv.content_th || rv.content)"
          class="desc"
        >
          {{ rv.content_th || rv.content }}
        </p>
        <p
          v-else-if="lang === 'en' && (rv.content_en || rv.content)"
          class="desc"
        >
          {{ rv.content_en || rv.content }}
        </p>

        <div class="mini" v-if="(rv.images?.length || 0) > 1">
          <img
            v-for="(im, i) in rv.images.slice(1, 5)"
            :key="i"
            :src="im.file_path"
            @click="open(rv, i + 1)"
            @error="onErr"
          />
          <span v-if="rv.images.length > 5" class="more">
            +{{ rv.images.length - 5 }}
          </span>
        </div>
      </article>
    </section>

    <!-- Lightbox -->
    <dialog ref="lb" class="lightbox" @click.self="close">
      <button class="close" @click="close">×</button>
      <img
        v-if="active"
        :src="active.images[idx].file_path"
        @error="onErr"
      />
      <div class="ctrl" v-if="active">
        <button class="btn" @click="prev" :disabled="idx === 0">‹</button>
        <span>{{ idx + 1 }} / {{ active.images.length }}</span>
        <button
          class="btn"
          @click="next"
          :disabled="idx >= active.images.length - 1"
        >
          ›
        </button>
      </div>
    </dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useT } from '@/components/useT'
import { useRouter } from 'vue-router'
const router = useRouter()
const { t, locale, withLang } = useT()
const lang = computed(() => locale.value)

const loading = ref(false)
const items = ref([])

const ph = 'https://placehold.co/800x600?text=No+Image'
function onErr (e) {
  e.target.src = ph
}

async function load () {
  loading.value = true
  try {
    // แนบ lang เผื่อ backend รองรับในอนาคต (ตอนนี้ก็ไม่เสียหายอะไร)
    const res = await fetch(withLang('/api/reviews/list.php'), {
      credentials: 'include'
    })
    const raw = await res.text()
    const data = JSON.parse(raw)

    items.value = (data.items || []).map(x => ({
      ...x,
      images: (x.images || []).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      )
    }))
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
function goHome () {
  router.push({ name: 'home' }) // หรือ router.push('/')
}
// lightbox
const lb = ref(null)
const active = ref(null)
const idx = ref(0)

function open (rv, i = 0) {
  active.value = rv
  idx.value = i
  lb.value?.showModal?.()
}
function close () {
  lb.value?.close?.()
  active.value = null
  idx.value = 0
}
function prev () {
  if (idx.value > 0) idx.value--
}
function next () {
  if (active.value && idx.value < active.value.images.length - 1) idx.value++
}
</script>

<style scoped>
.wrap {
  max-width: 1000px;
  margin: auto;
  padding: 18px;
}
.state {
  padding: 14px;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  color: #6b7280;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 12px;
}
@media (max-width: 700px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 12px;
}
.top {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.muted {
  color: #6b7280;
  font-size: 13px;
}
.thumb {
  aspect-ratio: 16/10;
  background: #f3f4f6;
  border-radius: 10px;
  overflow: hidden;
  cursor: zoom-in;
  margin-top: 6px;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.desc {
  margin: 8px 0 6px;
}
.mini {
  display: flex;
  gap: 6px;
}
.mini img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  cursor: zoom-in;
}
.more {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
}

.lightbox::backdrop {
  background: rgba(0, 0, 0, 0.6);
}
.lightbox {
  border: 0;
  border-radius: 12px;
  padding: 8px;
  background: #000;
  width: min(96vw, 1100px);
}
.lightbox img {
  max-height: 76vh;
  width: 100%;
  object-fit: contain;
}
.ctrl {
  color: #fff;
  display: flex;
  align-items: center;
  justify-content:space-between;
  margin-top: 6px;
}
.close {
  position: absolute;
  top: 6px;
  right: 10px;
  border: 0;
  background: #8fa34c;
  color: #fff;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  font-size: 20px;
}
.btn {
  background: #7aa63a;
  border: 0;
  color: #fff;
  padding: 6px 10px;
  border-radius: 8px;
}
dialog{
  margin: auto;
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
