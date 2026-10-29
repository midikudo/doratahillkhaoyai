<!-- src/views/Contact.vue -->
<template>
  <section class="contact">
    <div class="left-tools">
        <button class="ghost back" @click="goHome" aria-label="กลับหน้าแรก">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M15 18l-6-6 6-6"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="label">{{ t('rooms.backToList') || 'กลับหน้าแรก' }}</span>
        </button>
         <h1>{{ t('contact.title') }}</h1>
      </div>
   
    <ul>
      <li>
        {{ t('contact.phone') }}: 
        <a href="tel:0619199596">061 919 9596</a>
      </li>
      <li>
        LINE:
        <span>@doratahill</span>
      </li>
      <li>
        <a
          href="https://line.me/R/ti/p/@doratahill"
          target="_blank"
          rel="noopener"
        >
          {{ t('contact.addLine') }}
        </a>
      </li>
      <li>
        <a
          href="https://maps.app.goo.gl/rrjUfUcSoekKUMPHA"
          target="_blank"
          rel="noopener"
          style="color: blueviolet"
        >
          {{ t('contact.map') }}

        </a>
      </li>
      <li>
        
        {{ t('contact.address') }}

    </li>
      <li>
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.7460346284865!2d101.5234815!3d14.556510500000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x311c31938d543b11%3A0xe363e23be6d164b9!2sDoratahill%20khaoyai!5e0!3m2!1sen!2sth!4v1763020171494!5m2!1sen!2sth" width="100%" height="350" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>

      </li>
     
    </ul>
  </section>
</template>

<script setup>
import { useT } from '@/components/useT'
import { useRouter } from 'vue-router'
const { t } = useT()
const router = useRouter()
// ปุ่มกลับหน้าแรก
function goHome () {
  router.push({ name: 'home' }) // หรือ router.push('/')
}
</script>

<style scoped>
.contact {
  max-width: 800px;
  margin: 24px auto;
  padding: 16px;
}
.contact h1 {
  margin-bottom: 12px;
}
.contact ul {
  list-style: none;
  padding: 0;
}
.contact li {
  margin-bottom: 8px;
}
.left-tools{
  display: flex;
  align-items: center;
  justify-content: start;

}
/* ปุ่มกลับ */
.ghost {
  border: 1px solid var(--ring);
  background: #fff;
  color: var(--text);
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
}
.ghost.back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  margin-right: 10px;
}
</style>
