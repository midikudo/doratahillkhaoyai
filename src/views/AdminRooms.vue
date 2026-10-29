<template>
  <div class="wrap">
    <header class="head">
      <h1>จัดการบ้านพัก</h1>
      <div class="tools">
        <button class="ghost" @click="startCreate" :disabled="saving">
          + เพิ่มบ้านใหม่
        </button>
        <button class="btn" @click="submit" :disabled="saving">
          {{ saving ? "กำลังบันทึก…" : "บันทึก" }}
        </button>
      </div>
    </header>

    <!-- error รวม -->
    <div v-if="error" class="state error">เกิดข้อผิดพลาด: {{ error }}</div>

    <div class="layout">
      <!-- ===== ฝั่งซ้าย: รายการห้อง ===== -->
      <aside class="sidebar">
        <div class="side-head">
          <h2>ห้องพักทั้งหมด</h2>
          <input
            v-model.trim="q"
            class="search"
            placeholder="ค้นหาชื่อห้อง…"
          />
        </div>

        <div v-if="loadingRooms" class="state small">กำลังโหลดห้อง…</div>
        <div v-else-if="roomsFiltered.length === 0" class="state small">
          ยังไม่มีห้องพัก
        </div>

        <ul class="room-list" v-else>
          <li
            v-for="r in roomsFiltered"
            :key="r.id"
            :class="['room-item', { active: r.id === editingId }]"
          >
            <button type="button" class="room-main" @click="editRoom(r)">
              <div class="room-name">
                {{ r.name || ("ห้อง #" + r.id) }}
              </div>
              <div class="room-desc" v-if="r.description">
                {{ r.description }}
              </div>
              <div class="room-meta">
                <span v-if="r.images?.length">
                  📷 {{ r.images.length }} รูป
                </span>
              </div>
            </button>
            <button
              type="button"
              class="room-del"
              @click="deleteRoom(r)"
              title="ลบห้องนี้"
            >
              🗑
            </button>
          </li>
        </ul>
      </aside>

      <!-- ===== ฝั่งขวา: ฟอร์ม ===== -->
      <main class="editor">
        <h2 class="form-title">
          {{ mode === "create" ? "เพิ่มบ้านพักใหม่" : "แก้ไขบ้านพัก" }}
          <span v-if="mode === 'edit' && editingId" class="id-tag">
            #{{ editingId }}
          </span>
        </h2>

        <!-- แท็บภาษา -->
        <div class="lang-tabs">
          <button :class="{ active: lang === 'th' }" @click="lang = 'th'">
            ไทย
          </button>
          <button :class="{ active: lang === 'en' }" @click="lang = 'en'">
            English
          </button>
        </div>

        <!-- Thai -->
        <section v-show="lang === 'th'" class="grid">
          <label class="field">
            <span>ชื่อบ้าน (TH) *</span>
            <input
              v-model.trim="form.name_th"
              placeholder="เช่น บ้านพูลวิลล่า A"
            />
          </label>
          <label class="field col-2">
            <span>รายละเอียด (TH)</span>
            <textarea
              v-model.trim="form.description_th"
              rows="5"
              placeholder="รายละเอียดบ้านภาษาไทย"
            ></textarea>
          </label>
        </section>

        <!-- English -->
        <section v-show="lang === 'en'" class="grid">
          <label class="field">
            <span>Room name (EN)</span>
            <input
              v-model.trim="form.name_en"
              placeholder="e.g. Pool Villa A"
            />
          </label>
          <label class="field col-2">
            <span>Description (EN)</span>
            <textarea
              v-model.trim="form.description_en"
              rows="5"
              placeholder="Room description in English"
            ></textarea>
          </label>
        </section>

        <!-- รูปเดิม (ตอนแก้ไข) -->
        <section
          v-if="mode === 'edit' && existingImages.length"
          class="media"
        >
          <span class="label">รูปเดิม</span>
          <div class="thumbs">
            <article
              v-for="im in existingImages"
              :key="im.id || im.file_path"
              class="thumb old"
            >
              <img :src="im.file_path" @error="onImgErr" />
              <small>รูปเดิม</small>
              <button
                type="button"
                class="x"
                @click.stop="deleteImage(im)"
                title="ลบรูปนี้"
              >
                ×
              </button>
            </article>
          </div>
          <div class="hint">
            * คลิกปุ่ม (×) เพื่อลบรูปเดิมออกได้ และสามารถอัปโหลดรูปใหม่เพิ่มด้านล่าง
          </div>
        </section>

        <!-- รูปใหม่ -->
        <section class="media">
          <label class="field">
            <span>อัปโหลดรูปใหม่ (หลายไฟล์ได้)</span>
            <input type="file" multiple accept="image/*" @change="onPick" />
          </label>

          <div class="thumbs" v-if="files.length">
            <article v-for="(f, i) in files" :key="i" class="thumb">
              <img :src="previews[i]" @error="onImgErr" />
              <small>{{ f.name }}</small>
              <button type="button" class="x" @click="remove(i)">×</button>
            </article>
          </div>
          <div class="hint">
            * ระบบจะบีบอัดเป็น .webp ~≤ 90KB ต่อภาพให้อัตโนมัติเมื่อบันทึก
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

