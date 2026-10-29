<template>
  <header class="nav">
    <!-- แถวบน -->
    <div class="bar">
      <div class="brand">
        <div
          @click="goHome"
          style="cursor: pointer; display: flex; align-items: center"
        >
          <div class="logo">
            <img :src="logoSrc" alt="" style="border-radius: 4px" />
          </div>
          <div class="brand-text">
            {{ brandTitle }}
          </div>
        </div>
      </div>

      <!-- ขวาบน: คอนแทคสั้น ๆ (เดสก์ท็อป) -->
      <div class="menu-desktop" style="cursor: pointer; align-items: center">
        <div style="text-align:center; padding:4px;width:auto;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
               width="16" height="16" class="main-grid-item-icon"
               fill="none" stroke="#7aa63a" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
            <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          {{ t('topbar.phone') }}<br />
          <span style="font-size: smaller; white-space: nowrap;">061 919 9596</span>
        </div>

        <div style="height:60px; text-align:center;width: 4px;background-color: #3333337d;border-radius: 20px;"></div>

        <div style="text-align:center; padding:4px;width:auto;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
               width="16" height="16" stroke="#7aa63a" class="main-grid-item-icon"
               fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" aria-hidden="true">
            <path d="M12 3C6.5 3 2 6.7 2 11.4c0 3.2 2.1 5.9 5.1 7.3l-.4 2.5c-.1.7.6 1.2 1.2.9l3-1.7c.4 0 .7.1 1.1.1 5.5 0 10-3.7 10-8.4S17.5 3 12 3Z"/>
          </svg>
          LINE<br />
          <small style="white-space: nowrap;">@doratahill</small>
        </div>

        <div style="height:60px; text-align:center;width: 4px;background-color: #3333337d;border-radius: 20px;"></div>

        <div style="text-align:center; padding:4px;width:auto; cursor: pointer" @click="$refs.ck.open()">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
               aria-hidden="true" width="16" height="16" stroke="#7aa63a"
               class="main-grid-item-icon" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1">
            <path d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22Zm0 2a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm1 4h-2v6l5 3 .9-1.8-3.9-2.2V7Z"/>
          </svg>
          <br />
          <small style="white-space: nowrap;">{{ t('topbar.checkAvailability') }}</small>
        </div>

        <div style="height:60px; text-align:center;width: 4px;background-color: #3333337d;border-radius: 20px;"></div>

        <div @click="goPage" style="text-align:center; padding:4px; cursor: pointer">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
               width="16" height="16" class="main-grid-item-icon"
               fill="none" stroke="#7aa63a" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
            <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
          <br />
          <small style="white-space: nowrap;">{{ t('topbar.contactBooking') }}</small>
        </div>
      </div>

      <div class="actions">
        <!-- สวิตช์ภาษา (ยกเว้นฝั่งแอดมิน) -->
        <LanguageSwitcher class="book-mobile" v-if="!isAdmin" />

        <!-- ปุ่มจอง (เฉพาะมือถือ) -->
        <a
          :href="bookingHref"
          class="btn-book book-mobile"
          @click="$refs.bk.open()"
        >
          {{ t('actions.book') }}
        </a>

        <!-- hamburger (เฉพาะมือถือ) -->
        <button
          class="burger"
          @click="open = true"
          :aria-label="t('a11y.openMenu')"
          aria-controls="mobile-drawer"
          aria-expanded="false"
        >
          <span></span><span></span><span></span>
        </button>
      </div>

      <!-- เมนูเดสก์ท็อป + ปุ่มจองขวาสุด -->
      <nav class="menu-desktop" aria-label="เมนูหลัก">
        <div class="menu-links">
          <RouterLink to="/">{{ t('nav.home') }}</RouterLink>
          <RouterLink to="/rooms">{{ t('nav.rooms') }}</RouterLink>
          <RouterLink to="/activities">{{ t('nav.activities') }}</RouterLink>
          <RouterLink to="/reviews">{{ t('nav.reviews') }}</RouterLink>
          <RouterLink to="/contact">{{ t('nav.contact') }}</RouterLink>
        </div>
        <LanguageSwitcher v-if="!isAdmin" />
        <a
          :href="bookingHref"
          class="btn-book book-desktop"
          @click="$refs.bk.open()"
        >
          {{ t('actions.book') }}
        </a>
      </nav>

      <!-- Backdrop -->
      <div class="backdrop" v-show="open" @click="open = false" aria-hidden="true" />

      <!-- Drawer มือถือ -->
      <aside
        id="mobile-drawer"
        class="drawer"
        :class="{ show: open }"
        role="dialog"
        aria-modal="true"
        :aria-label="t('a11y.navDialog')"
      >
        <div class="drawer-head">
          <div class="brand small">
            <img class="logo" :src="logoSrc" alt="" />
            <div class="brand-text">
              <strong class="brand-title">{{ brandTitle }}</strong>
            </div>
          </div>
          <button class="close" @click="open = false" :aria-label="t('a11y.closeMenu')">×</button>
        </div>

        <nav class="drawer-menu" @click="open = false">
          <RouterLink to="/">{{ t('nav.home') }}</RouterLink>
          <RouterLink to="/rooms">{{ t('nav.rooms') }}</RouterLink>
          <RouterLink to="/activities">{{ t('nav.activities') }}</RouterLink>
          <RouterLink to="/reviews">{{ t('nav.reviews') }}</RouterLink>
          <RouterLink to="/contact">{{ t('nav.contact') }}</RouterLink>
        </nav>

        <div class="drawer-footer">
          <a :href="bookingHref" class="btn-book wide">{{ t('actions.book') }}</a>
        </div>
      </aside>
    </div>
  </header>
