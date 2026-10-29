<!-- สิ่งอำนวยความสะดวก -->
 <!-- src/views/Facilities.vue -->
<template>
    <div class="wrap">
      <header class="head">
        <div>
          <h1>สิ่งอำนวยความสะดวก</h1>
          <p class="muted">สระว่ายน้ำ โต๊ะพูล ห้องคาราโอเกะ ครัวปิ้งย่าง และบรรยากาศรอบบ้าน</p>
        </div>
  
        <!-- <div class="filters">
          <button
            v-for="t in tabs" :key="t.key"
            class="chip" :class="{ active: category===t.key }"
            @click="setCategory(t.key)"
          >
            {{ t.label }}
          </button>
        </div> -->
      </header>
  
      <!-- states -->
      <div v-if="loading" class="state">กำลังโหลดข้อมูล…</div>
      <div v-else-if="error" class="state error">เกิดข้อผิดพลาด: {{ error }}</div>
      <div v-else-if="items.length===0" class="state muted">ยังไม่มีรายการในหมวดนี้</div>
  
      <!-- grid -->
      <section class="grid" v-else>
        <article v-for="f in items" :key="f.id" class="card">
          <section class="collage5">
            <!-- ซ้าย -->
            <div class="col left">
              <figure class="ph a">
                <img :src="imgAt(f,0)" @error="onErr" loading="eager" :alt="f.title + ' 1'" />
              </figure>
              <figure class="ph c" v-if="has(f,2)">
                <img :src="imgAt(f,2)" @error="onErr" loading="lazy" :alt="f.title + ' 3'" />
              </figure>
            </div>
            <!-- ขวา -->
            <div class="col right">
              <figure class="ph b" v-if="has(f,1)">
                <img :src="imgAt(f,1)" @error="onErr" loading="lazy" :alt="f.title + ' 2'" />
              </figure>
              <figure class="ph d" v-if="has(f,3)">
                <img :src="imgAt(f,3)" @error="onErr" loading="lazy" :alt="f.title + ' 4'" />
              </figure>
              <figure class="ph e" v-if="has(f,4)">
                <img :src="imgAt(f,4)" @error="onErr" loading="lazy" :alt="f.title + ' 5'" />
              </figure>
            </div>
          </section>
  
          <div class="meta">
            <h3 class="title">{{ f.title }}</h3>
            <p class="desc" style="pointer-events: none;
    -webkit-user-modify: read-write-plaintext-only;
    white-space: pre-line;"  v-if="f.description">{{ f.description }}</p>
            <button class="link" @click="openGallery(f)">ดูรูปทั้งหมด ({{ f.images.length }})</button>
          </div>
        </article>
      </section>
  
      <!-- Lightbox -->
      <dialog ref="lightbox" class="lightbox" @click.self="closeLightbox">
        <button class="close" @click="closeLightbox">×</button>
        <div class="lb-wrap" v-if="active">
          <img :src="active.images[activeIndex].file_path" :alt="active.title" @error="onErr"/>
          <div class="lb-ctrl">
            <button class="btn" @click="prev" :disabled="activeIndex===0">‹ ก่อนหน้า</button>
            <span>{{ activeIndex + 1 }} / {{ active.images.length }}</span>
            <button class="btn" @click="next" :disabled="activeIndex >= active.images.length - 1">ถัดไป ›</button>
          </div>
        </div>
      </dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue'
  
  const tabs = [
    { key: 'all',      label: 'ทั้งหมด' },
    { key: 'hall',     label: 'ห้องโถง' },
    { key: 'kitchen',  label: 'ครัว' },
    { key: 'activity', label: 'กิจกรรม' },
    { key: 'ambience', label: 'บรรยากาศ' },
  ]
  
  const category = ref('kitchen')
  const items = ref([])
  const loading = ref(true)
  const error = ref('')
  
  const ph = 'https://placehold.co/800x600?text=No+Image'
  const onErr = (e) => { e.target.src = ph }
  
  function imgAt(f, i) {
    return f?.images?.[i]?.file_path || ph
  }
  function has(f, i) {
    return Array.isArray(f?.images) && f.images[i] && f.images[i].file_path
  }
  
  async function load() {
    loading.value = true
    error.value = ''
    try {
      const q = category.value === 'all' ? '' : `?category=${category.value}`
      const r = await fetch(`/api/facilities/list.php${q}`)
      const raw = await r.text()
      const data = JSON.parse(raw)
      const arr = (data.items || []).map(x => ({
        ...x,
        images: (x.images || []).sort((a,b)=>(a.sort_order ?? 0) - (b.sort_order ?? 0))
      }))
      items.value = arr
    } catch (e) {
      console.error(e)
      error.value = e.message || 'server_error'
    } finally {
      loading.value = false
    }
  }
  function setCategory(key){ category.value = key }
  
  watch(category, load)
  onMounted(load)
  
  /* ===== Lightbox ===== */
  const lightbox = ref()
  const active = ref(null)
  const activeIndex = ref(0)
  function openGallery(f, index=0){
    if (!f.images?.length) return
    active.value = f
    activeIndex.value = index
    lightbox.value?.showModal?.()
  }
  function closeLightbox(){
    lightbox.value?.close?.()
    active.value = null
    activeIndex.value = 0
  }
  function prev(){ if (activeIndex.value > 0) activeIndex.value-- }
  function next(){ if (active.value && activeIndex.value < active.value.images.length - 1) activeIndex.value++ }
  </script>
  
  <style scoped>
  :root{
    --bg:#f7f8fb; --card:#fff; --text:#1a1d22; --muted:#6b7280;
    --ring:#e5e7eb; --accent:#7aa63a; --shadow:0 14px 30px rgba(16,24,40,.08);
    --radius:18px;
  }
  .wrap{ max-width:1200px; margin:auto; padding:12px 16px 28px;top:120px }
  .head{ display:flex; align-items:flex-end; justify-content:space-between; gap:12px; flex-wrap:wrap; margin:8px 0 10px; }
  h1{ margin:0; font-size:28px; }
  .muted{ color:var(--muted); margin:2px 0 0; }
  
  .filters{ display:flex; gap:8px; flex-wrap:wrap; }
  .chip{
    border:1px solid var(--ring); background:#fff; border-radius:999px; padding:8px 12px; cursor:pointer;
  }
  .chip.active{ border-color:transparent; background:linear-gradient(180deg,#8fc857,#7aa63a); color:#fff; }
  
  .state{ padding:14px; border:1px dashed var(--ring); border-radius:12px; }
  .state.error{ color:#b91c1c; border-color:#fecaca; background:#fff1f2; }
  
  .grid{ display:grid; grid-template-columns: repeat(3, 1fr); gap:14px; }
  @media (max-width: 980px){ .grid{ grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px){ .grid{ grid-template-columns: 1fr; } }
  
  .card{ background:#fff; border:1px solid var(--ring); border-radius:16px; overflow:hidden; box-shadow:var(--shadow); display:flex; flex-direction:column; }
  .meta{ padding:12px; }
  .title{ margin:2px 0 6px; font-size:18px; }
  .desc{ color:var(--muted); margin:0 0 8px; }
  .link{ color:#2563eb; background:transparent; border:0; padding:0; cursor:pointer; font-weight:700; }
  
  /* ----- Collage 5 (อิงสัดส่วนที่คุยกันก่อนหน้า) ----- */
  .collage5{ display:grid; grid-template-columns: 1fr 1fr; gap:12px; padding:10px; }
  .collage5 .col{ display:grid; gap:12px; }
  .collage5 .left{ grid-template-rows:auto auto; }
  .collage5 .right{ grid-template-rows:auto auto auto; }
  .collage5 figure{ margin:0; border-radius:14px; overflow:hidden; background:#eef1f4; border:1px solid var(--ring); }
  .collage5 img{ width:100%; height:100%; object-fit:cover; display:block; }
  
  /* อัตราส่วน — ถ้ารูปน้อยกว่า 4 จะดูกว้างขึ้น */
  .collage5 .a, .collage5 .b, .collage5 .d, .collage5 .e{ aspect-ratio: 4 / 3; }
  .collage5 .c{ aspect-ratio: 3 / 4; }
  
  /* ----- Lightbox ----- */
  .lightbox::backdrop{ background:rgba(0,0,0,.6); }
  .lightbox{ width:min(96vw,1100px); border:0; border-radius:14px; padding:0; overflow:hidden; background:#000; }
  .lb-wrap{ display:grid; gap:8px; padding:8px; }
  .lightbox img{ width:100%; height:auto; max-height:76vh; object-fit:contain; background:#000; }
  .lb-ctrl{ display:flex; align-items:center; justify-content:space-between; gap:10px; color:#fff; }
  .btn{ border:0; border-radius:10px; padding:8px 12px; background:linear-gradient(180deg,#8fc857,#7aa63a); color:#fff; cursor:pointer; }
  .close{ position:absolute; top:6px; right:10px; border:0; background:transparent; color:#fff; font-size:28px; cursor:pointer; }
  </style>
  