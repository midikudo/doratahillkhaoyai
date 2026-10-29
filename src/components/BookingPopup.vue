<template>
  <dialog
    ref="dlg"
    class="bk-modal"
    @click.self="close"
    style="padding: 0px; margin: auto"
  >
    <form class="panel" @submit.prevent="submit">
      <header>
        <h3>จองบ้านพัก</h3>
        <button type="button" class="x" @click="close">×</button>
      </header>

      <label class="row">
        <span>ชื่อ-นามสกุล</span>
        <input
          v-model.trim="form.full_name"
          placeholder="ชื่อ-นามสกุล"
          required
        />
      </label>

      <label class="row">
        <span>เบอร์ติดต่อ</span>
        <input v-model.trim="form.phone" placeholder="08xxxxxxxx" required />
      </label>

      <div class="cal-wrap">
        <div class="cal-head">
          <button type="button" @click="prevMonth">‹</button>
          <strong>{{ ymLabel }}</strong>
          <button type="button" @click="nextMonth">›</button>
        </div>

        <div class="cal">
          <div
            class="dow"
            v-for="d in ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']"
            :key="d"
          >
            {{ d }}
          </div>
          <template v-for="(c, i) in cells" :key="i">
            <button
              type="button"
              class="cell"
              :disabled="c.disabled || isRed(c.date) || isPast(c.date)"
              :class="{
                red: isRed(c.date),
                green: !isRed(c.date) && !c.disabled && !isPast(c.date),
                sel: isSel(c.date),
                today: isToday(c.date),
                past: isPast(c.date),
              }"
              @click="togglePick(c.date)"
            >
              <small>{{ c.d }}</small>
            </button>
          </template>
        </div>
        <p class="legend">
          <span class="dot red"></span> ไม่ว่าง &nbsp;
          <span class="dot green"></span> ว่าง &nbsp;
          <span class="dot" style="background: #3b82f6"></span> วันนี้
        </p>
      </div>

      <footer>
        <button class="btn" :disabled="submitting || picked.length === 0">
          {{ submitting ? "กำลังบันทึก…" : "ยืนยันการจอง" }}
        </button>
      </footer>
    </form>
  </dialog>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import dayjs from "dayjs";

const current = ref(dayjs())              // เดือนที่แสดงในปฏิทิน
const busySet  = ref(new Set())           // เก็บวัน busy เป็น Set('YYYY-MM-DD')

const dlg = ref();
const submitting = ref(false);

const form = ref({
  full_name: "",
  phone: "",
});

// ปฏิทิน
const month = ref(dayjs().startOf("month"));
const booked = ref([]); // ['YYYY-MM-DD', ...]
const picked = ref([]); // วันที่ผู้ใช้เลือก (แบบหลายวัน)

function firstCellOffset() {
  return (month.value.day() + 7) % 7; // เริ่มจันทร์/อาทิตย์ได้ตามต้องการ
}

const cells = computed(() => {
  const start = month.value.startOf("month");
  const end = month.value.endOf("month");
  const days = end.date();
  const arr = [];

  // ขึ้นบล็อกว่างก่อนวันที่ 1
  for (let i = 0; i < firstCellOffset(); i++) {
    arr.push({ disabled: true });
  }
  for (let d = 1; d <= days; d++) {
    const date = start.date(d);
    arr.push({
      disabled: false,
      d,
      date: date.format("YYYY-MM-DD"),
    });
  }
  return arr;
});

// yyyy-mm-dd ของวันนี้ (ตาม timezone เครื่อง/บราวเซอร์)
function ymd(d) {
  // สร้างด้วย local time เพื่อให้ตรงกับที่โชว์บนปฏิทิน
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
const todayStr = ymd(new Date());

function isToday(dateStr) {
  return dateStr === todayStr;
}

function isPast(dateStr) {
  // ใช้ string-compare ได้ เพราะรูปแบบเป็น YYYY-MM-DD
  return dateStr < todayStr;
}

function isRed(s) {
  return booked.value.includes(s);
}
function isSel(s) {
  return picked.value.includes(s);
}
function togglePick(s) {
  const i = picked.value.indexOf(s);
  if (i === -1) picked.value.push(s);
  else picked.value.splice(i, 1);
  picked.value.sort();
}

async function loadBooked() {
  const start = month.value.startOf("month").format("YYYY-MM-DD");
  const end = month.value.endOf("month").format("YYYY-MM-DD");
  const r = await fetch(`/api/bookings/availability?start=${start}&end=${end}`);
  const txt = await r.text();
  const data = JSON.parse(txt);
  booked.value = data.booked || [];
}

// วันที่ที่กำลังแสดงในปฏิทิน (สมมติคุณมีอยู่แล้ว)
const viewDate = ref(new Date()); // หรือ new Date(year, monthIndex, 1)

// ฟอร์แมต “เดือน ปี(พ.ศ.)” แบบไทย/ปฏิทินพุทธ
const fmtBuddhist = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
  month: "long",
  year: "numeric",
});

