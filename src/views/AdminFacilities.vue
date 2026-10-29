<template>
  <div class="card">
    <h2>หมวด: {{ label }}</h2>

    <!-- ฟอร์มสร้าง/แก้ไข -->
    <form @submit.prevent="submit" enctype="multipart/form-data" class="f">
      <!-- แท็บภาษา -->
      <div class="lang-tabs">
        <button
          type="button"
          :class="{ active: langTab === 'th' }"
          @click="langTab = 'th'"
        >
          ไทย
        </button>
        <button
          type="button"
          :class="{ active: langTab === 'en' }"
          @click="langTab = 'en'"
        >
          English
        </button>
      </div>

      <!-- ไทย -->
      <section v-show="langTab === 'th'" class="grid">
        <div class="field col-2">
          <span>ชื่อรายการ (TH) *</span>
          <input
            v-model="form.title_th"
            required
            placeholder="เช่น ห้องโถงใหญ่ / เตาปิ้งย่าง"
          />
        </div>
        <div class="field col-2">
          <span>รายละเอียด (TH)</span>
          <textarea
            v-model="form.description_th"
            rows="3"
            placeholder="คำอธิบายเพิ่มเติมภาษาไทย"
          ></textarea>
        </div>
      </section>

      <!-- English -->
      <section v-show="langTab === 'en'" class="grid">
        <div class="field col-2">
          <span>Title (EN)</span>
          <input
            v-model="form.title_en"
            placeholder="e.g. Big living room / BBQ area"
          />
        </div>
        <div class="field col-2">
          <span>Description (EN)</span>
          <textarea
            v-model="form.description_en"
            rows="3"
            placeholder="Description in English"
          ></textarea>
        </div>
      </section>

      <!-- รูปเดิม (เวลาแก้ไข) -->
      <div v-if="editingId && existingImages.length" class="old-wrap">
        <p class="muted">รูปเดิม (คลิก ✕ เพื่อลบรูปนั้น)</p>
        <div class="grid">
          <div
            v-for="img in existingImages"
            :key="img.id"
            class="old-thumb"
          >
            <img :src="img.file_path" @error="onImgErr" />
            <button
              type="button"
              class="x"
              @click="removeOld(img.id)"
              title="ลบรูปนี้ออก"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <!-- อัปโหลดรูปใหม่ -->
      <section class="media">
        <label class="field col-2">
          <span>รูปภาพใหม่ (หลายรูปได้)</span>
          <input type="file" multiple accept="image/*" @change="pick" />
        </label>

        <div v-if="previews.length" class="grid">
          <div v-for="(p, i) in previews" :key="p" class="new-thumb">
            <img :src="p" @error="onImgErr" />
            <button type="button" class="x" @click="removeNew(i)">×</button>
          </div>
        </div>
        <div class="hint">
          * ระบบจะบีบอัดเป็น .webp ~≤ 90KB ต่อภาพให้อัตโนมัติ
        </div>
      </section>

      <!-- ปุ่มบันทึก -->
      <div class="actions-form">
        <button class="btn" :disabled="submitting">
          {{
            submitting
              ? "กำลังบันทึก…"
              : editingId
                ? "บันทึกการแก้ไข"
                : "เพิ่ม"
          }}
        </button>

        <button
          v-if="editingId"
          type="button"
          class="ghost"
          @click="resetForm"
        >
          ยกเลิกแก้ไข / กลับโหมดเพิ่มใหม่
        </button>
      </div>
    </form>

    <!-- รายการ -->
    <h3>รายการล่าสุด</h3>
    <div v-if="items.length === 0" class="muted">ยังไม่มีข้อมูล</div>
    <div class="list">
      <article v-for="it in items" :key="it.id" class="it">
        <img
          v-if="it.images?.[0]"
          :src="it.images[0].file_path"
          @error="onImgErr"
        />
        <div class="meta">
          <h4>{{ it.title_th || it.title }}</h4>
          <p class="muted">
            {{ it.description_th || it.description }}
          </p>
          <div class="actions">
            <button class="secondary" @click="startEdit(it)">แก้ไข</button>
            <button class="danger" @click="del(it.id)">ลบ</button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed,watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const cat = computed(() => route.params.category) // hall|kitchen|activity|ambience

const labels = {
  hall: 'ห้องโถง / TV / โอเกะ',
  kitchen: 'สิ่งอำนวยความสะดวก',
  activity: 'กิจกรรมในบ้าน',
  ambience: 'บทความ / เรื่องราวดีๆ จากโดราต้าฮิลล์'
}
const label = computed(() => labels[cat.value] ?? cat.value)

// แท็บภาษา
const langTab = ref('th')

// form
const form = ref({
  title_th: '',
  title_en: '',
  description_th: '',
  description_en: ''
})

// รูปใหม่
const files = ref([])
const previews = ref([])

// แก้ไข
const editingId = ref(null)
const existingImages = ref([])
const deleteIds = ref([])

const submitting = ref(false)
const items = ref([])

// ===== auth helper =====
function getAdminToken () {
  return localStorage.getItem('adm_token') || ''
}
function ensureAuthOrRedirect () {
  const t = getAdminToken()
  if (!t) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    window.location.assign(`/admin/login?redirect=${redirect}`)
    throw new Error('missing_token')
  }
  return t
}

