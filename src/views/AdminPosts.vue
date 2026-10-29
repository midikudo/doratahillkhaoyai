<!-- src/views/AdminPosts.vue -->
<template>
    <div class="wrap">
      <header class="head">
        <h1>บทความ / เรื่องราวดี ๆ</h1>
        <div class="tools">
          <input v-model.trim="q" class="search" placeholder="ค้นหา…" @keyup.enter="load" />
          <select v-model="status" class="sel" @change="load">
            <option value="">สถานะทั้งหมด</option>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
          <button class="btn" @click="load" :disabled="loading">{{ loading?'กำลังโหลด…':'รีเฟรช' }}</button>
          <button class="btn green" @click="openCreate">+ เขียนบทความ</button>
        </div>
      </header>
  
      <!-- states -->
      <div v-if="error" class="state error">เกิดข้อผิดพลาด: {{ error }}</div>
      <div v-else-if="loading" class="state">กำลังโหลดข้อมูล…</div>
      <div v-else-if="items.length===0" class="state">ยังไม่มีบทความ</div>
  
      <!-- table -->
      <table v-else class="tbl">
        <thead>
          <tr>
            <th style="width:72px">ปก</th>
            <th>ชื่อเรื่อง (TH / EN)</th>
            <th>Slug</th>
            <th>สถานะ</th>
            <th>เผยแพร่</th>
            <th style="width:180px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in items" :key="p.id">
            <td>
              <img :src="p.cover_path || placeholder" @error="imgErr" class="thumb" />
            </td>
            <td>
              <div class="title">{{ p.title_th || '—' }}</div>
              <div class="muted">{{ p.title_en || '—' }}</div>
            </td>
            <td class="mono">{{ p.slug }}</td>
            <td><span :class="['badge', p.status]">{{ p.status }}</span></td>
            <td class="muted mono">{{ p.publish_at || '—' }}</td>
            <td class="actions">
              <button class="ghost" @click="openEdit(p.id)">แก้ไข</button>
              <button class="danger" @click="delPost(p.id)">ลบ</button>
            </td>
          </tr>
        </tbody>
      </table>
  
      <!-- drawer / modal form -->
      <dialog ref="dlg" class="drawer" @click.self="closeForm">
        <form class="panel" @submit.prevent="save">
          <header class="drawer-head">
            <strong>{{ form.id ? 'แก้ไขบทความ' : 'เขียนบทความ' }}</strong>
            <button type="button" class="x" @click="closeForm">×</button>
          </header>
  
          <section class="grid2">
            <label class="row">
              <span>Slug (URL)*</span>
              <input v-model.trim="form.slug" required placeholder="เช่น how-to-travel-khaoyai" />
            </label>
            <label class="row">
              <span>สถานะ</span>
              <select v-model="form.status">
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </label>
  
            <label class="row">
              <span>วันที่เผยแพร่ (option)</span>
              <input v-model="form.publish_at" type="datetime-local" />
            </label>
            <label class="row">
              <span>แท็ก (คั่นด้วย ,)</span>
              <input v-model.trim="form.tags" placeholder="travel,khaoyai,poolvilla" />
            </label>
          </section>
  
          <details open class="block">
            <summary>ภาษาไทย (TH) *</summary>
            <div class="grid1">
              <label class="row">
                <span>ชื่อเรื่อง *</span>
                <input v-model.trim="form.title_th" required />
              </label>
              <label class="row">
                <span>คำนำ (excerpt)</span>
                <textarea v-model.trim="form.excerpt_th" rows="2" />
              </label>
              <label class="row">
                <span>เนื้อหา</span>
                <textarea v-model="form.body_th" rows="6" placeholder="รองรับ HTML/Markdown" />
              </label>
            </div>
          </details>
  
          <details class="block">
            <summary>English (EN)</summary>
            <div class="grid1">
              <label class="row"><span>Title</span><input v-model.trim="form.title_en" /></label>
              <label class="row"><span>Excerpt</span><textarea v-model.trim="form.excerpt_en" rows="2" /></label>
              <label class="row"><span>Body</span><textarea v-model="form.body_en" rows="6" /></label>
            </div>
          </details>
  
          <details class="block">
            <summary>SEO</summary>
            <div class="grid2">
              <label class="row"><span>Meta Title (TH)</span><input v-model.trim="form.meta_title_th" /></label>
              <label class="row"><span>Meta Title (EN)</span><input v-model.trim="form.meta_title_en" /></label>
              <label class="row"><span>Meta Description (TH)</span><input v-model.trim="form.meta_desc_th" /></label>
              <label class="row"><span>Meta Description (EN)</span><input v-model.trim="form.meta_desc_en" /></label>
              <label class="row grid1"><span>Canonical URL</span><input v-model.trim="form.canonical_url" /></label>
            </div>
          </details>
  
          <section class="block">
            <h4>รูปปก</h4>
            <div class="cover">
              <img :src="form.cover_path || placeholder" @error="imgErr" />
              <input type="file" accept="image/*" @change="pickCover" />
            </div>
          </section>
  
          <section class="block">
            <h4>แกลเลอรี</h4>
            <div class="gallery">
              <figure v-for="im in images" :key="im.id" class="gitem">
                <img :src="im.file_path" @error="imgErr" />
                <button class="danger small" type="button" @click="removeImage(im.id)">ลบ</button>
              </figure>
              <label class="up">
                <input type="file" accept="image/*" multiple @change="pickImages" />
                + เพิ่มรูป
              </label>
            </div>
          </section>
  
          <footer class="drawer-foot">
            <button class="btn" :disabled="saving">{{ saving ? 'กำลังบันทึก…' : 'บันทึก' }}</button>
            <button type="button" class="ghost" @click="closeForm">ยกเลิก</button>
          </footer>
        </form>
      </dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  
  /* ===== helpers ===== */
  const placeholder = 'https://placehold.co/120x80?text=Cover'
  const imgErr = (e)=> e.target.src = placeholder
  function token() {
    const t = localStorage.getItem('adm_token')
    if (!t) {
      const redirect = encodeURIComponent(location.pathname + location.search)
      location.assign(`/admin/login?redirect=${redirect}`)
      throw new Error('unauthorized')
    }
    return t
  }
  function authFetch(url, opt={}) {
    const t = token()
    opt.headers = Object.assign({}, opt.headers, { Authorization: `Bearer ${t}` })
    return fetch(url, opt)
  }
  
  /* ===== state ===== */
  const q = ref('')
  const status = ref('')
  const items = ref([])
  const loading = ref(false)
  const error = ref('')
  
  /* ===== form state ===== */
  const dlg = ref()
  const form = ref(empty())
  const images = ref([])
  const saving = ref(false)
  
  function empty() {
    return {
      id: null,
      slug: '',
      status: 'draft',
      publish_at: '',
      title_th: '',
      excerpt_th: '',
      body_th: '',
      title_en: '',
      excerpt_en: '',
      body_en: '',
      meta_title_th: '',
      meta_title_en: '',
      meta_desc_th: '',
      meta_desc_en: '',
      canonical_url: '',
      tags: '',
      cover_path: ''
    }
  }
  
  /* ===== list ===== */
  async function load() {
    loading.value = true; error.value = ''
    try {
      const qs = new URLSearchParams({
        q: q.value, status: status.value, page: '1', limit: '50'
      })
      const r = await authFetch('/api/admin/posts?' + qs.toString())
      const data = await r.json()
      if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`)
      items.value = data.items || []
    } catch (e) {
      error.value = e.message || 'server_error'
    } finally {
      loading.value = false
    }
  }
  
  /* ===== open / close ===== */
  function openCreate() {
    form.value = empty()
    images.value = []
    dlg.value?.showModal?.()
  }
  async function openEdit(id) {
    // ดึงข้อมูลตัวเต็มจาก public get (ไม่จำเป็นอ่าน images จาก admin list)
    const r = await fetch('/api/posts/get?id=' + id) // public ไม่ต้อง header
    const data = await r.json()
    if (!r.ok || !data?.ok) { alert('โหลดข้อมูลไม่สำเร็จ'); return }
    const it = data.item
    form.value = {
      id: it.id,
      slug: it.slug,
      status: it.status,
      publish_at: it.publish_at ? it.publish_at.replace(' ', 'T') : '',
      title_th: it.title,
      excerpt_th: it.excerpt,
      body_th: it.body,
      // ช่อง EN จะใส่เพิ่มจาก admin list แนะนำดึงด้วย /api/admin/posts หากต้องการครบทุกภาษา
      title_en: '',
      excerpt_en: '',
      body_en: '',
      meta_title_th: '',
      meta_title_en: '',
      meta_desc_th: '',
      meta_desc_en: '',
      canonical_url: it.canonical_url || '',
      tags: (it.tags || []).join(','),
      cover_path: it.cover_path || ''
    }
    images.value = it.images || []
    dlg.value?.showModal?.()
  }
  function closeForm(){ dlg.value?.close?.() }
  
  /* ===== cover upload ===== */
  let pickedCoverFile = null
  function pickCover(e){ pickedCoverFile = e.target.files?.[0] || null }
  
  /* ===== gallery upload ===== */
  async function pickImages(e){
    const files = Array.from(e.target.files || [])
    if (!form.value.id) { alert('โปรดบันทึกบทความก่อน แล้วจึงอัปโหลดรูปแกลเลอรี'); return }
    if (!files.length) return
    const fd = new FormData()
    for (const f of files) fd.append('images[]', f)
    const r = await authFetch(`/api/admin/posts/${form.value.id}/images`, { method:'POST', body: fd })
    const data = await r.json()
    if (!r.ok || !data?.ok) return alert('อัปโหลดรูปไม่สำเร็จ')
    // reload images
    openEdit(form.value.id)
  }
  
  /* ===== remove image ===== */
  async function removeImage(imageId){
    if (!confirm('ลบรูปนี้?')) return
    const r = await authFetch(`/api/admin/posts/${form.value.id}/images/${imageId}`, { method:'DELETE' })
    const data = await r.json()
    if (!r.ok || !data?.ok) return alert('ลบรูปไม่สำเร็จ')
    images.value = images.value.filter(x => x.id !== imageId)
  }
  
  /* ===== save create/update ===== */
  async function save(){
    saving.value = true
    try{
      const creating = !form.value.id
      const url = creating ? '/api/admin/posts' : `/api/admin/posts/${form.value.id}`
      const method = creating ? 'POST' : 'PUT'
  
      // ใช้ formData เพื่อรองรับไฟล์ cover
      const fd = new FormData()
      for (const k of Object.keys(form.value)) {
        if (k === 'cover_path' || k === 'id') continue
        fd.append(k, form.value[k] ?? '')
      }
      if (pickedCoverFile) fd.append('cover', pickedCoverFile)
  
      const r = await authFetch(url, { method, body: fd })
      const data = await r.json()
      if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`)
  
      if (creating) form.value.id = data.id
      pickedCoverFile = null
      closeForm()
      await load()
    } catch(e){
      alert('บันทึกไม่สำเร็จ: ' + (e.message||e))
    } finally { saving.value = false }
  }
  
  /* ===== delete post ===== */
  async function delPost(id){
    if (!confirm('ยืนยันลบบทความนี้?')) return
    const r = await authFetch(`/api/admin/posts/${id}`, { method:'DELETE' })
    const data = await r.json()
    if (!r.ok || !data?.ok) return alert('ลบไม่สำเร็จ')
    await load()
  }
  
  onMounted(load)
  </script>
  
  <style scoped>
  .wrap{ padding:18px; max-width:1200px; margin:auto; }
  .head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; }
  .tools{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .search{ padding:9px 12px; border:1px solid #e5e7eb; border-radius:10px; min-width:220px; }
  .sel{ padding:9px 10px; border:1px solid #e5e7eb; border-radius:10px; }
  .btn{ border:0; border-radius:10px; padding:9px 14px; font-weight:700; background:#111827; color:#fff; cursor:pointer; }
  .btn.green{ background:linear-gradient(180deg,#8fc857,#7aa63a); }
  .ghost{ background:#eef2f7; border:0; padding:7px 10px; border-radius:8px; cursor:pointer; }
  .danger{ background:#ef4444; color:#fff; border:0; padding:7px 10px; border-radius:8px; cursor:pointer; }
  .small{ padding:4px 8px; font-size:12px; }
  .state{ padding:14px; border:1px dashed #e5e7eb; border-radius:12px; color:#6b7280 }
  .state.error{ background:#fff1f2; color:#b91c1c; border-color:#fecaca }
  .tbl{ width:100%; border-collapse:separate; border-spacing:0 8px; }
  .tbl th, .tbl td{ background:#fff; padding:10px 12px; border-top:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; }
  .tbl th:first-child, .tbl td:first-child{ border-left:1px solid #e5e7eb; border-top-left-radius:10px; border-bottom-left-radius:10px; }
  .tbl th:last-child, .tbl td:last-child{ border-right:1px solid #e5e7eb; border-top-right-radius:10px; border-bottom-right-radius:10px; }
  .thumb{ width:72px; height:48px; object-fit:cover; border-radius:6px; display:block; }
  .title{ font-weight:700 }
  .muted{ color:#6b7280; font-size:12px }
  .mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
  .badge{ padding:3px 8px; border-radius:999px; font-size:12px; background:#e5e7eb }
  .badge.published{ background:#dcfce7; color:#166534 }
  .badge.draft{ background:#fee2e2; color:#991b1b }
  .badge.archived{ background:#e5e7eb; color:#374151 }
  .actions{ display:flex; gap:8px; justify-content:flex-end }
  
  .drawer{ width:min(1020px,96vw); border:0; padding:0; border-radius:14px; }
  .drawer::backdrop{ background:rgba(0,0,0,.4); }
  .panel{ display:grid; grid-template-rows:auto 1fr auto; max-height:90vh; }
  .drawer-head, .drawer-foot{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 16px; background:#fff; border-bottom:1px solid #e5e7eb }
  .drawer-foot{ border-top:1px solid #e5e7eb; border-bottom:0 }
  .x{ border:0; background:#eef2f7; border-radius:8px; font-size:18px; width:34px; height:34px; cursor:pointer }
  .block{ padding:12px 16px; background:#fff; border-top:1px solid #f1f5f9 }
  .grid1{ display:grid; gap:10px }
  .grid2{ display:grid; gap:10px; grid-template-columns:1fr 1fr ;padding: 15px;}
  .row{ display:grid; gap:6px }
  .row > span{ font-size:12px; color:#6b7280 }
  .cover{ display:flex; gap:12px; align-items:center }
  .cover img{ width:160px; height:110px; object-fit:cover; border:1px solid #e5e7eb; border-radius:8px }
  .gallery{ display:flex; gap:10px; flex-wrap:wrap }
  .gitem{ width:120px }
  .gitem img{ width:120px; height:90px; object-fit:cover; border-radius:8px; border:1px solid #e5e7eb; display:block }
  .up{ display:grid; place-items:center; width:120px; height:90px; border:1px dashed #cbd5e1; border-radius:8px; color:#6b7280; cursor:pointer }
  .up input{ display:none }
  @media (max-width: 900px){ .grid2{ grid-template-columns:1fr } }
  dialog{
    padding: 20px;
    margin: auto;
  }
  </style>
  