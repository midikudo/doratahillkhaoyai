<template>
  <div class="wrap">
    <header class="head">
      <h1>
        <input
          v-model.trim="q"
          class="search"
          type="search"
          placeholder="ค้นหาชื่อลูกค้า…"
        />
      </h1>
      <div class="tools">
        <button class="ghost" @click="prevMonth">‹ เดือนก่อน</button>
        <strong class="ym">{{ ymLabel }}</strong>
        <button class="ghost" @click="nextMonth">เดือนถัดไป ›</button>
        <button class="btn" @click="openCreate()">+ สร้างการจอง</button>
      </div>
    </header>

    <div v-if="loading" class="state">กำลังโหลด…</div>
    <div v-else class="cal">
      <!-- หัวตาราง -->
      <div class="dow" v-for="d in dowsTH" :key="d">{{ d }}</div>

      <!-- ช่องวันที่ -->
      <template v-for="(c, i) in cells" :key="i">
        <div
          class="cell"
          :class="{ other: c.other, today: isToday(c.date) }"
          @click="openDay(c.date)"
          @mouseenter="hoverDate = c.date"
          @mouseleave="hoverDate = ''"
        >
          <div class="d">{{ c.d }}</div>

          <!-- รายชื่อในแต่ละวัน (ตัดข้อความอัตโนมัติ) -->
          <div
            v-for="b in dayMap[c.date] || []"
            :key="b.id"
            class="badge"
            :title="tooltipText(b)"
          >
            <span class="badge-name">{{ b.full_name }}</span>
          </div>

          <!-- tooltip สรุปรายการ -->
          <div
            v-if="
              hoverDate === c.date &&
              (dayMap[c.date]?.length || 0)
            "
            class="tip"
          >
            <div v-for="b in dayMap[c.date]" :key="b.id" class="tip-row">
              <strong>#{{ b.id }}</strong> · {{ b.full_name }} ·
              {{ b.phone || "-" }}
              <div class="muted">
                {{ b.check_in }} → {{ b.check_out }}
              </div>
              <div class="muted">
                ห้อง: {{ b.room_id || "-" }} · คน: {{ b.people || 0 }}
                <template v-if="b.pet_type">
                  · สัตว์เลี้ยง: {{ b.pet_type }} ({{
                    b.pet_count || 0
                  }})
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- แถบรายการของวันที่เลือก -->
    <aside v-if="panel.open" class="sidepanel">
      <header>
        <strong>รายการวันที่ {{ panel.date }}</strong>
        <button class="x" @click="panel.open = false">×</button>
      </header>

      <div
        v-if="(dayMap[panel.date]?.length || 0) === 0"
        class="muted"
      >
        ยังไม่มีรายการ
      </div>

      <article
        class="item"
        v-for="b in dayMap[panel.date] || []"
        :key="b.id"
      >
        <div class="title">
          <strong>#{{ b.id }}</strong> {{ b.full_name }}
        </div>
        <div class="sub">
          โทร: {{ b.phone || "-" }} · ห้อง: {{ b.room_id || "-" }} · คน:
          {{ b.people || 0 }}
          <template v-if="b.pet_type">
            · สัตว์เลี้ยง: {{ b.pet_type }} ({{ b.pet_count || 0 }})
          </template>
        </div>
        <div class="sub">
          เข้าพัก: {{ b.check_in }} → {{ b.check_out }} · สถานะ:
          {{ b.status }}
        </div>

        <div class="actions">
          <button class="btn-sm" @click="openEdit(b)">
            แก้ไข
          </button>
          <button class="danger-sm" @click="removeBooking(b.id)">
            ลบการจอง
          </button>
        </div>
      </article>

      <button class="btn w100" @click="openCreate(panel.date)">
        + เพิ่มการจองวันนี้
      </button>
    </aside>

    <!-- โมดัลสร้าง/แก้ไข -->
    <dialog ref="dlg" class="modal" @click.self="closeCreate">
      <form class="panel" @submit.prevent="save">
        <header>
          <h3>{{ form.id ? "แก้ไขการจอง" : "สร้างการจอง" }}</h3>
          <button type="button" class="x" @click="closeCreate">
            ×
          </button>
        </header>

        <div class="grid2">
          <label class="row">
            <span>ชื่อ-นามสกุล</span>
            <input
              v-model.trim="form.full_name"
              required
              placeholder="ชื่อ-นามสกุล"
            />
          </label>
          <label class="row">
            <span>เบอร์ติดต่อ</span>
            <input
              v-model.trim="form.phone"
              required
              placeholder="08xxxxxxxx"
            />
          </label>
        </div>

        <div class="grid2">
          <label class="row">
            <span>เช็คอิน</span>
            <input v-model="form.check_in" type="date" required />
          </label>
          <label class="row">
            <span>เช็คเอาต์</span>
            <input v-model="form.check_out" type="date" required />
          </label>
        </div>

        <div class="grid3">
          <label class="row">
            <span>ห้องที่จอง (room_id)</span>
            <input
              v-model.number="form.room_id"
              type="number"
              min="1"
              placeholder="เช่น 1"
            />
          </label>
          <label class="row">
            <span>จำนวนคน</span>
            <input
              v-model.number="form.people"
              type="number"
              min="0"
              placeholder="0"
            />
          </label>
          <label class="row">
            <span>สถานะ</span>
            <select v-model="form.status">
              <option value="reserved">reserved</option>
              <option value="checked_in">checked_in</option>
              <option value="checked_out">checked_out</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
        </div>

        <div class="grid3">
          <label class="row">
            <span>ชนิดสัตว์เลี้ยง</span>
            <input v-model.trim="form.pet_type" placeholder="เช่น สุนัข" />
          </label>
          <label class="row">
            <span>จำนวน (ตัว)</span>
            <input v-model.number="form.pet_count" type="number" min="0" />
          </label>
          <label class="row">
            <span>หมายเหตุ</span>
            <input
              v-model.trim="form.note"
              placeholder="หมายเหตุเพิ่มเติม"
            />
          </label>
        </div>

        <footer>
          <button class="btn" :disabled="saving">
            {{ saving ? "กำลังบันทึก…" : "บันทึกการจอง" }}
          </button>
          <button
            type="button"
            class="ghost"
            @click="closeCreate"
          >
            ปิด
          </button>
          <button
            v-if="form.id"
            type="button"
            class="danger-sm"
            @click="removeBooking(form.id)"
          >
            ลบการจองนี้
          </button>
        </footer>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const q = ref("");

