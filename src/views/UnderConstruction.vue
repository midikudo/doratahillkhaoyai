<template>
  <div class="wrap">
    <!-- Header -->
    <header class="header">
      <div class="brand">
        <!-- <div class="logo" aria-hidden="true">PV</div> -->
        <!-- https://feathericons.dev/?search=home&iconset=feather -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          class="main-grid-item-icon"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>

        <nav aria-label="primary">
          <a class="active" href="#">หน้าแรก</a>
          <a href="#">เกี่ยวกับเรา</a>
          <a href="#">ที่พักโฮมสเตย์</a>
          <a href="#">อาหารและเครื่องดื่ม</a>
          <a href="#">กิจกรรม</a>
          <a href="#">ติดต่อเรา</a>
        </nav>
      </div>

      <div class="lang">
        <span class="pill">TH</span>
        <a class="pill" href="#booking">จอง</a>
      </div>
    </header>

    <!-- Info row -->
    <section class="info-row" role="list">
      <div class="info-card" role="listitem">
        <div class="info-ic">🕒</div>
        <div><strong>Open:</strong> <span style="color:hsla(160, 100%, 37%, 1);">เปิดตลอดเวลา</span>  </div>
      </div>
      <a class="info-card" role="listitem" :href="`tel:${PHONE_RAW}`">
        <div class="info-ic">📞</div>
        <div><strong>Tel:</strong> {{ PHONE_DISPLAY }}</div>
      </a>
      <a
        class="info-card"
        role="listitem"
        :href="LINE_LINK"
        target="_blank"
        rel="noopener"
      >
        <div class="info-ic">💬</div>
        <div><strong>LINE:</strong> {{ LINE_ID }}</div>
      </a>
      <a
        class="info-card"
        role="listitem"
        :href="MAP_LINK"
        target="_blank"
        rel="noopener"
      >
        <div class="info-ic">📍</div>
        <div><strong>ดูแผนที่</strong></div>
      </a>
    </section>

    <!-- Main split -->
    <section class="hero">
      <!-- Left: gallery -->
      <div class="gallery" aria-label="ภาพตัวอย่างที่พัก">
        <img :src="images[0]" alt="Pool Villa ภายนอก" />
        <img :src="images[1]" alt="ห้องนอน" />
        <img :src="images[2]" alt="ห้องรับแขก" />
      </div>

      <!-- Right: message + CTA -->
      <div class="box">
        <span class="kicker">จองตอนนี้ เพื่อได้ช่วงเวลาดี ๆ ก่อนใคร</span>
        <h1 id="booking">เว็บไซต์กำลังดำเนินการ</h1>
        <p class="lead">
          เรากำลังปรับโฉมหน้าเว็บไซต์ใหม่ ให้ข้อมูลครบ ใช้งานง่าย
          และหรูหรายิ่งขึ้น ขณะนี้เปิดรับการจองผ่าน LINE และโทรศัพท์
          คุณสามารถกดปุ่มด้านล่างเพื่อติดต่อเราได้ทันที
        </p>

        <!-- Countdown -->
        <div class="count" role="timer" aria-live="polite">
          <div class="tick">
            <b>{{ time.days }}</b
            ><span>วัน</span>
          </div>
          <div class="tick">
            <b>{{ time.hours }}</b
            ><span>ชั่วโมง</span>
          </div>
          <div class="tick">
            <b>{{ time.minutes }}</b
            ><span>นาที</span>
          </div>
          <div class="tick">
            <b>{{ time.seconds }}</b
            ><span>วินาที</span>
          </div>
        </div>

        <!-- Progress -->
        <div class="progress" aria-label="ความคืบหน้า">
          <div class="bar" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="hint">
          ความคืบหน้าโดยประมาณ:
          <strong>{{ progress.toFixed(0) }}%</strong>
          · อัปเดตล่าสุด: {{ lastUpdated }}
        </div>

        <!-- Email notify (ต่อหลังบ้าน PHP ได้) -->
        <!-- Phone notify
        <form class="notify" @submit.prevent="submitPhone">
          <input
            type="tel"
            inputmode="tel"
            v-model.trim="phone"
            placeholder="เบอร์โทรของคุณ (เช่น 0619199596)"
            required
            aria-label="เบอร์โทรของคุณ"
          />
          <button class="btn" :disabled="submitting">
            {{ submitting ? "กำลังบันทึก…" : "ส่งเบอร์โทร" }}
          </button>
        </form>
        <p v-if="sent" class="hint" role="status">
          ขอบคุณค่ะ/ครับ! เราได้รับเบอร์ของคุณแล้ว และจะแจ้งเตือนผ่าน LINE
        </p>
-->
        <!-- CTA -->
        <div class="cta">
          <a class="btn" :href="LINE_LINK" target="_blank" rel="noopener"
            >จองผ่าน LINE</a
          >
          <a class="btn btn-outline" :href="`tel:${PHONE_RAW}`"
            >โทรจอง {{ PHONE_DISPLAY }}</a
          >
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer>
      <div>© {{ year }} doratahill khaoyai — All rights reserved</div>
      <div>เวอร์ชันตัวอย่าง · จะพร้อมใช้งานเต็มรูปแบบเร็ว ๆ นี้</div>
    </footer>
  </div> 
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed } from "vue";

