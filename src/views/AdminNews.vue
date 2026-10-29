<template>
  <div class="wrap">
    <header class="head">
      <h1>{{ isEdit ? "แก้ไขข่าวสาร / บทความ" : "เพิ่มข่าวสาร / บทความ" }}</h1>
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

    <!-- ฟอร์มเพิ่ม/แก้ไข -->
    <div class="card" v-if="!loading">
      <!-- ภาษา -->
      <div class="lang-tabs">
        <button :class="{ active: lang === 'th' }" @click="lang = 'th'">ไทย</button>
        <button :class="{ active: lang === 'en' }" @click="lang = 'en'">English</button>
      </div>

      <!-- TH -->
      <section v-show="lang === 'th'" class="grid">
        <label class="field col-2">
          <span>หัวข้อ (TH) *</span>
          <input v-model.trim="form.title_th" placeholder="หัวข้อภาษาไทย" required />
        </label>
        <label class="field col-2">
          <span>เนื้อหา (TH)</span>
          <textarea
            v-model.trim="form.body_th"
            rows="6"
            placeholder="เนื้อหาข่าวหรือบทความภาษาไทย"
          ></textarea>
        </label>
      </section>

      <!-- EN -->
      <section v-show="lang === 'en'" class="grid">
        <label class="field col-2">
          <span>Title (EN)</span>
          <input v-model.trim="form.title_en" placeholder="Title in English" />
        </label>
        <label class="field col-2">
          <span>Content (EN)</span>
          <textarea
            v-model.trim="form.body_en"
            rows="6"
            placeholder="Content in English"
          ></textarea>
        </label>
      </section>

      <!-- Info -->
      <div class="grid">
        <label class="field">
          <span>วันที่เผยแพร่ (YYYY-MM-DD)</span>
          <input type="date" v-model="form.publish_at" />
        </label>
        <label class="field">
          <span>ลิงก์ภายนอก (ถ้ามี)</span>
          <input v-model.trim="form.link" placeholder="https://example.com" />
        </label>
        <label class="field">
          <span>สถานะเผยแพร่</span>
          <select v-model.number="form.is_active">
            <option :value="1">เผยแพร่</option>
            <option :value="0">ฉบับร่าง</option>
          </select>
        </label>
      </div>

      <!-- Cover -->
      <section class="media">
        <label class="field">
          <span>ภาพหน้าปก</span>
          <input type="file" accept="image/*" @change="onPick" />
        </label>

        <div v-if="preview" class="cover">
          <img :src="preview" alt="cover" @error="onImgErr" />
          <button class="x" @click="remove">×</button>
        </div>

        <p v-if="isEdit && !preview && originalCoverUrl" class="hint">
          (ไม่มีการแสดงรูปเพราะโหลดผิดพลาด หรือถูกลบแล้ว)
        </p>
      </section>
    </div>

    <div v-else class="loading">กำลังโหลดข้อมูล…</div>

    <!-- รายการข่าว / บทความ -->
    <section class="card list-card">
      <div class="list-head">
        <h2>รายการข่าว / บทความ</h2>
      </div>

      <div v-if="listLoading" class="loading">กำลังโหลดรายการข่าว…</div>

      <div v-else-if="items.length === 0" class="empty">
        ยังไม่มีรายการข่าว
      </div>

      <table v-else class="news-table">
        <thead>
          <tr>
            <th style="width:60px;">ID</th>
            <th>หัวข้อ (TH)</th>
            <th style="width:130px;">วันที่เผยแพร่</th>
            <th style="width:100px;">สถานะ</th>
            <th style="width:120px;">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>#{{ item.id }}</td>
            <td>
              <div class="title-cell">
                <span class="t-main">{{ item.title_th || "(ไม่มีชื่อเรื่อง)" }}</span>
                <small v-if="item.title_en" class="t-sub">{{ item.title_en }}</small>
              </div>
            </td>
            <td>
              <span>{{ item.publish_at || "-" }}</span>
            </td>
            <td>
              <span
                :class="['badge', Number(item.is_active) === 1 ? 'badge-live' : 'badge-draft']"
              >
                {{ statusLabel(item.is_active) }}
              </span>
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

function ensureAuthOrRedirect() {
  const t = localStorage.getItem("adm_token");
  if (!t) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    window.location.assign(`/admin/login?redirect=${redirect}`);
    throw new Error("unauthorized");
  }
  return t;
}

