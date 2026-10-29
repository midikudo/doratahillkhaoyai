<template>
  <div class="wrap">
    <header class="head">
      <h1>{{ isEdit ? "แก้ไขรีวิวลูกค้า" : "เพิ่มรีวิวลูกค้า" }}</h1>
      <div class="tools">
        <button class="btn" @click="submit" :disabled="saving">
          {{
            saving
              ? "กำลังบันทึก…"
              : isEdit
                ? "บันทึกการแก้ไข"
                : "บันทึก"
          }}
        </button>
      </div>
    </header>

    <div v-if="error" class="state error">เกิดข้อผิดพลาด: {{ error }}</div>
    <div v-if="success" class="state success">{{ success }}</div>

    <!-- ฟอร์มเพิ่ม/แก้ไขรีวิว -->
    <div class="card">
      <div class="grid">
        <label class="field">
          <span>ชื่อผู้รีวิว</span>
          <input v-model.trim="form.author_name" placeholder="ไม่บังคับ" />
        </label>
        <label class="field">
          <span>คะแนน (1–5)</span>
          <input type="number" v-model.number="form.rating" min="1" max="5" />
        </label>
        <label class="field">
          <span>วันที่เข้าพัก (YYYY-MM-DD)</span>
          <input v-model.trim="form.visited_at" placeholder="2025-11-06" />
        </label>
      </div>

      <div class="lang-tabs">
        <button :class="{active: lang==='th'}" @click="lang='th'">ไทย</button>
        <button :class="{active: lang==='en'}" @click="lang='en'">English</button>
      </div>

      <!-- TH -->
      <section v-show="lang==='th'" class="grid">
        <label class="field col-2">
          <span>เนื้อหารรีวิว (TH) *</span>
          <textarea
            v-model.trim="form.content_th"
            rows="6"
            placeholder="รีวิวภาษาไทย"
          ></textarea>
        </label>
      </section>

      <!-- EN -->
      <section v-show="lang==='en'" class="grid">
        <label class="field col-2">
          <span>Review content (EN)</span>
          <textarea
            v-model.trim="form.content_en"
            rows="6"
            placeholder="Review in English"
          ></textarea>
        </label>
      </section>

      <!-- Images -->
      <section class="media">
        <!-- รูปเดิมจากระบบ -->
        <div v-if="existingImages.length" class="block">
          <span class="lbl">รูปเดิม</span>
          <div class="thumbs">
            <article
              v-for="img in existingImages"
              :key="img.id"
              class="thumb"
            >
              <img :src="img.url" @error="onImgErr" />
              <small>รูปจากระบบ</small>
              <button
                type="button"
                class="x"
                @click="deleteExisting(img)"
                title="ลบรูปนี้"
              >
                ×
              </button>
            </article>
          </div>
        </div>

        <!-- อัปโหลดรูปใหม่ -->
        <div class="block">
          <label class="field">
            <span>อัปโหลดรูปใหม่ (หลายไฟล์ได้)</span>
            <input type="file" multiple accept="image/*" @change="onPick" />
          </label>

          <div class="thumbs" v-if="previews.length">
            <article v-for="(src,i) in previews" :key="i" class="thumb">
              <img :src="src" @error="onImgErr" />
              <small>{{ files[i]?.name }}</small>
              <button type="button" class="x" @click="removeNew(i)">×</button>
            </article>
          </div>
          <div class="hint">* ระบบจะบีบอัดเป็น .webp ~≤ 90KB ต่อภาพให้อัตโนมัติ</div>
        </div>
      </section>
    </div>

    <!-- รายการรีวิวด้านล่าง -->
    <section class="card list-card">
      <div class="list-head">
        <h2>รายการรีวิวลูกค้า</h2>
        <button class="btn-sm-outline" @click="goCreate" v-if="isEdit">
          + เพิ่มรีวิวใหม่
        </button>
      </div>

      <div v-if="listLoading" class="loading">กำลังโหลดรายการรีวิว…</div>

      <div v-else-if="items.length === 0" class="empty">
        ยังไม่มีรีวิว
      </div>

      <table v-else class="review-table">
        <thead>
          <tr>
            <th style="width:60px;">ID</th>
            <th style="width:150px;">ชื่อผู้รีวิว</th>
            <th style="width:80px;">คะแนน</th>
            <th style="width:140px;">วันที่เข้าพัก</th>
            <th>รีวิว (TH)</th>
            <th style="width:120px;">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>#{{ item.id }}</td>
            <td>{{ item.author_name || "-" }}</td>
            <td>{{ item.rating ?? "-" }}</td>
            <td>{{ item.visited_at || "-" }}</td>
            <td class="review-cell">
              <span>{{ shortText(item.content_th) }}</span>
            </td>
            <td>
              <button class="btn-sm" @click="goEdit(item)">
                แก้ไข
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