<!-- spacer สูงเท่ากับ navbar เพื่อดัน content ลง -->
<div class="nav-offset"></div>
  <BookingPopup ref="bk" />
  <BookingCheck ref="ck" />
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BookingPopup from '@/components/BookingPopup.vue'
import BookingCheck from '@/components/CheckBooking.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const { t } = useI18n()                 // <-- ใช้แปลข้อความ
const route = useRoute()
const isAdmin = computed(() => route.path.startsWith('/admin'))

const logoSrc = new URL('../assets/logo.jpg', import.meta.url).href

const props = defineProps({
  brandTitle: { type: String, default: 'Dorata Hill Khao Yai' },
  brandSub:   { type: String, default: '' },
  bookingHref:{ type: String, default: '#booking' },
})

function goHome() {
  window.location = '/'
}
function goPage() {
  window.open('https://www.facebook.com/messages/t/111132315206571', '_blank')
}

const open = ref(false)
const onKey = (e) => { if (e.key === 'Escape') open.value = false }
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
/* …คง style เดิมของคุณทั้งหมด… */

:root {
  --text: #1a1d22;
  --muted: #6b7280;
  --ring: #e5e7eb;
  --accent: #7aa63a;
  --card: #fff;
  --shadow: 0 10px 24px rgba(16, 24, 40, 0.08);
  --radius: 16px;
}
.lang-switch button { margin-left:8px; }

.nav {
  position: fixed;      /* เดิมเป็น sticky */
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;         /* สูงหน่อย กันทับกับอย่างอื่น */
  background: #fff;
  border-bottom: 1px solid var(--ring);
}

/* ให้ตัวเนื้อในจัดกึ่งกลางเหมือนเดิม */
.bar {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
}


.logo { width: 46px; height: 46px; border-radius: 10px; display: grid; place-items: center; color: #fff; font-weight: 800; padding: 4px; }
.brand { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-width: 0; }
.brand-text { display: flex; flex-direction: column; min-width: 0; }
.brand-title { font-size: 16px; line-height: 1.2; white-space: normal; }
.brand-sub { color: var(--muted); }
.actions { display: flex; align-items: center; gap: 8px; }

/* ปุ่มจอง */
.btn-book { background: #3b3f44; color: #fff; text-decoration: none; font-weight: 700; padding: 8px 8px; border-radius: 12px; display: inline-block; }
.btn-book.wide { width: 100%; text-align: center; background: linear-gradient(180deg, #8fc857, #7aa63a); }

/* Hamburger */
.burger { display: inline-flex; flex-direction: column; gap: 4px; width: 40px; height: 40px; border: 0; background: #8fa34c; color: #fff; border-radius: 10px; justify-content: center; align-items: center; }
.burger span { width: 18px; height: 2px; background: #fff; border-radius: 2px; }

/* เมนูเดสก์ท็อป */
.menu-desktop { display: none; max-width: 1200px; padding: 0 16px 0 16px; align-items: center; justify-content: space-between; gap: 10px; }
.menu-links { display: flex; gap: 10px; }
.menu-desktop a { text-decoration: none; font-weight: 700; }
.menu-desktop a.router-link-active { color: var(--accent); }

/* ===== Responsive rules ===== */
@media (min-width: 901px) {
  .menu-desktop { display: flex; }
  .burger, .book-mobile { display: none; }
  .book-desktop { display: inline-block; }
  .brand-text { font-weight: 800; font-size: x-large;}

  .bar {
    width: 100%;
    margin: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 16px;
  }
}
@media (max-width: 900px) {
  .menu-desktop, .book-desktop { display: none; }
  .book-mobile { display: inline-block; }
  .brand-text { font-weight: 800; }
  .bar {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 16px;
  }
}

/* Backdrop + Drawer */
.backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 45; display: none; }
.backdrop[style*="display: block"], .backdrop[v-show] { display: block; }

.drawer { position: fixed; top: 0; right: 0; height: 100%; width: min(88vw, 380px); background: #fff; box-shadow: -20px 0 40px rgba(0, 0, 0, 0.15); transform: translateX(100%); transition: transform 0.24s ease; z-index: 50; display: flex; flex-direction: column; }
.drawer.show { transform: translateX(0); }
.drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--ring); }
.brand.small .logo { width: 28px; height: 28px; }
.close { border: 0; background: #8fa34c; color: #fff; width: 34px; height: 34px; border-radius: 8px; font-size: 20px; }

.drawer-menu { display: flex; flex-direction: column; gap: 14px; padding: 16px; }
.drawer-menu a { text-decoration: none; color: var(--text); font-weight: 600; }
.drawer-menu a.router-link-active { color: var(--accent); }
.drawer-footer { margin-top: auto; padding: 16px; border-top: 1px solid var(--ring); }
.nav-offset {
  height: 72px; /* ปรับตามความสูงจริงของ navbar */
}

@media (max-width: 900px) {
  .nav-offset {
    height: 64px;
  }
}
</style>