/* ---------- Calendar state ---------- */
const dowsTH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const monthStart = ref(startOfMonth(new Date()));
const ymLabel = computed(() => formatYM(monthStart.value));

function prevMonth() {
  monthStart.value = addMonths(monthStart.value, -1);
  load();
}
function nextMonth() {
  monthStart.value = addMonths(monthStart.value, 1);
  load();
}
function isToday(iso) {
  return iso === toISO(new Date());
}

/* สร้างเซลล์ 6 แถว x 7 คอลัมน์ */
const cells = computed(() => makeCells(monthStart.value));

/* ---------- Data ---------- */
const loading = ref(true);
const bookings = ref([]); // รายการทั้งหมดของเดือน
const hoverDate = ref("");
const panel = ref({ open: false, date: "" });

const filtered = computed(() => {
  const s = q.value.toLowerCase();
  if (!s) return bookings.value;
  return bookings.value.filter((b) =>
    (b.full_name || "").toLowerCase().includes(s)
  );
});
const dayMap = computed(() => groupByDate(filtered.value));

function getAdminToken() {
  return localStorage.getItem("adm_token") || "";
}

function ensureAuthOrRedirect() {
  const t = getAdminToken();
  if (!t) {
    const redirect = encodeURIComponent(
      location.pathname + location.search
    );
    window.location.assign(`/admin/login?redirect=${redirect}`);
    throw new Error("missing_token");
  }
  return t;
}