/** ใช้ตรวจ token admin */
function ensureAuthOrRedirect() {
  const t = localStorage.getItem("adm_token");
  if (!t) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    window.location.assign(`/admin/login?redirect=${redirect}`);
    throw new Error("unauthorized");
  }
  return t;
}

/* ===== STATE ฟอร์ม ===== */
const form = ref({
  name_th: "",
  name_en: "",
  description_th: "",
  description_en: "",
});
const lang = ref("th");
const files = ref([]);
const previews = ref([]);
const saving = ref(false);
const error = ref("");

/* ===== STATE ห้องทั้งหมด (ฝั่งซ้าย) ===== */
const rooms = ref([]);
const loadingRooms = ref(false);
const q = ref("");

const roomsFiltered = computed(() => {
  const s = q.value.toLowerCase();
  if (!s) return rooms.value;
  return rooms.value.filter((r) =>
    (r.name || "").toLowerCase().includes(s)
  );
});

/* ===== แก้ไข/โหมด ===== */
const editingId = ref(null); // null = create, otherwise = room.id
const mode = computed(() => (editingId.value ? "edit" : "create"));

/* ===== รูปเดิมของห้อง (ตอนแก้ไข) ===== */
const existingImages = ref([]);

/* ===== โหลดรายการห้องจาก API ===== */
async function loadRooms() {
  loadingRooms.value = true;
  error.value = "";
  try {
    const token = ensureAuthOrRedirect(); // ถ้ามี auth backend ภายหลังจะได้พร้อม
    const res = await fetch("/api/rooms_list.php", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Response is not JSON: ${raw.slice(0, 200)}`);
    }

    if (!res.ok || !data?.ok)
      throw new Error(data?.error || `HTTP ${res.status}`);

    rooms.value = (data.rooms || []).map((x) => ({
      ...x,
      images: (x.images || []).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    }));
  } catch (e) {
    console.error(e);
    error.value = e.message || "server_error";
  } finally {
    loadingRooms.value = false;
  }
}

/* ===== เริ่มเพิ่มใหม่ ===== */
function startCreate() {
  editingId.value = null;
  form.value = {
    name_th: "",
    name_en: "",
    description_th: "",
    description_en: "",
  };
  existingImages.value = [];
  // clear รูปใหม่
  files.value = [];
  previews.value.forEach((u) => URL.revokeObjectURL(u));
  previews.value = [];
}

/* ===== กดเลือกห้องเพื่อแก้ไข ===== */
function editRoom(r) {
  editingId.value = r.id;
  // API rooms_list.php ให้ field name/description (เลือกตามภาษา)
  // ที่ฝั่ง insert เดิมเราเซ็ต name=name_th, description=description_th
  form.value.name_th = r.name || "";
  form.value.description_th = r.description || "";

  // (EN จะไม่ได้ถูกดึงกลับมา เพราะ API นี้ไม่ได้ส่ง name_en/description_en)
  // ถ้ายังไม่มีภาษาอังกฤษ ก็ปล่อยว่างให้กรอกใหม่ได้
  form.value.name_en = "";
  form.value.description_en = "";

  existingImages.value = Array.isArray(r.images) ? [...r.images] : [];

  // reset รูปใหม่
  files.value = [];
  previews.value.forEach((u) => URL.revokeObjectURL(u));
  previews.value = [];
}

/* ===== ลบห้อง ===== */
async function deleteRoom(r) {
  if (!r?.id) return;
  if (!confirm(`ต้องการลบ "${r.name || "ห้อง #" + r.id}" ใช่ไหม?`)) return;

  try {
    const token = ensureAuthOrRedirect();
    const res = await fetch("/api/rooms_delete.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ room_id: r.id }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok)
      throw new Error(data?.error || `HTTP ${res.status}`);

    // ถ้าลบห้องที่กำลังแก้ -> reset ฟอร์ม
    if (editingId.value === r.id) {
      startCreate();
    }
    rooms.value = rooms.value.filter((x) => x.id !== r.id);
  } catch (e) {
    console.error(e);
    alert("ลบห้องไม่สำเร็จ: " + (e.message || e));
  }
}

/* ===== รูปใหม่: เลือก / ลบ ===== */
function onPick(e) {
  files.value = Array.from(e.target.files || []);
  previews.value.forEach((u) => URL.revokeObjectURL(u));
  previews.value = files.value.map((f) => URL.createObjectURL(f));
}

function remove(i) {
  files.value.splice(i, 1);
  URL.revokeObjectURL(previews.value[i]);
  previews.value.splice(i, 1);
}

function onImgErr(ev) {
  ev.target.src = "https://placehold.co/240x160?text=Image";
}

/* ===== ลบ "รูปเดิม" ทีละรูป ===== */
async function deleteImage(im) {
  if (!editingId.value || !im.id) return;
  if (!confirm("ต้องการลบรูปนี้ใช่ไหม?")) return;

  try {
    const token = ensureAuthOrRedirect();
    const r = await fetch(
      `/api/admin/rooms/${editingId.value}/images/${im.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data?.ok)
      throw new Error(data?.error || `HTTP ${r.status}`);

    // ลบจาก state
    existingImages.value = existingImages.value.filter(
      (x) => x.id !== im.id
    );
  } catch (e) {
    console.error(e);
    alert("ลบรูปไม่สำเร็จ: " + (e.message || e));
  }
}

/* ===== บันทึก (สร้าง/แก้ไข) ===== */
async function submit() {
  error.value = "";

  if (!form.value.name_th) {
    error.value = "กรุณากรอกชื่อบ้าน (TH)";
    return;
  }

  const fd = new FormData();
  fd.set("name_th", form.value.name_th);
  if (form.value.name_en) fd.set("name_en", form.value.name_en);
  if (form.value.description_th)
    fd.set("description_th", form.value.description_th);
  if (form.value.description_en)
    fd.set("description_en", form.value.description_en);

  for (const f of files.value) {
    fd.append("images[]", f);
  }

  saving.value = true;
  try {
    const token = ensureAuthOrRedirect();
    let url = "/api/rooms_create.php";

    if (mode.value === "edit" && editingId.value) {
      url = "/api/rooms_update.php";
      fd.set("id", String(editingId.value));
    }

    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: fd,
    });

    // handle unauthorized
    if (r.status === 401 || r.status === 403) {
      localStorage.removeItem("adm_token");
      localStorage.removeItem("adm_profile");
      const redirect = encodeURIComponent(location.pathname + location.search);
      window.location.assign(`/admin/login?redirect=${redirect}`);
      return;
    }

    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data?.ok)
      throw new Error(data?.error || `HTTP ${r.status}`);

    alert("บันทึกสำเร็จ");

    // ถ้าสร้างใหม่แล้ว API ส่ง room_id กลับมา -> สลับไป edit ห้องนั้น
    if (mode.value === "create" && data.room_id) {
      editingId.value = data.room_id;
    }

    // เคลียร์รูปใหม่ (รูปเดิมระบบจะผูกกับห้องอยู่แล้ว)
    files.value = [];
    previews.value.forEach((u) => URL.revokeObjectURL(u));
    previews.value = [];

    // reload rooms เพื่อ sync รายการ + รูปเดิม
    await loadRooms();

    // ถ้าเพิ่งสร้างใหม่ -> auto select ห้องนั้น
    if (mode.value === "create" && data.room_id) {
      const found = rooms.value.find((r) => r.id === data.room_id);
      if (found) editRoom(found);
    } else if (mode.value === "edit" && editingId.value) {
      const found = rooms.value.find((r) => r.id === editingId.value);
      if (found) editRoom(found);
    }
  } catch (e) {
    console.error(e);
    error.value = e.message || "server_error";
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadRooms();
  startCreate();
});
</script>

<style scoped>
.wrap {
  padding: 18px;
  max-width: 1200px;
  margin: auto;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.tools {
  display: flex;
  gap: 10px;
}
.btn {
  background: #7aa63a;
  color: #fff;
  border: 0;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}
.ghost {
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111827;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
}
.state {
  padding: 12px;
  border-radius: 10px;
  border: 1px dashed #e5e7eb;
  color: #6b7280;
  margin-bottom: 10px;
}
.state.small {
  font-size: 13px;
  padding: 8px 10px;
}
.state.error {
  background: #fff1f2;
  color: #b91c1c;
  border-color: #fecaca;
}

/* Layout ซ้าย/ขวา */
.layout {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 16px;
}
@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

/* Sidebar rooms */
.sidebar {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 12px;
}
.side-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}
.side-head h2 {
  margin: 0;
  font-size: 18px;
}
.search {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  width: 100%;
}
.room-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}
.room-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px;
  align-items: stretch;
}
.room-item.active .room-main {
  border-color: #7aa63a;
  background: #f0fdf4;
}
.room-main {
  text-align: left;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  cursor: pointer;
  display: grid;
  gap: 2px;
}
.room-name {
  font-weight: 600;
}
.room-desc {
  font-size: 13px;
  color: #6b7280;
  max-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.room-meta {
  font-size: 12px;
  color: #6b7280;
}
.room-del {
  border: 0;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 10px;
  width: 34px;
  cursor: pointer;
}

/* Editor form */
.editor {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px;
}
.form-title {
  margin: 0 0 8px;
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.id-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4f46e5;
}

/* Lang tabs */
.lang-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.lang-tabs button {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  cursor: pointer;
  font-size: 14px;
}
.lang-tabs button.active {
  background: #111827;
  color: #fff;
}

/* Form grid */
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 10px;
}
.field {
  display: grid;
  gap: 6px;
}
.field.col-2 {
  grid-column: span 2;
}
.field span {
  font-size: 14px;
  color: #374151;
}
input,
textarea {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
  width: 100%;
  font-size: 14px;

  /* ใส่ stack ฟอนต์ที่รองรับไทยแน่นอน */
  font-family:
    "Noto Sans Thai", "Sarabun", "Prompt",
    system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial,
    "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji";
}
textarea {
  resize: vertical;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .field.col-2 {
    grid-column: auto;
  }
}

/* Media */
.media {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}
.label {
  font-size: 14px;
  font-weight: 600;
}
.thumbs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}
.thumb {
  position: relative;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #f3f4f6;
  padding: 6px;
}
.thumb img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}
.thumb small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #4b5563;
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
.hint {
  color: #6b7280;
  font-size: 12px;
}
</style>
