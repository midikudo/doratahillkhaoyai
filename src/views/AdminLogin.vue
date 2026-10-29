<!-- src/views/AdminLogin.vue -->
<template>
  <div class="page">
    <div class="login">
      <div class="card">
        <div class="head">
          <div class="brand-mark">DH</div>
          <div>
            <h1 class="title">Admin Login</h1>
            <p class="subtitle">เข้าสู่ระบบเพื่อจัดการการจองและคอนเทนต์</p>
          </div>
        </div>

        <form class="form" @submit.prevent="onLogin">
          <div v-if="error" class="error">{{ error }}</div>

          <div class="row">
            <label for="email">อีเมล</label>
            <input id="email" class="input" type="email"
                   v-model.trim="email" placeholder="admin@example.com" required />
          </div>

          <div class="row">
            <label for="pass">รหัสผ่าน</label>
            <input id="pass" class="input" type="password"
                   v-model.trim="password" placeholder="••••••••" required />
          </div>

          <div class="actions">
            <button class="btn" type="submit" :disabled="loading" style="background-color: #000;">
              {{ loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ' }}
            </button>
            <span class="hint">หากลืมรหัสผ่าน ติดต่อผู้ดูแลระบบ</span>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

/** helper เก็บ token และตั้งค่า default header สำหรับ fetch */
function setAdminToken(token, admin) {
  localStorage.setItem('adm_token', token)
  localStorage.setItem('adm_profile', JSON.stringify(admin || {}))
  
    // ไปหน้าแดชบอร์ดแอดมิน (แก้ path ตามหน้าที่คุณทำไว้)
    // router.replace({ name: 'admin-rooms' }) // เช่นใน router ตั้งชื่อไว้เป็น 'admin-bookings'
    window.location = 'bookings';
}

/** ดึง token ไปใช้ในหน้าอื่นๆ
export function getAdminToken() {
  return localStorage.getItem('adm_token') || ''
}
 */
/** เรียกใช้เวลา submit */
async function onLogin() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })
    const raw = await res.text()
    let data
    try { data = JSON.parse(raw) } catch { throw new Error(`Response is not JSON: ${raw}`) }

    if (!res.ok || !data?.ok || !data?.token) {
      throw new Error(data?.error || `HTTP ${res.status}`)
    }

    // เก็บ token & ข้อมูล admin
    setAdminToken(data.token, data.admin)

  } catch (e) {
    console.error(e)
    error.value = e?.message || 'เข้าสู่ระบบไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}
</script>
<style scoped>
:root{
  --bg: #f6f7fb;
  --card: #ffffff;
  --text: #111827;
  --muted: #6b7280;
  --ring: #e5e7eb;
  --accent: #7aa63a;
  --accent-2: #8fc857;
  --danger: #dc2626;
  --radius: 16px;
  --shadow-lg: 0 20px 45px rgba(17, 24, 39, .08);
  --shadow-sm: 0 6px 20px rgba(17, 24, 39, .06);
}
.card{
    border: 1px solid var(--ring);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
}
.page{
  min-height: calc(100dvh - 60px);
  display: grid;
  place-items: center;
  background:
    radial-gradient(60rem 60rem at 10% -10%, rgba(122,166,58,.10), transparent 70%),
    radial-gradient(50rem 50rem at 110% 10%, rgba(143,200,87,.10), transparent 60%),
    var(--bg);
  padding: clamp(16px, 4vw, 40px);
}

.login{
  width: min(720px, 96vw);
}

.card{
  background: var(--card);
  border: 1px solid var(--ring);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  overflow: clip;
  animation: pop .45s ease both;
}

@keyframes pop{
  from{ transform: translateY(10px) scale(.98); opacity: 0 }
  to{ transform: translateY(0) scale(1); opacity: 1 }
}

.head{
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 24px 10px;
}
.brand-mark{
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 800;
  background: linear-gradient(135deg,var(--accent),var(--accent-2));
  box-shadow: var(--shadow-sm);
}
.title{
  margin: 0;
  font-size: clamp(22px, 2.6vw, 32px);
  line-height: 1.15;
  letter-spacing: .2px;
}
.subtitle{
  margin: 2px 0 0;
  color: var(--muted);
  font-size: .95rem;
}

.form{
  padding: 10px 24px 22px;
  display: grid;
  gap: 16px;
}

.row{
  display: grid;
  gap: 8px;
}

label{
  font-weight: 700;
  color: var(--text);
}

.input{
  border: 1.5px solid var(--ring);
  background: #fbfbfc;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 16px;
  transition: border-color .15s, box-shadow .15s, background .2s;
  outline: none;
}
.input::placeholder{ color: #a3a3a3 }
.input:focus{
  border-color: color-mix(in oklab, var(--accent) 65%, #fff);
  box-shadow: 0 0 0 5px color-mix(in oklab, var(--accent) 20%, #fff);
  background: #fff;
}

.actions{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.btn{
  border: 0;
  border-radius: 12px;
  padding: 12px 18px;
  font-weight: 800;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(180deg, var(--accent-2), var(--accent));
  box-shadow: var(--shadow-sm);
  transition: transform .06s ease, box-shadow .2s ease, filter .2s ease;
}
.btn:hover{ filter: brightness(1.04) }
.btn:active{ transform: translateY(1px) }

.btn.ghost{
  background: transparent;
  color: var(--text);
  border: 1.5px solid var(--ring);
}

.error{
  color: var(--danger);
  background: #fee2e2;
  border: 1px solid #fecaca;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: .95rem;
}

.hint{
  color: var(--muted);
  font-size: .92rem;
}

/* ทำให้ฟอร์มดูสมดุลในจอใหญ่ */
@media (min-width: 780px){
  .grid-2{
    display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px;
  }
}

/* ปรับระยะขอบบนให้หัวเรื่องเด่นขึ้น */
.page :is(h1,h2,h3){ color: var(--text) }
</style>

  