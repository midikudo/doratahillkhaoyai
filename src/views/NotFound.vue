<template>
    <section style="text-align:center;padding:60px 0">
      <h1>404 — ไม่พบหน้า</h1>
      <p>ขออภัย ไม่พบหน้าที่คุณต้องการ</p>
      <RouterLink to="/" class="btn">กลับหน้าแรก</RouterLink>
    </section>
  </template>
  
  <script setup>
  import { RouterLink } from 'vue-router'
  </script>
  
  <style scoped>
  .btn{display:inline-block;margin-top:12px;padding:10px 16px;border-radius:12px;
  background:linear-gradient(180deg,#8fc857,#7aa63a);color:#fff;text-decoration:none;font-weight:700}
  </style>
  