/** ====== ปรับค่าพื้นฐานที่นี่ ====== */
const LAUNCH_AT = new Date("2025-12-01T10:00:00"); // YYYY-MM-DDTHH:mm:ss
const LINE_ID = "@doratahill";
const LINE_LINK = "https://line.me/R/ti/p/@doratahill";
const PHONE_DISPLAY = "061 919 9596";
const PHONE_RAW = "+6661 919 9596";
const NAME_RAW = "Dorata Hill Khao Yai ";
const MAP_LINK = "https://maps.google.com/?q=Pool%20Villa";
const localImg1 = new URL("../assets/images/S__1040455_0-1761584103338-moc6vn.webp", import.meta.url)
  .href;
const localImg2 = new URL("../assets/images/S__1040428_0-1761584104942-xk7h51.webp", import.meta.url)
  .href;
const localImg3 = new URL("../assets/images/S__1040448_0-1761584123537-5zbk1v.webp", import.meta.url)
  .href;

const images = [localImg1, localImg2, localImg3];

/** ====== Countdown / Progress ====== */
const now = ref(new Date());
const intervalId = ref();
const year = new Date().getFullYear();

const time = computed(() => {
  const diff = Math.max(0, LAUNCH_AT - now.value);
  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  };
});

// เริ่มที่ ~68% ค่อย ๆ ไหลขึ้นจน 90%
const progress = ref(68);
const lastUpdated = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date());

onMounted(() => {
  intervalId.value = setInterval(() => {
    now.value = new Date();
    if (progress.value < 90) progress.value += 0.05;
  }, 1000);
});
onUnmounted(() => clearInterval(intervalId.value));

/** ====== Email notify (ต่อ API PHP ภายหลัง) ====== */
// แทนที่ state เดิมของ email
const phone = ref("")
const submitting = ref(false)
const sent = ref(false)

function normalizeTHPhone(raw) {
  // ตัดช่องว่าง/ขีด แล้วแปลง 0xxxxxxxxx -> +66xxxxxxxxx
  const digits = (raw || "").replace(/[^\d+]/g, "")
  if (/^\+66\d{8,9}$/.test(digits)) return digits
  if (/^0\d{8,9}$/.test(digits)) return "+66" + digits.slice(1)
  return null
}

async function submitPhone() {
  const e164 = normalizeTHPhone(phone.value)
  if (!e164) {
    alert("กรุณากรอกเบอร์โทรให้ถูกต้อง (ตัวอย่าง: 0612345678 หรือ +66912345678)")
    return
  }
  submitting.value = true
  try {
    // ► เลือก endpoint ที่คุณจะใช้ (ตัวอย่างใช้ LINE Notify)
    const res = await fetch("/api/notify_phone.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: e164,
        site: NAME_RAW,         // optional meta
        page: "UnderConstruction",
      }),
    })
    if (!res.ok) throw new Error("network")
    sent.value = true
    phone.value = ""
  } catch (err) {
    alert("ส่งไม่สำเร็จ ลองใหม่อีกครั้ง")
  } finally {
    submitting.value = false
  }
}

</script>

<style scoped>
:root {
  --bg: #f6f7f9;
  --card: #ffffff;
  --text: #1a1d22;
  --muted: #6b7280;
  --accent: #7aa63a;
  --ring: #e5e7eb;
  --shadow: 0 14px 30px rgba(16, 24, 40, 0.08);
  --radius: 20px;
}

@font-face {
  font-family: "PGSunderland";
  src: url("@/assets/font/TorsilpYaLuemChan.ttf") format("truetype");
  font-weight: 200;
  font-style: normal;
  font-display: swap;
}
#booking {
  font-family: "PGSunderland", "Noto Sans Thai", system-ui, sans-serif;
  font-size: 15px;
  color: blue;
  margin: 18px 0 14px;
}
.notify input{ font-size:16px } /* ป้องกัน iOS ซูมเมื่อโฟกัส */

/* ========== MOBILE FIRST (<= ~768px) ========== */
.wrap {
  /* เต็มจอมือถือ + เว้นขอบพอดี */
  min-height: 100dvh;
  /* padding: 14px 14px 28px;
  background: var(--bg); */
}

/* Header บีบให้กะทัดรัดแบบตัวอย่าง */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
nav {
  display: none;
} /* ซ่อนเมนูยาวบนมือถือให้เรียบเหมือนภาพตัวอย่าง */
.lang {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pill {
  background: var(--card);
  border: 1px solid var(--ring);
  padding: 8px 12px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow);
}

/* แถบ “banner” ตามอารมณ์ภาพ (ใช้สีพื้นเรียบ) */
.wrap::before {
  content: "";
  display: block;
  width: 100%;
  /* height: clamp(120px, 36vw, 180px); */
  border-radius: 10px;
  background: #6f7d8f;
  /* margin: 6px 0 14px; */
}