/** ถ้ามีอยู่แล้วในโปรเจกต์ ให้ใช้ของเดิม */
function ensureAuthOrRedirect() {
  const t = localStorage.getItem("adm_token");
  if (!t) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    window.location.assign(`/admin/login?redirect=${redirect}`);
    throw new Error("unauthorized");
  }
  return t;
}

const route = useRoute();
const router = useRouter();

// อ่าน id จาก query หรือ params
const id = computed(() => route.query.id || route.params.id);
const isEdit = computed(() => !!id.value);

const form = ref({
  author_name: "",
  rating: 5,
  visited_at: "",
  content_th: "",
  content_en: "",
});

const lang = ref("th");
const files = ref([]);      // รูปใหม่ที่เลือก
const previews = ref([]);   // URL preview ของรูปใหม่
const existingImages = ref([]); // รูปเดิมจาก backend [{id,url}]

const saving = ref(false);
const error = ref("");
const success = ref("");

// ลิสต์รีวิวทั้งหมด
const items = ref([]);
const listLoading = ref(false);

function resetForm() {
  form.value = {
    author_name: "",
    rating: 5,
    visited_at: "",
    content_th: "",
    content_en: "",
  };
  lang.value = "th";

  // clear รูปใหม่
  previews.value.forEach((u) => {
    if (u.startsWith("blob:")) URL.revokeObjectURL(u);
  });
  previews.value = [];
  files.value = [];

  // clear รูปเดิม
  existingImages.value = [];
}

function onPick(e) {
  const selected = Array.from(e.target.files || []);
  // clear preview เดิมของรูปใหม่
  previews.value.forEach((u) => {
    if (u.startsWith("blob:")) URL.revokeObjectURL(u);
  });

  files.value = selected;
  previews.value = selected.map((f) => URL.createObjectURL(f));
}

function removeNew(i) {
  if (previews.value[i] && previews.value[i].startsWith("blob:")) {
    URL.revokeObjectURL(previews.value[i]);
  }
  files.value.splice(i, 1);
  previews.value.splice(i, 1);
}

function onImgErr(ev) {
  ev.target.src = "https://placehold.co/240x160?text=Image";
}

function shortText(text, max = 60) {
  if (!text) return "-";
  const t = String(text);
  return t.length > max ? t.slice(0, max) + "…" : t;
}

/**
 * ลบรูปเดิม (ยิง API ลบทันที เหมือน AdminRoom)
 * API คาดหวัง: POST /api/reviews/delete-image.php  (รับ image id)
 * body: FormData { id }
 * response: { ok:true }
 */
