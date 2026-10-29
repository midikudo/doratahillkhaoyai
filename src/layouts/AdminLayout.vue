<template>
  <!-- ถ้ายังไม่ล็อกอิน ใส่คลาส noauth เพื่อตัดคอลัมน์ซ้ายออก -->
  <div class="adm" :class="{ noauth: !isAuthed }">
    <!-- Sidebar: แสดงเฉพาะเมื่อมี token -->
    <aside v-if="isAuthed" :class="['sidebar', { mini }]">
      <div class="logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-gear" viewBox="0 0 16 16">
  <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m.256 7a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1zm3.63-4.54c.18-.613 1.048-.613 1.229 0l.043.148a.64.64 0 0 0 .921.382l.136-.074c.561-.306 1.175.308.87.869l-.075.136a.64.64 0 0 0 .382.92l.149.045c.612.18.612 1.048 0 1.229l-.15.043a.64.64 0 0 0-.38.921l.074.136c.305.561-.309 1.175-.87.87l-.136-.075a.64.64 0 0 0-.92.382l-.045.149c-.18.612-1.048.612-1.229 0l-.043-.15a.64.64 0 0 0-.921-.38l-.136.074c-.561.305-1.175-.309-.87-.87l.075-.136a.64.64 0 0 0-.382-.92l-.148-.045c-.613-.18-.613-1.048 0-1.229l.148-.043a.64.64 0 0 0 .382-.921l-.074-.136c-.306-.561.308-1.175.869-.87l.136.075a.64.64 0 0 0 .92-.382zM14 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0"/>
</svg> 
         Admin</div>
      <nav>
        <RouterLink to="/admin/slide">จัดการสไลด์</RouterLink>
        <RouterLink to="/admin/rooms">บ้านพัก</RouterLink>
        <!-- <RouterLink to="/admin/facilities/hall">ห้องโถง / TV / โอเกะ</RouterLink> -->
        <RouterLink to="/admin/facilities/kitchen">สิ่งอำนวยความสะดวก</RouterLink>
        <RouterLink to="/admin/facilities/activity">กิจกรรมในบ้าน</RouterLink>
        <RouterLink to="/admin/news">ข่าวสาร & โปรโมชัน</RouterLink>
        <RouterLink to="/admin/reviews">รีวิวลูกค้า</RouterLink>
        <RouterLink to="/admin/attractions">สถานที่เที่ยวใกล้เคียง</RouterLink>
        <RouterLink to="/admin/post">บทความ / เรื่องราวดีๆ</RouterLink>
        <RouterLink to="/admin/bookings">การจอง</RouterLink>
        <!-- <RouterLink to="/admin/settings">ข้อมูลอื่น ๆ & ลิงก์จอง</RouterLink> -->
      </nav>
      <button class="toggle" @click="mini = !mini">⟷</button>
    </aside>

    <main class="main">
      <header class="top">
        <h1>{{ title }}</h1>
        <!-- แสดงปุ่มไปหน้า Login หากยังไม่ล็อกอิน (เผื่อเข้าเพจลึกด้วย URL ตรง) -->
        <a v-if="!isAuthed" href="/admin/login" class="login-link">เข้าสู่ระบบ</a>
      </header>
      <section class="body">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const mini = ref(false)
const title = computed(() => route.meta?.title ?? 'Admin')

/** --- auth state: อิงจาก adm_token ใน localStorage --- */
const token = ref(localStorage.getItem('adm_token') || '')
const isAuthed = computed(() => !!token.value)

function refreshToken() {
  token.value = localStorage.getItem('adm_token') || ''
}

function onStorage(e) {
  if (e.key === 'adm_token') refreshToken()
}

onMounted(() => {
  window.addEventListener('storage', onStorage)
  // เผื่อคุณยิงอีเวนต์นี้หลัง login/logout: window.dispatchEvent(new Event('adm-auth-changed'))
  window.addEventListener('adm-auth-changed', refreshToken)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', onStorage)
  window.removeEventListener('adm-auth-changed', refreshToken)
})
</script>

<style scoped>
.adm{
  display:grid;
  grid-template-columns: 260px 1fr;
  min-height:100dvh;
}
/* เมื่อยังไม่ล็อกอิน → ไม่มี sidebar, เหลือคอลัมน์เดียว */
.adm.noauth{
  grid-template-columns: 1fr;
}

.sidebar{
  background:#111827; color:#fff; padding:14px;
  position:sticky; top:0; height:100dvh;
}
.sidebar.mini{ width:78px; }
.logo{ font-weight:800; margin-bottom:12px }
nav{ display:grid; gap:8px }
a{ color:#e5e7eb; text-decoration:none; padding:2px 12px; border-radius:10px }
a.router-link-active{ background:#1f2937 }
.toggle{ margin-top:12px; background:#374151; color:#fff; border:0; padding:8px 10px; border-radius:8px; cursor:pointer }

.main{ background:#f6f7f9; display:grid; grid-template-rows:auto 1fr }
.top{
  padding:14px 18px; background:#fff; border-bottom:1px solid #e5e7eb;
  display:flex; align-items:center; justify-content:space-between; gap:12px;
}
.login-link{
  color:#2563eb; font-weight:700; text-decoration:none;
  padding:8px 12px; border:1px solid #dbe2ef; border-radius:10px; background:#f8fafc;
}

.body{ padding:16px; max-width:1200px; }

@media (max-width: 980px){
  .adm{ grid-template-columns: 78px 1fr }
  .adm.noauth{ grid-template-columns: 1fr }
  .sidebar{ padding:10px }
}
</style>
