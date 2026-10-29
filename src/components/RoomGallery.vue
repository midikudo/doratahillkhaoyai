<!-- src/components/RoomGallery.vue -->
<template>
    <!-- 0 รูป -->
    <section v-if="n === 0" class="g none">
      <figure class="ph"><img :src="ph" alt="No Image" /></figure>
    </section>
  
    <!-- 1 รูป -->
    <section v-else-if="n === 1" class="g one">
      <figure class="big"><img :src="imgs[0]" @error="err($event)" alt="room"/></figure>
    </section>
  
    <!-- 2 รูป : ซ้าย ‘สูง’, ขวา ‘ยาว’ -->
    <section v-else-if="n === 2" class="g two">
      <figure class="tall">
        <img :src="imgs[0]" @error="err($event)" alt="room tall"/>
      </figure>
      <figure class="wide">
        <img :src="imgs[1]" @error="err($event)" alt="room wide"/>
      </figure>
    </section>
  
    <!-- 3 รูป : เหมือนที่ใช้อยู่ -->
    <section v-else-if="n === 3" class="g three">
      <figure class="big">
        <img :src="imgs[0]" @error="err($event)" alt="room"/>
      </figure>
      <div class="side">
        <figure><img :src="imgs[1]" @error="err($event)" alt="room"/></figure>
        <figure><img :src="imgs[2]" @error="err($event)" alt="room"/></figure>
      </div>
    </section>
  
    <!-- 4 รูป -->
    <section v-else-if="n === 4" class="g four">
      <figure v-for="(src,i) in imgs" :key="i"><img :src="src" @error="err($event)" alt="room"/></figure>
    </section>
  
    <!-- 5 รูปขึ้นไป (ตัดเหลือ 5) -->
    <section v-else class="g five">
      <figure class="big"><img :src="imgs[0]" @error="err($event)" alt="room"/></figure>
      <div class="side5">
        <figure v-for="(src,i) in imgs.slice(1,5)" :key="i"><img :src="src" @error="err($event)" alt="room"/></figure>
        <div v-if="count > 5" class="more">+{{ count-5 }}</div>
      </div>
    </section>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const ph = 'https://placehold.co/800x600?text=No+Image'
  const props = defineProps({
    images: { type: Array, default: () => [] } // แต่ละตัวมี { file_path }
  })
  
  const count = computed(() => (props.images?.length || 0))
  const n = computed(() => Math.min(count.value, 5))
  const imgs = computed(() =>
    (props.images || []).slice(0,5).map(im => im?.file_path || ph)
  )
  
  function err(e){ e.target.src = ph }
  </script>
  
  <style scoped>
  .g { width: 100%; border-radius: 18px; overflow: hidden; }
  .g img { width: 100%; height: 100%; object-fit: cover; display: block; }
  
  /* 0 รูป */
  .g.none .ph { aspect-ratio: 4/3; }
  
  /* 1 รูป */
  .g.one .big { aspect-ratio: 16/10; }
  
  /* 2 รูป — ซ้ายสูง ขวากว้าง */
  .g.two {
    display: grid;
    grid-template-columns: 7fr 5fr;    /* ซ้ายกว้างกว่าเล็กน้อย */
    grid-template-rows: 1fr 1fr;       /* สองแถวเท่ากัน */
    gap: 12px;
  }
  .g.two .tall {
    grid-column: 1;
    grid-row: 1 / span 2;              /* กินสองแถว → รูป ‘สูง’ */
    aspect-ratio: 3/4;                  /* แนวตั้ง */
  }
  .g.two .wide {
    grid-column: 2;
    grid-row: 1 / span 2;              /* สูงเท่าฝั่งซ้าย */
    aspect-ratio: 4/3;                  /* แนวนอน */
  }
  @media (max-width: 640px){
    .g.two { grid-template-columns: 1fr; grid-template-rows: auto; }
    .g.two .tall, .g.two .wide { grid-row: auto; grid-column: auto; }
    .g.two .tall { aspect-ratio: 4/5; }
    .g.two .wide { aspect-ratio: 16/9; }
  }
  
  /* 3 รูป */
  .g.three { display:grid; grid-template-columns: 2fr 1fr; gap:12px; }
  .g.three .big { aspect-ratio: 4/3; }
  .g.three .side { display:grid; gap:12px; }
  .g.three .side figure { aspect-ratio: 1/1; }
  
  /* 4 รูป */
  .g.four { display:grid; grid-template-columns: repeat(2,1fr); gap:12px; }
  .g.four figure { aspect-ratio: 4/3; }
  
  /* 5 รูปขึ้นไป */
  .g.five { display:grid; grid-template-columns: 2fr 1fr; gap:12px; }
  .g.five .big { aspect-ratio: 4/3; }
  .g.five .side5 { display:grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap:12px; position:relative; }
  .g.five .side5 figure { aspect-ratio: 1/1; }
  .g.five .more {
    position:absolute; right:10px; bottom:10px;
    background: rgba(0,0,0,.55); color:#fff; padding:6px 10px; border-radius:10px; font-weight:700;
  }
  </style>
  