async function deleteExisting(img) {
  if (!img?.id) return;
  const yes = window.confirm("ต้องการลบรูปนี้ออกจากรีวิวหรือไม่?");
  if (!yes) return;

  try {
    const token = ensureAuthOrRedirect();
    const fd = new FormData();
    fd.set("id", String(img.id));

    const r = await fetch("/api/reviews/delete-image.php", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    if (r.status === 401 || r.status === 403) {
      localStorage.removeItem("adm_token");
      localStorage.removeItem("adm_profile");
      const redirect = encodeURIComponent(location.pathname + location.search);
      window.location.assign(`/admin/login?redirect=${redirect}`);
      return;
    }

    const data = await r.json();
    if (!r.ok || !data?.ok) {
      throw new Error(data?.error || `HTTP ${r.status}`);
    }

    // ลบรูปออกจาก list ด้านหน้า
    existingImages.value = existingImages.value.filter((it) => it.id !== img.id);
  } catch (e) {
    console.error(e);
    error.value = e.message || "ลบรูปไม่สำเร็จ";
  }
}

/**
 * ดึงข้อมูลรีวิวสำหรับแก้ไข
 * API คาดหวัง: GET /api/reviews/detail.php?id=xx
 * response: { ok:true, item:{ ..., images:[{id,url},...] } }
 */
async function fetchDetail() {
  if (!isEdit.value) return;

  error.value = "";
  try {
    const token = ensureAuthOrRedirect();
    const r = await fetch(`/api/reviews/detail.php?id=${encodeURIComponent(id.value)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (r.status === 401 || r.status === 403) {
      localStorage.removeItem("adm_token");
      localStorage.removeItem("adm_profile");
      const redirect = encodeURIComponent(location.pathname + location.search);
      window.location.assign(`/admin/login?redirect=${redirect}`);
      return;
    }

    const data = await r.json();
    if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`);

    const item = data.item || {};

    form.value = {
      author_name: item.author_name || "",
      rating: Number(item.rating ?? 5),
      visited_at: item.visited_at || "",
      content_th: item.content_th || "",
      content_en: item.content_en || "",
    };

    // รูปเดิมจาก backend
    existingImages.value = (item.images || []).map((img) => ({
      id: img.id,
      url: img.url || img.image_path,
    }));

    // เวลาแก้ไข ถือว่าไฟล์ใหม่ยังไม่มี (เริ่มนับใหม่)
    previews.value.forEach((u) => {
      if (u.startsWith("blob:")) URL.revokeObjectURL(u);
    });
    previews.value = [];
    files.value = [];
  } catch (e) {
    console.error(e);
    error.value = e.message || "ไม่สามารถโหลดข้อมูลรีวิวได้";
  }
}

/**
 * ดึงลิสต์รีวิวทั้งหมดมาแสดง
 * API: GET /api/reviews/list.php
 * response: { ok:true, items:[{ id, author_name, rating, visited_at, content_th, ... }] }
 */
async function fetchList() {
  listLoading.value = true;
  try {
    const token = ensureAuthOrRedirect();
    const r = await fetch("/api/reviews/list.php", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (r.status === 401 || r.status === 403) {
      localStorage.removeItem("adm_token");
      localStorage.removeItem("adm_profile");
      const redirect = encodeURIComponent(location.pathname + location.search);
      window.location.assign(`/admin/login?redirect=${redirect}`);
      return;
    }

    const data = await r.json();
    if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`);

    items.value = data.items || [];
  } catch (e) {
    console.error(e);
    if (!error.value) {
      error.value = "ไม่สามารถโหลดรายการรีวิวได้";
    }
  } finally {
    listLoading.value = false;
  }
}

function goEdit(row) {
  error.value = "";
  success.value = "";
  router.push({ path: route.path, query: { id: row.id } });
}

function goCreate() {
  error.value = "";
  success.value = "";
  router.push({ path: route.path, query: {} });
}

async function submit() {
  error.value = "";
  success.value = "";

  if (!form.value.content_th) {
    error.value = "กรุณากรอกเนื้อหารีวิว (TH)";
    return;
  }

  const fd = new FormData();
  if (form.value.author_name) fd.set("author_name", form.value.author_name);
  if (form.value.rating) fd.set("rating", String(form.value.rating));
  if (form.value.visited_at) fd.set("visited_at", form.value.visited_at);
  fd.set("content_th", form.value.content_th);
  if (form.value.content_en) fd.set("content_en", form.value.content_en);

  // ถ้ามี id แสดงว่าเป็นโหมดแก้ไข
  if (isEdit.value) {
    fd.set("id", String(id.value));
  }

  // รูปใหม่
  for (const f of files.value) fd.append("images[]", f);

  saving.value = true;
  try {
    const token = ensureAuthOrRedirect();
    const endpoint = isEdit.value
      ? "/api/reviews/update.php"
      : "/api/reviews/create.php";

    const r = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    if (r.status === 401 || r.status === 403) {
      localStorage.removeItem("adm_token");
      localStorage.removeItem("adm_profile");
      const redirect = encodeURIComponent(location.pathname + location.search);
      window.location.assign(`/admin/login?redirect=${redirect}`);
      return;
    }

    const data = await r.json();
    if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`);

    success.value = isEdit.value
      ? "บันทึกการแก้ไขรีวิวเรียบร้อยแล้ว"
      : "บันทึกรีวิวสำเร็จ";

    // ⭐ หลังบันทึกเสร็จ ล้างฟอร์ม & กลับไปโหมดเพิ่มใหม่เสมอ
    resetForm();
    router.push({ path: route.path, query: {} });

    // อัปเดตรายการรีวิวด้านล่าง
    await fetchList();
  } catch (e) {
    console.error(e);
    error.value = e.message || "server_error";
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  try {
    ensureAuthOrRedirect();
  } catch {
    return;
  }

  if (isEdit.value) {
    fetchDetail();
  }

  fetchList();
});

// ดูการเปลี่ยนแปลงของ id (เวลาเปลี่ยนรีวิวที่จะแก้ไข)
watch(
  () => id.value,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchDetail();
    }
    if (!newId && oldId) {
      resetForm();
    }
  }
);
</script>