// โหลดข้อมูลเดือน พร้อมแนบ token
async function load() {
  loading.value = true;
  try {
    const token = ensureAuthOrRedirect();
    const qs = new URLSearchParams({
      start: toISO(monthStart.value),
      end: toISO(endOfMonth(monthStart.value)),
    });

    const r = await fetch(
      "/api/bookings/admin/month?" + qs.toString(),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (r.status === 401 || r.status === 403) {
      localStorage.removeItem("adm_token");
      localStorage.removeItem("adm_profile");
      const redirect = encodeURIComponent(
        location.pathname + location.search
      );
      window.location.assign(`/admin/login?redirect=${redirect}`);
      return;
    }
    const data = await r.json();
    bookings.value = (data.items || []).map((x) => ({
      id: x.id,
      full_name: x.full_name,
      phone: x.phone,
      check_in: x.check_in,
      check_out: x.check_out,
      status: x.status,
      room_id: x.room_id,
      people: x.people,
      pet_type: x.pet_type,
      pet_count: x.pet_count,
      note: x.note,
    }));
  } finally {
    loading.value = false;
  }
}

function openDay(date) {
  panel.value = { open: true, date };
}
function tooltipText(b) {
  return `#${b.id} ${b.full_name}\n${b.check_in} → ${b.check_out}\nห้อง:${b.room_id || "-"} คน:${b.people || 0}${
    b.pet_type ? ` · สัตว์เลี้ยง:${b.pet_type}(${b.pet_count || 0})` : ""
  }`;
}

/* ---------- Create / Edit ---------- */
const dlg = ref();
const form = ref(emptyForm());
const saving = ref(false);

function emptyForm() {
  const today = toISO(new Date());
  return {
    id: null,
    full_name: "",
    phone: "",
    check_in: today,
    check_out: today,
    room_id: null,
    people: 0,
    pet_type: "",
    pet_count: 0,
    note: "",
    status: "reserved",
  };
}

function openCreate(date = "") {
  form.value = emptyForm();
  if (date) {
    form.value.check_in = date;
    form.value.check_out = date;
  }
  dlg.value?.showModal?.();
}

function openEdit(b) {
  // ถ้าใน DB เก็บ check_out เป็น "วันถัดไป" (exclusive)
  // สามารถใช้ addDaysISO(b.check_out, -1) แทน b.check_out ได้
  form.value = {
    id: b.id,
    full_name: b.full_name || "",
    phone: b.phone || "",
    check_in: b.check_in,
    check_out: b.check_out, // ถ้าต้องการให้ form แสดง -1 วัน: addDaysISO(b.check_out, -1)
    room_id: b.room_id ?? null,
    people: b.people ?? 0,
    pet_type: b.pet_type || "",
    pet_count: b.pet_count ?? 0,
    note: b.note || "",
    status: b.status || "reserved",
  };
  dlg.value?.showModal?.();
}

function closeCreate() {
  dlg.value?.close?.();
}

/* ---------- Helper วันที่ ---------- */
function toISOLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function addDaysISO(iso, days) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toISOLocal(dt);
}

/* ---------- บันทึกการจอง (เพิ่ม / แก้ไข) ---------- */
async function save() {
  saving.value = true;
  try {
    const token = ensureAuthOrRedirect();

    // ถ้าต้องการเก็บ check_out เป็น exclusive day:
    // const payload = {
    //   ...form.value,
    //   check_out: addDaysISO(form.value.check_out, 1),
    // };
    const payload = { ...form.value };

    const url = form.value.id
      ? "/api/bookings/admin/update"
      : "/api/bookings/admin/create";

    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (r.status === 401 || r.status === 403) {
      localStorage.removeItem("adm_token");
      localStorage.removeItem("adm_profile");
      const redirect = encodeURIComponent(
        location.pathname + location.search
      );
      window.location.assign(`/admin/login?redirect=${redirect}`);
      return;
    }

    const data = await r.json();
    if (!r.ok || !data?.ok)
      throw new Error(data?.error || `HTTP ${r.status}`);

    closeCreate();
    await load();
  } catch (e) {
    alert("บันทึกไม่สำเร็จ: " + (e.message || e));
  } finally {
    saving.value = false;
  }
}

/* ---------- ลบการจอง ---------- */
async function removeBooking(id) {
  if (!id) return;
  if (!confirm(`ยืนยันลบการจอง #${id} ?`)) return;

  try {
    const token = ensureAuthOrRedirect();
    const r = await fetch("/api/bookings/admin/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });

    if (r.status === 401 || r.status === 403) {
      localStorage.removeItem("adm_token");
      localStorage.removeItem("adm_profile");
      const redirect = encodeURIComponent(
        location.pathname + location.search
      );
      window.location.assign(`/admin/login?redirect=${redirect}`);
      return;
    }

    const data = await r.json();
    if (!r.ok || !data?.ok)
      throw new Error(data?.error || `HTTP ${r.status}`);

    closeCreate();
    await load();
  } catch (e) {
    alert("ลบไม่สำเร็จ: " + (e.message || e));
  }
}

/* ---------- helpers (วันที่) ---------- */
function toISO(d) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function formatYM(d) {
  return d.toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric",
  });
}
function makeCells(ms) {
  const first = startOfMonth(ms);
  const last = endOfMonth(ms);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 7) % 7)); // อาทิตย์เริ่มสัปดาห์
  const out = [];
  for (let i = 0; i < 42; i++) {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    const iso = toISO(cur);
    out.push({
      d: cur.getDate(),
      date: iso,
      other: cur.getMonth() !== ms.getMonth(),
    });
  }
  return out;
}
function groupByDate(items) {
  const map = {};
  for (const b of items) {
    const start = new Date(b.check_in);
    const end = new Date(b.check_out);
    for (
      let dt = new Date(start);
      dt <= end;
      dt.setDate(dt.getDate() + 1)
    ) {
      const k = toISO(dt);
      (map[k] ||= []).push(b);
    }
  }
  return map;
}