// ===== รูป =====
function pick (e) {
  files.value = Array.from(e.target.files || [])
  previews.value.forEach(u => URL.revokeObjectURL(u))
  previews.value = files.value.map(f => URL.createObjectURL(f))
}

function removeNew (i) {
  const u = previews.value[i]
  if (u) URL.revokeObjectURL(u)
  previews.value.splice(i, 1)
  files.value.splice(i, 1)
}

function removeOld (imgId) {
  if (!deleteIds.value.includes(imgId)) deleteIds.value.push(imgId)
  existingImages.value = existingImages.value.filter(im => im.id !== imgId)
}

function onImgErr (e) {
  e.target.src = 'https://placehold.co/240x160?text=Image'
}

// ===== โหลดรายการ =====
async function load () {
  ensureAuthOrRedirect()
  const r = await fetch(
    `/api/facilities/list.php?category=${encodeURIComponent(cat.value)}`
  )
  const d = await r.json()
  items.value = d.ok
    ? (d.items || []).map(it => ({
        ...it,
        images: (it.images || []).sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        )
      }))
    : []
}

// ===== โหมดแก้ไข =====
function startEdit (it) {
  editingId.value = it.id
  form.value.title_th = it.title_th || it.title || ''
  form.value.title_en = it.title_en || ''
  form.value.description_th = it.description_th || it.description || ''
  form.value.description_en = it.description_en || ''

  existingImages.value = [...(it.images || [])]
  deleteIds.value = []

  files.value = []
  previews.value.forEach(u => URL.revokeObjectURL(u))
  previews.value = []

  langTab.value = 'th'
}

function resetForm () {
  editingId.value = null
  form.value = {
    title_th: '',
    title_en: '',
    description_th: '',
    description_en: ''
  }
  existingImages.value = []
  deleteIds.value = []

  files.value = []
  previews.value.forEach(u => URL.revokeObjectURL(u))
  previews.value = []
  langTab.value = 'th'
}

// ===== submit (สร้าง/แก้ไข) =====
async function submit () {
  submitting.value = true
  try {
    const token = ensureAuthOrRedirect()
    const fd = new FormData()
    fd.append('category', cat.value)
    fd.append('title_th', form.value.title_th)
    fd.append('title_en', form.value.title_en || '')
    fd.append('description_th', form.value.description_th || '')
    fd.append('description_en', form.value.description_en || '')

    files.value.forEach(f => fd.append('images[]', f))

    let url = ''
    if (editingId.value) {
      fd.append('id', String(editingId.value))
      if (deleteIds.value.length) {
        fd.append('delete_ids', JSON.stringify(deleteIds.value))
      }
      url = '/api/facilities/update.php'
    } else {
      url = '/api/facilities/create.php'
    }

    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd
    })
    const d = await r.json()
    if (!r.ok || !d?.ok) {
      throw new Error(d?.error || `HTTP ${r.status}`)
    }

    alert('บันทึกสำเร็จ')
    resetForm()
    await load()
  } catch (e) {
    console.error(e)
    alert(e.message || 'เกิดข้อผิดพลาดในการบันทึก')
  } finally {
    submitting.value = false
  }
}

// ===== ลบทั้ง record =====
async function del (id) {
  if (!confirm('ยืนยันการลบ?')) return
  ensureAuthOrRedirect()
  await fetch('/api/facilities/delete.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  })
  if (editingId.value === id) resetForm()
  await load()
}

onMounted(load)
watch(cat, () => {
  resetForm()      // ถ้าอยากเคลียร์ฟอร์มตอนเปลี่ยนหมวด
  load()
})
</script>

<style scoped>
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 10px 20px rgba(16, 24, 40, 0.06);
}
.f {
  display: grid;
  gap: 10px;
  margin-bottom: 14px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.field {
  display: grid;
  gap: 6px;
}
.field.col-2 {
  grid-column: span 2;
}
input,
textarea {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-size: 16px;
}
.media {
  margin-top: 6px;
  display: grid;
  gap: 8px;
}
.lang-tabs {
  display: inline-flex;
  gap: 8px;
  margin-bottom: 4px;
}
.lang-tabs button {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 14px;
  cursor: pointer;
}
.lang-tabs button.active {
  background: #111827;
  color: #fff;
  border-color: #111827;
}
.btn {
  background: linear-gradient(180deg, #8fc857, #7aa63a);
  color: #fff;
  border: 0;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}
.ghost {
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
}
.actions-form {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}
.muted {
  color: #6b7280;
}
.grid img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}
.old-thumb,
.new-thumb {
  position: relative;
}
.x {
  position: absolute;
  top: 4px;
  right: 6px;
  border: 0;
  background: #0008;
  color: #fff;
  width: 22px;
  height: 22px;
  line-height: 22px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 14px;
}
.hint {
  color: #6b7280;
  font-size: 12px;
}

.list {
  display: grid;
  gap: 12px;
}
.it {
  display: flex;
  gap: 12px;
}
.it img {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.meta {
  flex: 1;
}
.actions {
  margin-top: 6px;
  display: flex;
  gap: 8px;
}
.danger {
  background: #ef4444;
  color: #fff;
  border: 0;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}
.secondary {
  background: #f3f4f6;
  color: #111827;
  border: 0;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}
.old-wrap {
  margin-top: 4px;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .field.col-2 {
    grid-column: auto;
  }
}
</style>