<style scoped>
.wrap { padding: 18px; max-width: 920px; margin:auto }
.head { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px }
.btn { background:#7aa63a; color:#fff; border:0; padding:10px 14px; border-radius:10px; font-weight:700; cursor:pointer }

.state{ padding:12px; border-radius:10px; margin-bottom:10px; border:1px solid transparent; }
.state.error{ background:#fff1f2; color:#b91c1c; border-color:#fecaca }
.state.success{ background:#ecfdf3; color:#166534; border-color:#bbf7d0 }

.card{ background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:14px; margin-bottom:16px }
.grid{ display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px }
.field{ display:grid; gap:6px }
.field.col-2{ grid-column: span 3 }
input, textarea{ border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; width:100% }

.lang-tabs{ display:flex; gap:8px; margin:12px 0 }
.lang-tabs button{ padding:8px 12px; border-radius:10px; border:1px solid #e5e7eb; background:#f8fafc; cursor:pointer }
.lang-tabs button.active{ background:#111827; color:#fff }

.media{ margin-top:12px; display:grid; gap:10px }
.media .block + .block{ margin-top:8px; }
.lbl{ font-size:13px; font-weight:500; color:#374151; margin-bottom:4px; display:inline-block; }

.thumbs{ display:grid; grid-template-columns: repeat(auto-fill,minmax(160px,1fr)); gap:10px }
.thumb{ position:relative; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; background:#f3f4f6; padding:6px; transition:0.15s ease; }
.thumb img{ width:100%; height:120px; object-fit:cover; border-radius:8px }
.thumb small{ display:block; margin-top:4px; font-size:12px; color:#374151; }
.thumb .x{ position:absolute; top:4px; right:6px; border:0; background:#0008; color:#fff; width:24px; height:24px; line-height:24px; border-radius:50%; cursor:pointer }

.hint{ color:#6b7280; font-size:12px }

.list-card { margin-top:4px; }
.list-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.list-head h2{ font-size:18px; font-weight:600; }

.review-table{ width:100%; border-collapse:collapse; font-size:14px; }
.review-table th,
.review-table td{
  border-top:1px solid #e5e7eb;
  padding:8px 6px;
  text-align:left;
}
.review-table thead th{
  border-top:none;
  background:#f9fafb;
  font-weight:600;
}
.review-cell span{ display:inline-block; max-width:280px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

.btn-sm{
  border:0;
  border-radius:999px;
  padding:6px 10px;
  font-size:13px;
  cursor:pointer;
  background:#111827;
  color:#fff;
}

.btn-sm-outline{
  border:1px solid #e5e7eb;
  border-radius:999px;
  padding:6px 12px;
  font-size:13px;
  cursor:pointer;
  background:#f9fafb;
  color:#111827;
}

.empty{
  padding:10px 4px;
  color:#6b7280;
}

.loading{ padding:16px 4px; text-align:center; color:#4b5563; }

@media (max-width: 900px){
  .grid{ grid-template-columns: 1fr }
  .field.col-2{ grid-column: auto }
  .review-cell span{ max-width:160px; }
}
</style>
