<template>
  <div class="card">
    <h2>สถานที่เที่ยวใกล้เคียง</h2>

    <!-- ฟอร์มเพิ่ม/แก้ไข -->
    <form @submit.prevent="submit" enctype="multipart/form-data" class="f">
      <div class="form-head">
        <span class="mode-tag">
          {{ isEdit ? "โหมดแก้ไข" : "โหมดเพิ่มใหม่" }}
        </span>
        <button
          v-if="isEdit"
          type="button"
          class="btn-ghost"
          @click="resetForm"
        >
          + เพิ่มสถานที่ใหม่
        </button>
      </div>

      <!-- แท็บภาษา -->
      <div class="lang-tabs">
        <button
          type="button"
          :class="{ active: lang === 'th' }"
          @click="lang = 'th'"
        >
          ไทย
        </button>
        <button
          type="button"
          :class="{ active: lang === 'en' }"
          @click="lang = 'en'"
        >
          English
        </button>
      </div>

      <!-- ฟิลด์ร่วม -->
      <label>ลิงก์แผนที่ (Google Maps)</label>
      <input v-model="form.map_link" placeholder="https://maps.google.com/..." />

      <!-- ภาษาไทย -->
      <template v-if="lang === 'th'">
        <label>ชื่อสถานที่ (TH) *</label>
        <input
          v-model="form.title_th"
          required
          placeholder="เช่น Primo Piazza"
        />
        <label>รายละเอียด (TH)</label>
        <textarea
          v-model="form.description_th"
          rows="3"
          placeholder="รายละเอียดภาษาไทย"
        ></textarea>
      </template>

      <!-- ภาษาอังกฤษ -->
      <template v-else>
        <label>ชื่อสถานที่ (EN)</label>
        <input v-model="form.title_en" placeholder="เช่น Primo Piazza" />
        <label>รายละเอียด (EN)</label>
        <textarea
          v-model="form.description_en"
          rows="3"
          placeholder="Description in English"
        ></textarea>
      </template>

      <!-- รูปภาพเดิม -->
      <section v-if="existingImages.length" class="media-block">
        <div class="lbl-row">
          <span class="lbl">รูปเดิม</span>
          <small class="hint">สามารถลบรูปเดิมทีละรูปได้</small>
        </div>
        <div class="grid">
          <article
            v-for="img in existingImages"
            :key="img.id"
            class="thumb"
          >
            <img :src="img.url" @error="onImgErr" />
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
      </section>

      <!-- รูปภาพใหม่ -->
      <section class="media-block">
        <label>อัปโหลดรูปใหม่ (2–3 รูปได้)</label>
        <input type="file" accept="image/*" multiple @change="pick" />
        <div class="grid" v-if="previews.length">
          <article
            v-for="(p, i) in previews"
            :key="p"
            class="thumb"
          >
            <img :src="p" @error="onImgErr" />
            <button
              type="button"
              class="x"
              @click="removeNew(i)"
              title="เอารูปนี้ออกจากการอัปโหลด"
            >
              ×
            </button>
          </article>
        </div>
        <div class="hint">
          * ระบบจะบีบอัดเป็น .webp ให้อัตโนมัติ (แนะนำ 2–3 รูป)
        </div>
      </section>

      <button class="btn" :disabled="submitting">
        {{
          submitting
            ? (isEdit ? "กำลังบันทึกการแก้ไข…" : "กำลังบันทึก…")
            : (isEdit ? "บันทึกการแก้ไข" : "เพิ่มสถานที่")
        }}
      </button>
    </form>

    <!-- รายการ -->
    <h3>รายการ</h3>
    <div v-if="items.length === 0" class="muted">ยังไม่มีข้อมูล</div>
    <div class="list">
      <article class="it" v-for="a in items" :key="a.id">
        <img
          v-if="a.images?.[0]"
          :src="a.images[0].file_path || a.images[0].url"
          @error="onImgErr"
        />
        <div class="meta">
          <h4>
            {{ a.title_th || a.title_en || "(ไม่มีชื่อ)" }}
          </h4>
          <p class="muted small">
            EN: {{ a.title_en || "-" }}
          </p>
          <p class="muted">
            {{ shortText(a.description_th || a.description_en) }}
          </p>
          <div class="actions">
            <a
              v-if="a.map_link"
              :href="a.map_link"
              target="_blank"
              rel="noopener"
            >
              แผนที่
            </a>
            <button class="btn-sm" @click="edit(a)">แก้ไข</button>
            <button class="danger" @click="del(a.id)">ลบ</button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";

