<template>
  <NavBar
    brand-title="Dorata Hill Khao Yai"
    brand-sub=""
    logo-src="/logo.png"
    booking-href="#booking"
  />

  <div class="app">
    <!-- Route outlet -->
    <div>
      <RouterView />
      <!-- FB Chat root + chat box -->
    </div>
    <!-- <footer class="footer">
      <small>© {{ year }} Pool Villa — All rights reserved</small>
    </footer> -->
  </div>

  <footer class="footer pt-3">
    <div class="container-fluid">
      <div
        style="
          display: flex;
          text-align: center;
          justify-content: center;
          white-space: nowarp;
        "
      >
        © {{ year }} Soft by
        <RouterLink
          style="align-items: center; white-space: nowrap; display: flex"
          href="https://www.facebook.com/gigkaju.studio"
          target="_blank"
          rel="noopener">
          <img src="./assets/lgg.png" width="20" alt="logo" />
          ɢɪɢᴀᴊᴜꜱᴛᴜᴅɪᴏ.</RouterLink>
      </div>
    </div>
  </footer>
</template>
<script setup>
import { RouterLink, RouterView } from "vue-router";
import { onMounted } from "vue";
import NavBar from "@/components/NavBar.vue";
import { useRouter } from 'vue-router'
const router = useRouter();
const logoImg = new URL("./assets/logo.jpg", import.meta.url).href;
const year = new Date().getFullYear();
</script>

<style scoped>
/* ใส่ global css ของคุณ */
.fb_dialog,
.fb-customerchat > span {
  margin-bottom: 10px !important;
}

.app {
  min-height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: #f6f7f9;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #111;
}
.logo {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 800;
  padding: 4px;
  background: linear-gradient(135deg, #8fc857, #7aa63a);
}
.brand-text {
  font-weight: 800;
  font-size: xx-large;
}
.nav {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}
.nav a {
  color: #111;
  text-decoration: none;
  font-weight: 600;
  opacity: 0.85;
}
.nav a.active {
  color: #7aa63a;
}
.btn {
  background: linear-gradient(180deg, #8fc857, #7aa63a);
  color: #fff;
  padding: 10px 14px;
  border-radius: 12px;
}
.page {
  padding: 20px;
  max-width: 1200px;
  margin: auto;
  width: 100%;
}
.footer {
  padding: 18px;
  color: #6b7280;
  text-align: center;
}
@media (max-width: 760px) {
  .nav {
    gap: 12px;
  }
  .page {
    padding: 16px;
  }
  .brand-text {
    font-weight: 600;
    font-size: 13px;
  }
}
</style>