onMounted(load);
</script>

<style scoped>
.wrap{ max-width:1200px; margin:auto; padding:16px; }
.head{ display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.tools{ display:flex; gap:10px; align-items:center; }
.btn{ border:0; padding:10px 14px; border-radius:12px; font-weight:700; color:#fff; background:linear-gradient(180deg,#8fc857,#7aa63a); cursor:pointer; }
.ghost{ border:1px solid #e5e7eb; background:#fff; padding:8px 12px; border-radius:10px; cursor:pointer; }
.state{ padding:14px; border:1px dashed #e5e7eb; border-radius:12px; color:#6b7280; }
.ym{ font-size:18px; }

.cal{ display:grid; grid-template-columns: repeat(7, 1fr); gap:8px; margin-top:10px; }
.dow{ text-align:center; color:#6b7280; font-weight:700; padding:6px 0; }
.cell{
  position:relative; min-height:110px; background:#fff; border:1px solid #e5e7eb; border-radius:12px;
  padding:8px; overflow:hidden; cursor:pointer;
}
.cell.other{ background:#f8fafc; color:#94a3b8; }
.cell.today{ outline:2px solid #60a5fa; }
.cell .d{ font-weight:700; font-size:14px; margin-bottom:4px; }
.badge{
  background:#e8f3da; border:1px solid #d6e9c0; color:#2f6b00;
  border-radius:8px; padding:3px 6px; margin:3px 0; font-size:12px;
}
.badge-name{ display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

.tip{
  position:absolute; left:8px; right:8px; bottom:8px; background:#111827; color:#fff;
  border-radius:10px; padding:8px; font-size:12px; box-shadow:0 8px 24px rgba(0,0,0,.18);
}
.tip-row + .tip-row{ margin-top:6px; border-top:1px dashed rgba(255,255,255,.15); padding-top:6px; }
.muted{ color:#9ca3af; }

.sidepanel{
  position:fixed; right:16px; top:16px; bottom:16px; width:360px; background:#fff; border:1px solid #e5e7eb;
  border-radius:14px; padding:12px; overflow:auto; box-shadow:0 14px 30px rgba(16,24,40,.12);z-index: 2222;
}
.sidepanel header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.sidepanel .x{ border:0; background:#f3f4f6; width:32px; height:32px; border-radius:8px; cursor:pointer; }
.item{ border:1px solid #e5e7eb; border-radius:12px; padding:10px; margin:8px 0; }
.item .title{ font-weight:700; }
.item .sub{ color:#6b7280; font-size:13px; }
.actions{ display:flex; gap:6px; margin-top:6px; }

.modal::backdrop{ background:rgba(0,0,0,.45); }
.modal{ border:0; padding:0; border-radius:16px; width:min(720px,96vw);margin: auto; }
.panel{ background:#fff; border-radius:16px; padding:14px; }
.panel header{ display:flex; justify-content:space-between; align-items:center; }
.panel .x{ border:0; background:transparent; font-size:28px; cursor:pointer; }

.row{ display:flex; flex-direction:column; gap:6px; }
.row > span{ font-size:13px; color:#6b7280; }
input, select{ border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; width:100%; }
footer{ display:flex; gap:10px; margin-top:12px; flex-wrap:wrap; }
.w100{ width:100%; }

.grid2{ display:grid; grid-template-columns: 1fr 1fr; gap:10px; }
.grid3{ display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; }
@media (max-width:720px){
  .grid2, .grid3{ grid-template-columns: 1fr; }
  .sidepanel{ width:92vw; left:4vw; right:4vw; }
}
.search{
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  min-width: 220px;
}

.btn-sm{
  border:0;
  border-radius:999px;
  padding:6px 10px;
  font-size:12px;
  cursor:pointer;
  background:#111827;
  color:#fff;
}
.danger-sm{
  border:0;
  border-radius:999px;
  padding:6px 10px;
  font-size:12px;
  cursor:pointer;
  background:#ef4444;
  color:#fff;
}
</style>