function getAdminToken() {
  return localStorage.getItem("adm_token") || "";
}

function ensureAuthOrRedirect() {
  const t = getAdminToken();
  if (!t) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    window.location.assign(`/admin/login?redirect=${redirect}`);
    throw new Error("missing_token");
  }
  return t;
}

const form = ref({
  title_th: "",
  title_en: "",
  description_th: "",
  description_en: "",
  map_link: "",
});

const lang = ref("th");
const files = ref([]); // รูปใหม่
const previews = ref([]); // preview รูปใหม่
const existingImages = ref([]); // รูปเดิม {id,url}
const items = ref([]);
const submitting = ref(false);
const editingId = ref(null); // null = เพิ่มใหม่, มีค่า = แก้ไขของ id นั้น

const isEdit = computed(() => editingId.value !== null);

function shortText(text, max = 80) {
  if (!text) return "";
  const t = String(text);
  return t.length > max ? t.slice(0, max) + "…" : t;
}

function onImgErr(ev) {
  ev.target.src = "https://placehold.co/240x160?text=Image";
}

function pick(e) {
  // เคลียร์ preview เดิมของรูปใหม่
  previews.value.forEach((p) => {
    if (p.startsWith("blob:")) URL.revokeObjectURL(p);
  });

  const selected = Array.from(e.target.files || []);
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

async function load() {
  const token = ensureAuthOrRedirect();
  const r = await fetch("/api/attractions/list.php", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const d = await r.json();
  items.value = d.ok ? d.items || [] : [];
}

/** reset ฟอร์ม + กลับโหมดเพิ่มใหม่ */
function resetForm() {
  form.value = {
    title_th: "",
    title_en: "",
    description_th: "",
    description_en: "",
    map_link: "",
  };
  lang.value = "th";
  editingId.value = null;

  // เคลียร์ไฟล์ใหม่
  previews.value.forEach((p) => {
    if (p.startsWith("blob:")) URL.revokeObjectURL(p);
  });
  previews.value = [];
  files.value = [];

  // เคลียร์รูปเดิม
  existingImages.value = [];
}

/** คลิก "แก้ไข" แถวในรายการ */
function edit(a) {
  editingId.value = a.id;

  form.value = {
    title_th: a.title_th || "",
    title_en: a.title_en || "",
    description_th: a.description_th || "",
    description_en: a.description_en || "",
    map_link: a.map_link || "",
  };

  // รูปเดิมจาก items (ต้องให้ backend ส่ง a.images มา)
  existingImages.value = (a.images || []).map((img) => ({
    id: img.id,
    url: img.file_path || img.url,
  }));

  // เริ่มต้นไม่มีรูปใหม่
  previews.value.forEach((p) => {
    if (p.startsWith("blob:")) URL.revokeObjectURL(p);
  });
  previews.value = [];
  files.value = [];

  // เลื่อนขึ้นบนให้เห็นฟอร์ม
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** ลบรูปเดิมทีละรูป */
async function deleteExisting(img) {
  if (!img?.id) return;
  if (!confirm("ต้องการลบรูปนี้ออกจากสถานที่นี้หรือไม่?")) return;

  try {
    const token = ensureAuthOrRedirect();
    const fd = new FormData();
    fd.set("id", String(img.id));

    const r = await fetch("/api/attractions/delete-image.php", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    const d = await r.json();
    if (!r.ok || !d?.ok) throw new Error(d?.error || `HTTP ${r.status}`);

    existingImages.value = existingImages.value.filter((it) => it.id !== img.id);
  } catch (e) {
    console.error(e);
    alert(e.message || "ลบรูปไม่สำเร็จ");
  }
}

async function submit() {
  submitting.value = true;
  try {
    const token = ensureAuthOrRedirect();

    if (!form.value.title_th && !form.value.title_en) {
      alert("กรุณากรอกชื่อสถานที่อย่างน้อย 1 ภาษา");
      return;
    }

    const fd = new FormData();
    // รองรับ 2 ภาษา
    fd.append("title_th", form.value.title_th || "");
    fd.append("title_en", form.value.title_en || "");
    fd.append("description_th", form.value.description_th || "");
    fd.append("description_en", form.value.description_en || "");
    fd.append("map_link", form.value.map_link || "");

    // ถ้าอยู่โหมดแก้ไข ส่ง id ไปด้วย
    if (isEdit.value) {
      fd.append("id", String(editingId.value));
    }

    // แนบรูปใหม่
    files.value.forEach((f) => fd.append("images[]", f));

    const endpoint = isEdit.value
      ? "/api/attractions/update.php"
      : "/api/attractions/create.php";

    const r = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    const d = await r.json();
    if (!r.ok || !d?.ok) {
      throw new Error(d?.error || `HTTP ${r.status}`);
    }

    alert(isEdit.value ? "บันทึกการแก้ไขเรียบร้อย" : "เพิ่มสถานที่เรียบร้อยแล้ว");

    // หลังบันทึก: เคลียร์ฟอร์ม + กลับโหมดเพิ่มใหม่
    resetForm();
    await load();
  } catch (e) {
    console.error(e);
    alert(e.message || "บันทึกไม่สำเร็จ");
  } finally {
    submitting.value = false;
  }
}

async function del(id) {
  if (!confirm("ยืนยันลบสถานที่นี้?")) return;
  const token = ensureAuthOrRedirect();
  await fetch("/api/attractions/delete.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id }),
  });
  await load();

  // ถ้ากำลังแก้ id นี้อยู่ ให้เคลียร์ฟอร์มด้วย
  if (editingId.value === id) {
    resetForm();
  }
}

onMounted(load);
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
  margin-bottom: 16px;
}
.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mode-tag {
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
}
input,
textarea {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-size: 15px;
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
.btn[disabled] {
  opacity: 0.7;
  cursor: default;
}
.btn-ghost {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
}
.lang-tabs {
  display: flex;
  gap: 8px;
}
.lang-tabs button {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  cursor: pointer;
  font-size: 13px;
}
.lang-tabs button.active {
  background: #111827;
  color: #fff;
  border-color: #111827;
}
.media-block {
  border-top: 1px dashed #e5e7eb;
  padding-top: 8px;
}
.lbl-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.lbl {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
}
.thumb {
  position: relative;
}
.thumb img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}
.thumb .x {
  position: absolute;
  top: 4px;
  right: 6px;
  border: 0;
  background: #0008;
  color: #fff;
  width: 24px;
  height: 24px;
  line-height: 24px;
  border-radius: 50%;
  cursor: pointer;
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
.meta h4 {
  margin: 0 0 2px;
}
.small {
  font-size: 13px;
}
.actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  align-items: center;
}
.actions a {
  font-size: 14px;
  color: #2563eb;
  text-decoration: underline;
}
.danger {
  background: #ef4444;
  color: #fff;
  border: 0;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}
.btn-sm {
  background: #111827;
  color: #fff;
  border: 0;
  padding: 7px 10px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 13px;
}
.muted {
  color: #6b7280;
}
.hint {
  color: #6b7280;
  font-size: 12px;
}
@media (max-width: 700px) {
  .it {
    flex-direction: column;
  }
  .it img {
    width: 100%;
    height: 180px;
  }
}
</style>