// 🗓 helper แปลงวันที่ให้เป็นรูปแบบที่ input type="date" ใช้ได้ (YYYY-MM-DD)
function normalizeDateForInput(raw) {
  if (!raw) return "";
  if (typeof raw === "string") {
    // รูปแบบที่ DB ชอบส่งมา: "2025-11-11" หรือ "2025-11-11 10:20:30"
    const m = raw.match(/^\d{4}-\d{2}-\d{2}/);
    if (m) return m[0];
  }
  // กรณีเป็น Date หรือ string แปลก ๆ
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const route = useRoute();
const router = useRouter();

// อ่าน id จาก query หรือ params
const id = computed(() => route.query.id || route.params.id);
const isEdit = computed(() => !!id.value);

const form = ref({
  title_th: "",
  title_en: "",
  body_th: "",
  body_en: "",
  publish_at: "",
  link: "",
  is_active: 1,
});

const lang = ref("th");
const file = ref(null);
const preview = ref("");
const originalCoverUrl = ref(""); // เก็บ URL รูปเดิมจากฐานข้อมูล
const coverChanged = ref(false); // เลือกรูปใหม่
const coverRemoved = ref(false); // กดลบรูปเดิม

const saving = ref(false);
const loading = ref(false);
const error = ref("");
const success = ref("");

// list ข่าว
const items = ref([]);
const listLoading = ref(false);

function resetForm() {
  form.value = {
    title_th: "",
    title_en: "",
    body_th: "",
    body_en: "",
    publish_at: "",
    link: "",
    is_active: 1,
  };
  lang.value = "th";
  // reset รูป
  if (preview.value && preview.value.startsWith("blob:")) {
    URL.revokeObjectURL(preview.value);
  }
  preview.value = "";
  file.value = null;
  originalCoverUrl.value = "";
  coverChanged.value = false;
  coverRemoved.value = false;
}

function onPick(e) {
  const f = e.target.files?.[0];
  if (!f) return;
  file.value = f;
  coverChanged.value = true;
  coverRemoved.value = false;

  // เปลี่ยน preview เป็นรูปใหม่
  if (preview.value && preview.value.startsWith("blob:")) {
    URL.revokeObjectURL(preview.value);
  }
  preview.value = URL.createObjectURL(f);
}

function remove() {
  // ลบทั้งรูปเดิม / รูปใหม่ ออกจาก preview
  if (preview.value && preview.value.startsWith("blob:")) {
    URL.revokeObjectURL(preview.value);
  }

  preview.value = "";
  file.value = null;

  if (isEdit.value) {
    // ในโหมดแก้ไข ถือว่าต้องการลบภาพเดิม
    coverRemoved.value = true;
    coverChanged.value = false;
  } else {
    // โหมดเพิ่มใหม่ ก็แค่ลบรูปที่เลือกออก
    coverRemoved.value = false;
    coverChanged.value = false;
  }
}

function onImgErr(ev) {
  ev.target.src = "https://placehold.co/600x400?text=No+Image";
}

/**
 * โหลดข้อมูลข่าวเพื่อแก้ไข
 * API: GET /api/news/detail.php?id=xx
 * คาดว่า response: { ok:true, item:{ id, title_th, ..., publish_at, cover_url/cover_path } }
 */
async function fetchDetail() {
  if (!isEdit.value) return;

  loading.value = true;
  error.value = "";
  try {
    const token = ensureAuthOrRedirect();
    const r = await fetch(`/api/news/detail.php?id=${encodeURIComponent(id.value)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await r.json();
    if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`);

    const item = data.item || {};
    const normalizedDate = normalizeDateForInput(item.publish_at);

    form.value = {
      title_th: item.title_th || "",
      title_en: item.title_en || "",
      body_th: item.body_th || "",
      body_en: item.body_en || "",
      publish_at: normalizedDate, // 🗓 ใช้วันที่ที่แปลงแล้ว
      link: item.link || "",
      is_active: Number(item.is_active ?? 1),
    };

    // reset state รูป
    coverChanged.value = false;
    coverRemoved.value = false;
    file.value = null;

    if (item.cover_url || item.cover_path) {
      const url = item.cover_url || item.cover_path;
      originalCoverUrl.value = url;
      preview.value = url; // แสดงรูปเดิม
    } else {
      originalCoverUrl.value = "";
      preview.value = "";
    }
  } catch (e) {
    console.error(e);
    error.value = e.message || "ไม่สามารถโหลดข้อมูลข่าวได้";
  } finally {
    loading.value = false;
  }
}

/**
 * ดึงรายการข่าวทั้งหมด
 * API: GET /api/news/list.php
 * คาดว่า: { ok:true, items:[{ id, title_th, title_en, publish_at, is_active, ... }, ...] }
 */
async function fetchList() {
  listLoading.value = true;
  try {
    const token = ensureAuthOrRedirect();
    const r = await fetch("/api/news/list.php", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await r.json();
    if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`);

    // แปลงวันที่ใน list ด้วย (ให้โชว์สวย ๆ เหมือนกัน)
    items.value = (data.items || []).map((row) => ({
      ...row,
      publish_at: normalizeDateForInput(row.publish_at),
    }));
  } catch (e) {
    console.error(e);
    if (!error.value) {
      error.value = "ไม่สามารถโหลดรายการข่าวได้";
    }
  } finally {
    listLoading.value = false;
  }
}

function statusLabel(v) {
  return Number(v) === 1 ? "เผยแพร่" : "ฉบับร่าง";
}

function goEdit(row) {
  // เคลียร์ข้อความแจ้งเตือนเดิม ๆ
  error.value = "";
  success.value = "";

  // ไปหน้าเดิม แต่ส่ง id ใหม่ใน query
  router.push({ path: route.path, query: { id: row.id } });
}

async function submit() {
  error.value = "";
  success.value = "";

  if (!form.value.title_th) {
    error.value = "กรุณากรอกหัวข้อ (TH)";
    return;
  }

  const fd = new FormData();
  if (isEdit.value) {
    fd.set("id", String(id.value)); // สำหรับ update.php
  }

  fd.set("title_th", form.value.title_th);
  fd.set("title_en", form.value.title_en || "");
  fd.set("body_th", form.value.body_th || "");
  fd.set("body_en", form.value.body_en || "");

  if (form.value.publish_at) fd.set("publish_at", form.value.publish_at);
  if (form.value.link) fd.set("link", form.value.link);
  fd.set("is_active", String(form.value.is_active || 0));

  // จัดการรูป
  if (file.value && coverChanged.value) {
    fd.set("cover", file.value);
  }

  if (isEdit.value && coverRemoved.value) {
    fd.set("delete_cover", "1");
  }

  saving.value = true;
  try {
    const token = ensureAuthOrRedirect();
    const endpoint = isEdit.value
      ? "/api/news/update.php"
      : "/api/news/create.php";

    const r = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    const data = await r.json();
    if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`);

    success.value = isEdit.value
      ? "บันทึกการแก้ไขเรียบร้อยแล้ว"
      : "บันทึกสำเร็จ!";

    if (!isEdit.value) {
      // ถ้าเป็นการเพิ่มใหม่ ⇒ รีเซ็ตฟอร์ม
      resetForm();
    } else {
      // ถ้าแก้ไขแล้ว ให้รีเฟรชข้อมูลอีกครั้ง (เผื่อ backend แปลงค่าอะไร)
      await fetchDetail();
    }

    // รีเฟรช list ด้านล่างทุกครั้งหลังบันทึก
    await fetchList();
  } catch (e) {
    console.error(e);
    error.value = e.message || "server_error";
  } finally {
    saving.value = false;
  }
}

// เรียกครั้งแรกตอนโหลดหน้า
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

// เวลา id เปลี่ยน (กดปุ่มแก้ไขข่าวอื่น) ให้โหลด detail ใหม่
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
.wrap { padding:18px; max-width:960px; margin:auto }
.head { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px }
.btn { background:#7aa63a; color:#fff; border:0; padding:10px 14px; border-radius:10px; font-weight:700; cursor:pointer }
.state{ padding:12px; border-radius:10px; margin-bottom:10px; border:1px solid transparent; }
.state.error{ background:#fff1f2; color:#b91c1c; border-color:#fecaca }
.state.success{ background:#ecfdf3; color:#166534; border-color:#bbf7d0 }
.card{ background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:14px; }
.grid{ display:grid; grid-template-columns: 1fr 1fr; gap:12px }
.field{ display:grid; gap:6px }
.field.col-2{ grid-column: span 2 }
input, textarea, select{ border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; width:100% }
.lang-tabs{ display:flex; gap:8px; margin-bottom:12px }
.lang-tabs button{ padding:8px 12px; border-radius:10px; border:1px solid #e5e7eb; background:#f8fafc; cursor:pointer }
.lang-tabs button.active{ background:#111827; color:#fff }
.media{ margin-top:16px; display:grid; gap:10px }
.cover{ position:relative; max-width:360px }
.cover img{ width:100%; border-radius:10px; border:1px solid #e5e7eb; object-fit:cover }
.cover .x{ position:absolute; top:4px; right:6px; border:0; background:#0008; color:#fff; width:26px; height:26px; border-radius:50%; cursor:pointer }
.loading{ padding:20px; text-align:center }
.hint{ font-size:13px; color:#6b7280 }

.list-card { margin-top:16px; }
.list-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.list-head h2{ font-size:18px; font-weight:600; }

.news-table{ width:100%; border-collapse:collapse; font-size:14px; }
.news-table th,
.news-table td{
  border-top:1px solid #e5e7eb;
  padding:8px 6px;
  text-align:left;
}
.news-table thead th{
  border-top:none;
  background:#f9fafb;
  font-weight:600;
}

.title-cell{ display:flex; flex-direction:column; gap:2px; }
.t-main{ font-weight:500; color:#111827; }
.t-sub{ color:#6b7280; }

.badge{
  display:inline-flex;
  align-items:center;
  padding:2px 8px;
  border-radius:999px;
  font-size:12px;
}
.badge-live{
  background:#dcfce7;
  color:#166534;
}
.badge-draft{
  background:#f3f4f6;
  color:#4b5563;
}

.btn-sm{
  border:0;
  border-radius:999px;
  padding:6px 10px;
  font-size:13px;
  cursor:pointer;
  background:#111827;
  color:#fff;
}

.empty{
  padding:10px 4px;
  color:#6b7280;
}

@media(max-width:900px){
  .grid{ grid-template-columns: 1fr }
  .field.col-2{ grid-column:auto }
}
</style>