/* Info cards: 2×2 บนมือถือ */
.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 8px 0 18px;
}
.info-card {
  background: #fff;
  border: 1px solid var(--ring);
  border-radius: 16px;
  padding: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
  color: inherit;
  text-decoration: none;
  box-shadow: var(--shadow);
}
.info-ic {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  background: #eef5e6;
  display: grid;
  place-items: center;
  color: #3a5c0b;
}

/* พื้นที่หลัก: เอา “กล่องข้อความ” ไปไว้ใต้แกลเลอรีในมือถือ */
.hero {
  display: grid;
  grid-template-columns: 1fr; /* มือถือ 1 คอลัมน์ */
  gap: 16px;
  align-items: start;
}

/* Gallery 2 คอลัมน์ รูปโค้งมน ใกล้เคียงตัวอย่าง */
.gallery {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.gallery img {
  width: 100%;
  aspect-ratio: 4 / 3; /* ไม่ล็อกความสูงตายตัว */
  object-fit: cover;
  border-radius: 16px;
  border: 1px solid var(--ring);
  background: #ddd;
}
/* ยกเลิกกฎรูปแรกกิน 2 แถว เมื่อเป็นมือถือ */
.gallery img:first-child {
  grid-row: auto;
  height: auto;
}

/* กล่องข้อความ/หัวเรื่อง */
.box {
  background: var(--card);
  border: 1px solid var(--ring);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--shadow);
}
.kicker {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f0f7e8;
  color: #3a5c0b;
  font-size: 12px;
  font-weight: 700;
  margin: 4px 0 8px;
}
#booking {
  /* ใช้ฟอนต์ที่คุณประกาศแล้วได้เลย */
  font-family: "PGSunderland", "Noto Sans Thai", system-ui, sans-serif;
}
/* ขนาดหัวเรื่อง/บรรทัดให้ยืดหยุ่นบนทุกจอ */
h1 {
  font-size: clamp(22px, 7vw, 34px);
  line-height: 1.25;
  margin: 2px 0 8px;
}
.lead {
  color: var(--muted);
  font-size: 14px;
  margin: 0 0 14px;
}

/* Countdown */
.count {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 10px;
}
.tick {
  background: #f7f8fa;
  border: 1px solid var(--ring);
  padding: 10px;
  border-radius: 12px;
  text-align: center;
}
.tick b {
  display: block;
  font-size: 18px;
}
.tick span {
  display: block;
  color: var(--muted);
  font-size: 12px;
}

/* Progress */
.progress {
  height: 10px;
  background: #eef0f4;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 10px;
}
.bar {
  height: 100%;
  width: 68%;
  background: linear-gradient(90deg, var(--accent), #9bc85a);
}
.hint {
  color: var(--muted);
  font-size: 12px;
  margin-top: 6px;
}

/* ฟอร์ม/ปุ่ม */
.notify {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  margin-top: 12px;
}
@media (max-width: 480px) {
  .notify {
    grid-template-columns: 1fr;
  }
}
.notify input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--ring);
  background: #fff;
  color: var(--text);
  font-size: 16px; /* กัน iOS ซูม */
}
.btn {
  appearance: none;
  border: 0;
  border-radius: 12px;
  padding: 12px 16px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  background: linear-gradient(180deg, #8fc857, #7aa63a);
  color: #fff;
  box-shadow: 0 10px 20px rgba(122, 166, 58, 0.35);
}
.btn-outline {
  background: transparent;
  border: 1.5px solid var(--accent);
  color: var(--accent);
}
.cta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

/* Footer */
footer {
  margin-top: 24px;
  color: var(--muted);
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

/* ========== DESKTOP-UP (>= 768px) — ขยายกลับเหมือนเดิม ========== */
@media (min-width: 768px) {
  .wrap {
    padding: 18px 18px 42px;
    background: radial-gradient(
        1200px 600px at -10% -10%,
        #e8f0df 0%,
        transparent 55%
      ),
      radial-gradient(1000px 500px at 110% 10%, #f3ead3 0%, transparent 55%),
      var(--bg);
  }
  nav {
    display: flex;
    gap: 22px;
    flex-wrap: wrap;
  }
  .info-row {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin: 14px 0 28px;
  }
  .hero {
    grid-template-columns: 1.1fr 0.9fr;
    gap: 28px;
    align-items: center;
  }
  .gallery {
    grid-template-columns: 1fr 0.9fr;
    gap: 16px;
  }
  .gallery img {
    aspect-ratio: auto;
    height: 260px;
  }
  .gallery img:first-child {
    grid-row: 1 / span 2;
    height: 540px;
  }
  .box {
    padding: 26px;
    border-radius: var(--radius);
  }
  h1 {
    font-size: 44px;
    margin: 8px 0 4px;
  }
  .lead {
    font-size: 16px;
  }
  .count {
    gap: 10px;
  }
}
</style>
