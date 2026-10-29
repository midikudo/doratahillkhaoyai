<!-- src/views/admin/AdminSlide.vue -->
<template>
    <div class="wrap">
      <header class="head">
        <h1>สไลด์หน้าแรก</h1>
        <div class="tools">
          <label class="upload">
            <input type="file" accept="image/*" @change="onPick" />
            อัปโหลดรูป
          </label>
          <button class="btn ghost" @click="load" :disabled="loading">
            {{ loading ? 'กำลังโหลด…' : 'รีเฟรช' }}
          </button>
          <!-- <button class="btn" :disabled="reordering || items.length===0" @click="saveOrder">
            {{ reordering ? 'กำลังบันทึก…' : 'บันทึกลำดับ' }}
          </button> -->
        </div>
      </header>
  
      <div v-if="error" class="state error">เกิดข้อผิดพลาด: {{ error }}</div>
      <div v-else-if="loading" class="state">กำลังโหลดข้อมูล…</div>
      <div v-else-if="items.length===0" class="state">ยังไม่มีสไลด์</div>
  
      <ul class="grid" v-else>
        <li v-for="(s, i) in items" :key="s.id"
            class="card" draggable="true"
            @dragstart="dragStart(i)" @dragover.prevent
            @drop="drop(i)">
          <div class="thumb" :style="'background-image:url('+s.file_path+');background-position:center;background-size:100%'">
            <!-- <img :src="s.file_path" :alt="s.alt_text || 'slide'" @error="imgPh" /> -->
            <span class="badge">#{{ s.id }}</span>
          </div>
          <div class="meta">
            <div class="row">
              <label>คำอธิบาย (alt)</label>
              <input v-model="s.alt_text" @change="update(s)" placeholder="ข้อความ alt" />
            </div>
            <div class="row inline">
              <label><input type="checkbox" v-model="s.is_active" @change="update(s)" /> แสดง</label>
              <label>ลำดับ
                <input class="w80" type="number" v-model.number="s.sort_order" @change="update(s)" />
              </label>
            </div>
            <div class="actions">
              <button class="ghost" @click="editSrc(s)">แก้พาธ</button>
              <button class="danger" @click="remove(s)" :disabled="removingId===s.id">
                ลบ
              </button>
            </div>
          </div>
        </li>
      </ul>
  
      <!-- โมดัลเพิ่มจาก URL (หรือแก้พาธ) -->
      <dialog ref="dlg" class="modal" @click.self="closeDlg">
        <form class="panel" @submit.prevent="saveSrc">
          <header>
            <h3>{{ editing ? 'แก้พาธรูป' : 'เพิ่มสไลด์ (จากพาธ/URL)' }}</h3>
            <button type="button" class="x" @click="closeDlg">×</button>
          </header>
          <label class="row">
            <span>file_path (เช่น /uploads/slides/xxx.jpg หรือ URL)</span>
            <input v-model.trim="srcInput" required placeholder="/uploads/slides/xxx.jpg" />
          </label>
          <label class="row">
            <span>alt_text</span>
            <input v-model.trim="altInput" placeholder="คำอธิบายรูป" />
          </label>
          <footer>
            <button class="btn" :disabled="saving">{{ saving ? 'กำลังบันทึก…' : 'บันทึก' }}</button>
            <button type="button" class="ghost" @click="closeDlg">ยกเลิก</button>
          </footer>
        </form>
      </dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  
  /* ============ auth helper ============ */
  function ensureAuthHeader() {
    const token = localStorage.getItem('adm_token')
    if (!token) {
      const redirect = encodeURIComponent(location.pathname + location.search)
      window.location.assign(`/admin/login?redirect=${redirect}`)
      throw new Error('unauthorized')
    }
    return { Authorization: `Bearer ${token}` }
  }
  
  /* ============ state ============ */
  const items = ref([])          // [{id, file_path, alt_text, sort_order, is_active}, ...]
  const loading = ref(true)
  const error = ref('')
  const removingId = ref(0)
  
  const draggingIdx = ref(-1)
  const reordering = ref(false)
  
  /* ============ modal state ============ */
  const dlg = ref()
  const saving = ref(false)
  const editing = ref(null) // slide object when editing path, else null when create
  const srcInput = ref('')
  const altInput = ref('')
  
  /* ============ fetchers ============ */
  async function load() {
    loading.value = true
    error.value = ''
    try {
      const headers = { ...ensureAuthHeader() }
      const r = await fetch('/api/admin/slides', { headers })
      const data = await r.json()
      if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`)
      items.value = (data.items || []).map(x => ({
        ...x,
        is_active: !!x.is_active,
        sort_order: x.sort_order ?? 0
      }))
    } catch (e) {
      console.error(e); error.value = e.message || 'server_error'
    } finally {
      loading.value = false
    }
  }
  
  async function create(file_path, alt_text='') {
    const headers = {
      'Content-Type': 'application/json',
      ...ensureAuthHeader()
    }
    const body = JSON.stringify({ file_path, alt_text })
    const r = await fetch('/api/admin/slides', { method: 'POST', headers, body })
    const data = await r.json()
    if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`)
    return data.id
  }
  
  async function update(s) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...ensureAuthHeader()
      }
      const payload = {
        alt_text: s.alt_text,
        sort_order: s.sort_order|0,
        is_active: !!s.is_active
      }
      const r = await fetch(`/api/admin/slides/${s.id}`, {
        method: 'PUT', headers, body: JSON.stringify(payload)
      })
      const data = await r.json()
      if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`)
    } catch (e) {
      alert('อัปเดตไม่สำเร็จ: ' + (e.message || e))
    }
  }
  
  async function remove(s) {
    if (!confirm(`ลบสไลด์ #${s.id} ?`)) return
    removingId.value = s.id
    try {
      const headers = { ...ensureAuthHeader() }
      const r = await fetch(`/api/admin/slides/${s.id}`, { method: 'DELETE', headers })
      const data = await r.json()
      if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`)
      items.value = items.value.filter(x => x.id !== s.id)
    } catch (e) {
      alert('ลบไม่สำเร็จ: ' + (e.message || e))
    } finally {
      removingId.value = 0
    }
  }
  
  /* ============ reorder ============ */
  function dragStart(i){ draggingIdx.value = i }
  function drop(i){
    if (draggingIdx.value === -1 || draggingIdx.value === i) return
    const arr = items.value.slice()
    const [m] = arr.splice(draggingIdx.value, 1)
    arr.splice(i, 0, m)
    items.value = arr
    draggingIdx.value = -1
  }
  async function saveOrder(){
    reordering.value = true
    try{
      const headers = {
        'Content-Type': 'application/json',
        ...ensureAuthHeader()
      }
      const orders = items.value.map((x, i) => ({ id: x.id, sort_order: i+1 }))
      const r = await fetch('/api/admin/slides/reorder', {
        method: 'PATCH', headers, body: JSON.stringify({ orders })
      })
      const data = await r.json()
      if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`)
      // sync local
      items.value = items.value.map((x, i) => ({ ...x, sort_order: i+1 }))
    }catch(e){
      alert('บันทึกลำดับไม่สำเร็จ: ' + (e.message||e))
    }finally{
      reordering.value = false
    }
  }
  
  /* ============ upload ============ */
  async function onPick(e){
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try{
      const headers = { ...ensureAuthHeader() }
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/admin/slides/upload', { method:'POST', headers, body: fd })
      const data = await r.json()
      if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`)
      // ได้ path แล้วสร้างสไลด์
      const id = await create(data.path, '')
      await load()
      // highlight ตัวที่เพิ่ม
      const just = items.value.find(x => x.id === id)
      if (just) window.scrollTo({ top: document.querySelector(`[data-id="${id}"]`)?.offsetTop ?? 0, behavior: 'smooth' })
    }catch(err){
      alert('อัปโหลด/สร้างไม่สำเร็จ: ' + (err.message || err))
    }
  }
  
  /* ============ edit / create via URL/path ============ */
  function editSrc(s){
    editing.value = s
    srcInput.value = s.file_path
    altInput.value = s.alt_text || ''
    dlg.value?.showModal?.()
  }
  function closeDlg(){ dlg.value?.close?.(); srcInput.value=''; altInput.value=''; editing.value=null }
  async function saveSrc(){
    saving.value = true
    try{
      if (editing.value) {
        // update path (และ alt)
        const headers = {
          'Content-Type':'application/json',
          ...ensureAuthHeader()
        }
        const r = await fetch(`/api/admin/slides/${editing.value.id}`, {
          method:'PUT',
          headers,
          body: JSON.stringify({ file_path: srcInput.value, alt_text: altInput.value })
        })
        const data = await r.json()
        if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`)
      } else {
        await create(srcInput.value, altInput.value)
      }
      closeDlg()
      await load()
    }catch(e){
      alert('บันทึกไม่สำเร็จ: ' + (e.message||e))
    }finally{ saving.value=false }
  }
  
  /* ============ utils ============ */
  function imgPh(e){ e.target.src = 'https://placehold.co/800x600?text=No+Image' }
  
  onMounted(load)
  </script>
  
  <style scoped>
  .wrap{ max-width: 1100px; margin:auto; padding:16px; }
  .head{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
  .tools{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  
  .btn{ border:0; border-radius:10px; padding:10px 14px; font-weight:700; background:linear-gradient(180deg,#8fc857,#7aa63a); color:#fff; cursor:pointer; }
  .btn.ghost{ background:#fff; border:1px solid #d1d5db; color:#111; }
  
  .upload{ display:inline-grid; place-items:center; border:1px dashed #cbd5e1; padding:10px 12px; border-radius:10px; cursor:pointer; background:#fff; }
  .upload input{ display:none; }
  
  .state{ padding:14px; border:1px dashed #e5e7eb; border-radius:12px; }
  .state.error{ color:#b91c1c; border-color:#fecaca; background:#fff1f2; }
  
  .grid{ display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; }
  @media (max-width: 980px){ .grid{ grid-template-columns: repeat(2, 1fr);} }
  @media (max-width: 640px){ .grid{ grid-template-columns: 1fr;} }
  
  .card{ background:#fff; border:1px solid #e5e7eb; border-radius:14px; overflow:hidden; display:flex; flex-direction:column; }
  .thumb{ position:relative; aspect-ratio: 16/10; background:#f3f4f6; }
  .thumb img{ width:100%; height:100%; object-fit:cover; display:block; }
  .badge{ position:absolute; left:8px; top:8px; background:rgba(0,0,0,.6); color:#fff; font-size:12px; padding:2px 6px; border-radius:6px; }
  
  .meta{ padding:10px; display:grid; gap:8px; }
  .row{ display:grid; gap:6px; }
  .row.inline{ grid-auto-flow: column; grid-auto-columns: 1fr; align-items:center; gap:12px; }
  input[type="text"], input[type="number"], input:not([type]){ border:1px solid #e5e7eb; border-radius:10px; padding:8px 10px; }
  .w80{ width:80px; }
  .actions{ display:flex; gap:8px; justify-content:flex-end; }
  .ghost{ background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:8px 10px; cursor:pointer; }
  .danger{ background:#ef4444; color:#fff; border:0; border-radius:10px; padding:8px 10px; cursor:pointer; }
  
  /* modal */
  .modal::backdrop{ background: rgba(0,0,0,.5); }
  .modal{ width:min(95vw, 560px); border:0; border-radius:14px; padding:0; overflow:hidden; }
  .panel{ background:#fff; display:grid; gap:12px; padding:14px; }
  .modal header{ display:flex; align-items:center; justify-content:space-between; }
  .modal .x{ background:transparent; border:0; font-size:24px; cursor:pointer; }
  .modal .row{ display:grid; gap:6px; }
  .modal footer{ display:flex; gap:10px; justify-content:flex-end; }
  </style>
  