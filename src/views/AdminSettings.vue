<template>
    <div class="card">
      <h2>ข้อมูลประกอบอื่น ๆ & ลิงก์จอง</h2>
      <form class="grid" @submit.prevent="saveAll">
        <label>จำนวนที่จอดรถ</label>
        <input v-model="state.parking_count" type="number" min="0" />
        <label>การสั่งอาหาร (ข้อความ/วิธีการ)</label>
        <textarea v-model="state.food_ordering" rows="3" />
        <label>ร้านค้าถ่าน/น้ำแข็ง/อาหารสด (ไทยฟู๊ด/CP/ตลาด)</label>
        <textarea v-model="state.shops_info" rows="4" />
        <label>ลิงก์จอง (PAGE)</label>
        <input v-model="state.booking_page" placeholder="https://your.site/booking" />
        <label>ลิงก์จอง (LINE OA)</label>
        <input v-model="state.booking_line" placeholder="https://line.me/R/ti/p/@your-oa" />
        <button class="btn">บันทึก</button>
      </form>
    </div>
  </template>
  
  <script setup>
  import { reactive, onMounted } from 'vue'
  const keys = ['parking_count','food_ordering','shops_info','booking_page','booking_line']
  const state = reactive({ parking_count:'', food_ordering:'', shops_info:'', booking_page:'', booking_line:'' })
  function getAdminToken() {
  return localStorage.getItem('adm_token') || '';
}

function ensureAuthOrRedirect() {
  const t = getAdminToken();
  if (!t) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    window.location.assign(`/admin/login?redirect=${redirect}`);
    throw new Error('missing_token');
  }
  return t;
}
  async function load(){
    const token = ensureAuthOrRedirect();
    const r=await fetch('/api/settings/get.php?skeys='+keys.join(','))
    const d=await r.json()
    if(d.ok){ for(const it of d.items){ state[it.skey] = it.svalue } }
  }
  async function saveAll(){
    await Promise.all(keys.map(k => fetch('/api/settings/set.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:k,value:String(state[k]??'')})})))
    alert('บันทึกแล้ว')
  }
  onMounted(load)
  </script>
  
  <style scoped>
  .card{ background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:16px;box-shadow:0 10px 20px rgba(16,24,40,.06) }
  .grid{ display:grid; gap:10px; max-width:760px }
  input,textarea{ padding:10px 12px; border-radius:10px; border:1px solid #e5e7eb; font-size:16px }
  .btn{ justify-self:start; background:linear-gradient(180deg,#8fc857,#7aa63a); color:#fff; border:0; padding:10px 14px; border-radius:10px; font-weight:700; cursor:pointer }
  </style>
  