const ymLabel = computed(() => fmtBuddhist.format(viewDate.value));

// ปุ่มเลื่อนเดือน (อัปเดต viewDate)
function prevMonth() {
  month.value = month.value.subtract(1, "month");
  loadBooked();
  const d = new Date(viewDate.value);
  d.setMonth(d.getMonth() - 1, 1);
  viewDate.value = d;
}
function nextMonth() {
  month.value = month.value.add(1, "month");
  loadBooked();
  const d = new Date(viewDate.value);
  d.setMonth(d.getMonth() + 1, 1);
  viewDate.value = d;
}

async function submit() {
  if (!form.value.full_name || !form.value.phone || picked.value.length === 0)
    return;
  // แปลงเป็นช่วง (ง่ายสุด: min -> max+1วัน)
  const a = dayjs(picked.value[0]);
  const b = dayjs(picked.value[picked.value.length - 1]).add(1, "day"); // check_out ไม่รวมวันสุดท้าย
  submitting.value = true;
  try {
    const res = await fetch("/api/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: form.value.full_name,
        phone: form.value.phone,
        check_in: a.format("YYYY-MM-DD"),
        check_out: b.format("YYYY-MM-DD"),
      }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "error");
    alert("บันทึกการจองเรียบร้อย เราจะติดต่อกลับโดยเร็วค่ะ");
    close();
  } catch (e) {
    alert("จองไม่สำเร็จ: " + e.message);
  } finally {
    submitting.value = false;
  }
}
async function loadBusy() {
  const monthStr = current.value.format("YYYY-MM");
  const r = await fetch(`/api/bookings/busy?month=${monthStr}`);
  const data = await r.json();
  busySet.value = new Set(data.busyDates || []);
}

function open() {
  dlg.value?.showModal?.();
  loadBooked();
}
function close() {
  dlg.value?.close?.();
  picked.value = [];
}

defineExpose({ open, close });
onMounted(() => {
  loadBooked();
  loadBusy();
});
</script>

<style scoped>
/* ปุ่มวัน: ให้วาง dot ได้ */
.cell {
  position: relative;
}

/* จุดสีน้ำเงินใต้ตัวเลขของ "วันนี้" */
.cell.today::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 6px;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3b82f6; /* น้ำเงิน */
}

/* ปิดการคลิกของอดีต */
.cell.past {
  opacity: 0.45;
  cursor: not-allowed;
}

.bk-modal::backdrop {
  background: rgba(0, 0, 0, 0.4);
}
.panel {
  width: min(92vw, 560px);
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  border: 0;
  display: grid;
  gap: 12px;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
h3 {
  margin: 0;
}
.x {
  border: 0;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
}

.row {
  display: grid;
  gap: 6px;
}
.row input {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.cal-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px;
}
.cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.cal {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.dow {
  text-align: center;
  font-weight: 700;
  color: #6b7280;
}
.cell {
  aspect-ratio: 1/1;
  border-radius: 10px;
  border: 0;
  cursor: pointer;
  display: grid;
  place-items: center;
  background: #f3f4f6;
}
.cell.red {
  background: #fecaca;
  color: #991b1b;
  cursor: not-allowed;
}
.cell.green {
  background: #dcfce7;
  color: #14532d;
}
.cell.sel {
  outline: 3px solid #7aa63a;
  background: #bbf7d0;
}
.cell:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.legend {
  margin: 0.4rem 0 0;
  color: #6b7280;
}
.dot {
  width: 12px;
  height: 12px;
  display: inline-block;
  border-radius: 3px;
  vertical-align: middle;
}
.dot.red {
  background: #ef4444;
}
.dot.green {
  background: #22c55e;
}

footer {
  display: flex;
  justify-content: flex-end;
}
.btn {
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 700;
  background: linear-gradient(180deg, #8fc857, #7aa63a);
  color: #fff;
  cursor: pointer;
}
</style>
