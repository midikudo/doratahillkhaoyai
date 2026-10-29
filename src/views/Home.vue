<template>
  <section class="hero">
      <div class="slider" @mouseenter="pause" @mouseleave="play">
        <button class="nav prev" @click="go(-1)" :aria-label="t('a11y.prev')">
          ‹
        </button>

        <div class="viewport">
          <div
            class="track"
            :style="{ transform: `translateX(-${idx * 100}%)` }"
          >
            <div v-for="(s, i) in slides" :key="i" class="slide">
              <img
                :src="s.file_path || s"
                :alt="s.alt_text || `slide ${i + 1}`"
                loading="lazy"
              />
              <div class="caption" v-if="s.alt_text">{{ s.alt_text }}</div>
            </div>
          </div>
        </div>
        <button class="nav next" @click="go(1)" :aria-label="t('a11y.next')">
          ›
        </button>

        <div class="dots">
          <button
            v-for="(s, i) in slides"
            :key="i"
            :class="{ active: idx === i }"
            @click="idx = i"
            :aria-label="t('a11y.gotoSlide', { n: i + 1 })"
          />
        </div>
      </div>

      <!-- ===== ใต้ฮีโร่: Quick actions ===== -->
      <section class="quick-card">
        <!-- โทร -->
        <a class="quick-item" :href="`tel:${phone}`">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6.6 10.8c1.2 2.3 3.1 4.2 5.4 5.4l2-2c.3-.3.8-.4 1.2-.3 1 .3 2 .5 3 .5.7 0 1.3.6 1.3 1.3v3.1c0 .7-.6 1.3-1.3 1.3C9.8 20.1 3.9 14.2 3.9 6.7c0-.7.6-1.3 1.3-1.3h3.1c.7 0 1.3.6 1.3 1.3 0 1 .2 2 .5 3 .1.4 0 .9-.3 1.2l-2.2 2Z"
            />
          </svg>
          <div class="qi-text">
            <strong>{{ t("home.quick.tel") }}</strong>
            <span>{{ displayPhone }}</span>
          </div>
        </a>

        <!-- LINE -->
        <a
          class="quick-item"
          :href="lineUrl"
          target="_blank"
          rel="noopener"
          @click="goLine"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 3C6.5 3 2 6.7 2 11.4c0 3.2 2.1 5.9 5.1 7.3l-.4 2.5c-.1.7.6 1.2 1.2.9l3-1.7c.4 0 .7.1 1.1.1 5.5 0 10-3.7 10-8.4S17.5 3 12 3Z"
            />
          </svg>
          <div class="qi-text">
            <strong>{{ t("home.quick.line") }}</strong>
            <span>@{{ lineId }}</span>
          </div>
        </a>

        <!-- เช็ควันว่าง -->
        <a class="quick-item" href="#" @click.prevent="$refs.ck.open()">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22Zm0 2a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm1 4h-2v6l5 3 .9-1.8-3.9-2.2V7Z"
            />
          </svg>
          <div class="qi-text">
            <strong>{{ t("home.quick.check") }}</strong>
            <span>{{ t("home.quick.available") }}</span>
          </div>
        </a>

        <!-- ติดต่อจอง -->
        <button class="quick-item" type="button" @click.prevent="goPage()">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V2Zm13 7H4v10h16V9Z"
            />
          </svg>
          <div class="qi-text">
            <strong>{{ t("home.quick.contact") }}</strong>
            <span>{{ t("home.quick.fastReply") }}</span>
          </div>
        </button>
      </section>

      <div class="hero-text">
        <h1 class="title-site">
          Dorata Hill <span class="nowrap">Khao Yai</span>
        </h1>
        <p class="tag">{{ t("home.heroTag") }}</p>
        <div class="cta">
          <RouterLink to="/rooms" class="btn">{{
            t("home.viewRooms")
          }}</RouterLink>
        </div>
      </div>
    </section>
  <div class="wrap">
    <!-- ================= HERO / SLIDER ================= -->
    

    <!-- ================= ROOMS ================= -->
    <section class="rooms">
      <header class="sec-head">
        <h2>{{ t("home.roomsTitle") }}</h2>
        <RouterLink to="/rooms" class="more">{{
          t("common.viewAll")
        }}</RouterLink>
      </header>

      <div v-if="roomsLoading" class="state">{{ t("common.loading") }}</div>
      <div v-else-if="rooms.length === 0" class="state muted">
        {{ t("home.noRooms") }}
      </div>

      <div v-else class="grid">
        <article v-for="r in rooms.slice(0, 6)" :key="r.id" class="card">
          <section class="collage5">
            <div class="col left">
              <figure class="ph a">
                <img
                  :src="imgAt(r, 0)"
                  loading="eager"
                  @error="onErr"
                  :alt="r.name + ' 1'"
                />
              </figure>
              <figure class="ph c" v-if="has(r, 2)">
                <img
                  :src="imgAt(r, 2)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 3'"
                />
              </figure>
            </div>

            <div class="col right">
              <figure class="ph b" v-if="has(r, 1)">
                <img
                  :src="imgAt(r, 1)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 2'"
                />
              </figure>
              <figure class="ph d" v-if="has(r, 3)">
                <img
                  :src="imgAt(r, 3)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 4'"
                />
              </figure>
              <figure class="ph e" v-if="has(r, 4)">
                <img
                  :src="imgAt(r, 4)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 5'"
                />
              </figure>
            </div>
          </section>

          <div class="meta">
            <h3 v-if="r.name_th && lang === 'th'">{{ r.name_th }}</h3>
            <h3 v-if="r.name_en && lang === 'en'">{{ r.name_en }}</h3>
            <p
              class="desc"
              v-if="r.description_th && lang === 'th'"
              v-html="r.description_th"
            ></p>
            <p
              class="desc"
              v-if="r.description_en && lang === 'en'"
              v-html="r.description_en"
            ></p>

            <RouterLink
              :to="{ name: 'room-detail', params: { id: r.id } }"
              class="link"
              >{{ t("common.details") }}</RouterLink
            >
          </div>
        </article>
      </div>
    </section>

    <!-- ================= FACILITIES สิ่งอำนวยความสะดวก ================= -->
    <section class="fac">
      <header class="sec-head">
        <h2>{{ t("home.facilitiesTitle") }}</h2>
        <RouterLink 
        :to="{ name: 'facilities', query: { category: 'kitchen' } }"
        class="more">{{
          t("common.viewAll")
        }}</RouterLink>
      </header>

      <div v-if="facLoading" class="state">{{ t("common.loading") }}</div>
      <div v-else-if="facilities.length === 0" class="state muted">
        {{ t("home.noData") }}
      </div>

      <div v-else class="grid">
        <article v-for="r in facilities.slice(0, 8)" :key="r.id" class="card">
          <section class="collage5">
            <div class="col left">
              <figure class="ph a">
                <img
                  :src="imgAt(r, 0)"
                  loading="eager"
                  @error="onErr"
                  :alt="r.name + ' 1'"
                />
              </figure>
              <figure class="ph c" v-if="has(r, 2)">
                <img
                  :src="imgAt(r, 2)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 3'"
                />
              </figure>
            </div>

            <div class="col right">
              <figure class="ph b" v-if="has(r, 1)">
                <img
                  :src="imgAt(r, 1)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 2'"
                />
              </figure>
              <figure class="ph d" v-if="has(r, 3)">
                <img
                  :src="imgAt(r, 3)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 4'"
                />
              </figure>
              <figure class="ph e" v-if="has(r, 4)">
                <img
                  :src="imgAt(r, 4)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 5'"
                />
              </figure>
            </div>
          </section>
          <div class="meta">
            <h3 v-if="r.name_th && lang === 'th'">{{ r.name_th }}</h3>
            <h3 v-if="r.name_en && lang === 'en'">{{ r.name_en }}</h3>
            <p
              class="desc"
              v-if="r.description_th && lang === 'th'"
              v-html="r.description_th"
            ></p>
            <p
              class="desc"
              v-if="r.description_en && lang === 'en'"
              v-html="r.description_en"
            ></p>
          </div>
        </article>
      </div>
    </section>

    <!-- ================= ACTIVITIES กิจกรรมภายในบ้าน ================= -->
    <section class="acts">
      <header class="sec-head">
        <h2>{{ t("home.activitiesTitle") }}</h2>
        <RouterLink to="/activities" class="more">{{
          t("common.viewAll")
        }}</RouterLink>
      </header>

      <div v-if="actsLoading" class="state">{{ t("common.loading") }}</div>
      <div v-else-if="acts.length === 0" class="state muted">
        {{ t("home.noActivities") }}
      </div>

      <div v-else class="grid">
        <article v-for="r in acts.slice(0, 6)" :key="r.id" class="card">
          <section class="collage5">
            <div class="col left">
              <figure class="ph a">
                <img
                  :src="imgAt(r, 0)"
                  loading="eager"
                  @error="onErr"
                  :alt="r.name + ' 1'"
                />
              </figure>
              <figure class="ph c" v-if="has(r, 2)">
                <img
                  :src="imgAt(r, 2)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 3'"
                />
              </figure>
            </div>

            <div class="col right">
              <figure class="ph b" v-if="has(r, 1)">
                <img
                  :src="imgAt(r, 1)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 2'"
                />
              </figure>
              <figure class="ph d" v-if="has(r, 3)">
                <img
                  :src="imgAt(r, 3)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 4'"
                />
              </figure>
              <figure class="ph e" v-if="has(r, 4)">
                <img
                  :src="imgAt(r, 4)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 5'"
                />
              </figure>
            </div>
          </section>

          <div class="meta">
            <h3 v-if="r.name_th && lang === 'th'">{{ r.name_th }}</h3>
            <h3 v-if="r.name_en && lang === 'en'">{{ r.name_en }}</h3>
            <p
              class="desc"
              v-if="r.description_th && lang === 'th'"
              v-html="r.description_th"
            ></p>
            <p
              class="desc"
              v-if="r.description_en && lang === 'en'"
              v-html="r.description_en"
            ></p>
            <RouterLink :to="{ name: 'activities' }" class="link">{{
              t("common.details")
            }}</RouterLink>
          </div>
        </article>
      </div>
    </section>

    <section class="news">
      <header class="sec-head">
        <h2>{{ t("home.newsTitle") }}</h2>
      </header>

      <div v-if="newsLoading" class="state">{{ t("common.loading") }}</div>
      <div v-else-if="newsItems.length === 0" class="state muted">
        {{ t("home.noNews") }}
      </div>

      <div v-else class="news-grid">
        <article v-for="(r, i) in newsItems" :key="i" class="news-card">
          <img v-if="r.image" :src="r.image" :alt="r.title" loading="lazy" />
          <div class="meta">
            <h3 v-if="r.title_th && lang === 'th'">{{ r.title_th }}</h3>
            <h3 v-if="r.title_en && lang === 'en'">{{ r.title_en }}</h3>
            <p class="desc" v-if="r.body_th && lang === 'th'">
              {{ r.body_th }}
            </p>
            <p class="desc" v-if="r.body_en && lang === 'en'">
              {{ r.body_en }}
            </p>
            <a
              v-if="r.link"
              :href="r.link"
              target="_blank"
              rel="noopener"
              class="link"
            >
              {{ t("common.readMore") }}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="4 0 18 18"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              >
                <polyline points="13 17 18 12 13 7"></polyline>
                <polyline points="6 17 11 12 6 7"></polyline>
              </svg>
            </a>
          </div>
        </article>
      </div>
    </section>

    <!-- ================= REVIEWS ================= -->
    <!-- <section class="reviews">
      <header class="sec-head">
        <h2>{{ t("home.reviewsTitle") }}</h2>
        <RouterLink to="/reviews" class="more">{{
          t("common.viewAll")
        }}</RouterLink>
      </header>

      <div v-if="reviewsLoading" class="state">{{ t("common.loading") }}</div>
      <div v-else-if="reviews.length === 0" class="state muted">
        {{ t("home.noReviews") }}
      </div>

      <div v-else class="grid">
        <article v-for="r in reviews.slice(0, 6)" :key="r.id" class="card">
          <section class="collage5">
            <div class="col left">
              <figure class="ph a">
                <img
                  :src="imgAt(r, 0)"
                  loading="eager"
                  @error="onErr"
                  :alt="r.name + ' 1'"
                />
              </figure>
              <figure class="ph c" v-if="has(r, 2)">
                <img
                  :src="imgAt(r, 2)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 3'"
                />
              </figure>
            </div>

            <div class="col right">
              <figure class="ph b" v-if="has(r, 1)">
                <img
                  :src="imgAt(r, 1)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 2'"
                />
              </figure>
              <figure class="ph d" v-if="has(r, 3)">
                <img
                  :src="imgAt(r, 3)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 4'"
                />
              </figure>
              <figure class="ph e" v-if="has(r, 4)">
                <img
                  :src="imgAt(r, 4)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 5'"
                />
              </figure>
            </div>
          </section>

          <div class="meta">
            <strong>{{ r.author_name || t("reviews.anonymous") }}</strong>
            <span class="muted"> · ⭐ {{ r.rating }}/5</span>
            <div
              class="desc"
              v-if="r.content_th && lang === 'th'"
              v-html="r.content_th"
            ></div>
            <div
              class="desc"
              v-if="r.content_en && lang === 'en'"
              v-html="r.content_en"
            ></div>
          </div>
        </article>
      </div>
    </section>  -->
    <section class="reviews">
      <header class="sec-head">
        <h2>{{ t("home.reviewsTitle") }}</h2>
      </header>

      <!-- รีวิวจากฐานข้อมูลของเราเอง (AdminReview) -->
      <div v-if="reviewsLoading" class="state">{{ t("common.loading") }}</div>
      <div v-else-if="reviews.length === 0" class="state muted">
        {{ t("home.noReviews") }}
      </div>

      <div v-else class="grid">
        <article v-for="r in reviews.slice(0, 6)" :key="r.id" class="card">
          <section class="collage5">
            <div class="col left">
              <figure class="ph a">
                <img
                  :src="imgAt(r, 0)"
                  loading="eager"
                  @error="onErr"
                  :alt="r.name + ' 1'"
                />
              </figure>
              <figure class="ph c" v-if="has(r, 2)">
                <img
                  :src="imgAt(r, 2)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 3'"
                />
              </figure>
            </div>

            <div class="col right">
              <figure class="ph b" v-if="has(r, 1)">
                <img
                  :src="imgAt(r, 1)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 2'"
                />
              </figure>
              <figure class="ph d" v-if="has(r, 3)">
                <img
                  :src="imgAt(r, 3)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 4'"
                />
              </figure>
              <figure class="ph e" v-if="has(r, 4)">
                <img
                  :src="imgAt(r, 4)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 5'"
                />
              </figure>
            </div>
          </section>

          <div class="meta">
            <strong>{{ r.author_name || t("reviews.anonymous") }}</strong>
            <span class="muted"> · ⭐ {{ r.rating }}/5</span>
            <div
              class="desc"
              v-if="r.content_th && lang === 'th'"
              v-html="r.content_th"
            ></div>
            <div
              class="desc"
              v-if="r.content_en && lang === 'en'"
              v-html="r.content_en"
            ></div>
          </div>
        </article>
        <!--  การ์ด Facebook -->
          <article class="card">
          
         
<div class="">
  <h3>รีวิวบน Facebook</h3>

  <div
    class="fb-page"
    data-href="https://www.facebook.com/doratahillkhaoyai/"
    data-tabs="recommendations"
    data-width="380"
    data-height="260"
    data-small-header="false"
    data-adapt-container-width="true"
    data-hide-cover="false"
    data-show-facepile="false"
  >
    <blockquote
      cite="https://www.facebook.com/doratahillkhaoyai/"
      class="fb-xfbml-parse-ignore"
    >
      <a
        href="https://www.facebook.com/doratahillkhaoyai/"
        target="_blank"
        rel="noopener"
      >
        Dorata Hill Khao Yai
      </a>
    </blockquote>
  </div>

  <p class="muted" style="margin-top:8px;font-size:13px;">
    สามารถกดปุ่มด้านล่างเพื่ออ่านรีวิวทั้งหมดบน Facebook
  </p>
  <a
    href="https://www.facebook.com/doratahillkhaoyai/reviews"
    target="_blank"
    rel="noopener"
    class="link"
  >
    ดูรีวิวทั้งหมดบน Facebook
  </a>
</div>

      </article>
      <!-- การ์ด Google Maps -->
<article class="card">
  <h3>รีวิวบน Google Maps</h3>

  <p v-if="googlePlaceInfo" class="muted">
    คะแนนรวม {{ googlePlaceInfo.rating }}/5 จาก {{ googlePlaceInfo.total_ratings }} รีวิว
  </p>

  <ul v-if="googleReviews.length" class="g-rev-list">
    <li v-for="(rv, i) in googleReviews.slice(0,3)" :key="i" class="g-rev-item">
      <div class="g-rev-head">
        <strong>{{ rv.author_name }}</strong>
        <span>· ⭐ {{ rv.rating }}/5</span>
        <span class="g-rev-time">· {{ rv.relative_time }}</span>
      </div>
      <p class="g-rev-text">{{ rv.text }}</p>
    </li>
  </ul> 

  <!-- ถ้าโหลดไม่ได้ / ไม่มีรีวิว ให้ fallback เป็น map + ลิงก์ -->
  <div v-else>
    <iframe
      src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7723.49205175516!2d101.523482!3d14.556510999999999!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x311c31938d543b11%3A0xe363e23be6d164b9!2sDoratahill%20khaoyai!5e0!3m2!1sen!2sth!4v1763139634265!5m2!1sen!2sth"
      style="border:0; width:100%; height:260px;"
      allowfullscreen=""
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
    ></iframe>
  </div>

  <a
    href="https://www.google.com/maps/place/Doratahill+khaoyai/@14.5565105,101.5209066,17z/data=!3m1!4b1!4m20!1m10!3m9!1s0x311c31938d543b11:0xe363e23be6d164b9!2sDoratahill+khaoyai!5m2!4m1!1i2!8m2!3d14.5565105!4d101.5234815!16s%2Fg%2F11k530r0l4!3m8!1s0x311c31938d543b11:0xe363e23be6d164b9!5m2!4m1!1i2!8m2!3d14.5565105!4d101.5234815!16s%2Fg%2F11k530r0l4?hl=en&entry=ttu&g_ep=EgoyMDI1MTExMS4wIKXMDSoASAFQAw%3D%3D"
    target="_blank"
    rel="noopener"
    class="link"
  >
    ดูรีวิวทั้งหมดบน Google Maps
  </a>
</article>

    </div>
    </section>

    <!-- ================= NEARBY ATTRACTIONS ================= -->
    <section class="block">
      <header class="sec-head">
        <h2>{{ t("home.attractionsTitle") }}</h2>
        <RouterLink to="/activities" class="more">{{
          t("common.viewAll")
        }}</RouterLink>
      </header>

      <div class="block-head">
        <div class="tools">
          <input
            v-model.trim="qAtt"
            class="search"
            :placeholder="t('common.searchPlaceholder')"
            style="
              padding: 10px 14px;
              border-radius: 12px;
              border: solid 1px #ccc;
              margin-right: 10px;
            "
          />
          <button class="btn" @click="loadAttractions" :disabled="loadingAtt">
            {{ loadingAtt ? t("common.loading") : t("common.refresh") }}
          </button>
        </div>
      </div>

      <div v-if="errAtt" class="state error">{{ errAtt }}</div>
      <div v-else-if="loadingAtt" class="state">
        {{ t("common.loadingData") }}
      </div>
      <div v-else-if="attractions.length === 0" class="state">
        {{ t("home.noAttractions") }}
      </div>

      <div v-else class="grid">
        <article
          v-for="r in attractions.slice(0, 6)"
          :key="r.id"
          class="card"
          style="margin-top: 20px"
        >
          <section class="collage5">
            <div class="col left">
              <figure class="ph a">
                <img
                  :src="imgAt(r, 0)"
                  loading="eager"
                  @error="onErr"
                  :alt="r.name + ' 1'"
                />
              </figure>
              <figure class="ph c" v-if="has(r, 2)">
                <img
                  :src="imgAt(r, 2)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 3'"
                />
              </figure>
            </div>

            <div class="col right">
              <figure class="ph b" v-if="has(r, 1)">
                <img
                  :src="imgAt(r, 1)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 2'"
                />
              </figure>
              <figure class="ph d" v-if="has(r, 3)">
                <img
                  :src="imgAt(r, 3)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 4'"
                />
              </figure>
              <figure class="ph e" v-if="has(r, 4)">
                <img
                  :src="imgAt(r, 4)"
                  loading="lazy"
                  @error="onErr"
                  :alt="r.name + ' 5'"
                />
              </figure>
            </div>
          </section>
          <div class="meta">
            <h3 v-if="r.name_th && lang === 'th'">{{ r.name_th }}</h3>
            <h3 v-if="r.name_en && lang === 'en'">{{ r.name_en }}</h3>
            <p
              class="desc"
              v-if="r.description_th && lang === 'th'"
              v-html="r.description_th"
            ></p>
            <p
              class="desc"
              v-if="r.description_en && lang === 'en'"
              v-html="r.description_en"
            ></p>
          </div>
        </article>
      </div>
    </section>

    <!-- ================= ARTICLES ================= -->
    <section class="articles">
      <header class="sec-head">
        <h2>{{ t("home.articlesTitle") }}</h2>
        <RouterLink to="/blog" class="more">{{
          t("common.viewAll")
        }}</RouterLink>
      </header>
      <div class="state muted">
        {{ t("home.articlesTeaser") }}
      </div>
      <section class="">
        <div class="hp-grid">
          <article v-for="p in posts" :key="p.id" class="hp-card">
            <h3>{{ lang === "en" ? p.title_en : p.title_th }}</h3>
            <p>
              {{ lang === "en" ? p.body_en : p.body_th }}
            </p>
          </article>
        </div>
      </section>
    </section>

    <!-- ================= CONTACT ================= -->
    <section id="contact" class="contact">
      <header class="sec-head">
        <h2>{{ t("home.contactTitle") }}</h2>
      </header>
      <div class="contact-grid">
        <div class="box">
          <p class="lead">{{ t("home.contactLead") }}</p>
          <div class="cta">
            <a :href="lineHref" target="_blank" class="btn">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-line"
                viewBox="0 0 16 16"
              >
                <path
                  d="M8 0c4.411 0 8 2.912 8 6.492 0 1.433-.555 2.723-1.715 3.994-1.678 1.932-5.431 4.285-6.285 4.645-.83.35-.734-.197-.696-.413l.003-.018.114-.685c.027-.204.055-.521-.026-.723-.09-.223-.444-.339-.704-.395C2.846 12.39 0 9.701 0 6.492 0 2.912 3.59 0 8 0M5.022 7.686H3.497V4.918a.156.156 0 0 0-.155-.156H2.78a.156.156 0 0 0-.156.156v3.486c0 .041.017.08.044.107v.001l.002.002.002.002a.15.15 0 0 0 .108.043h2.242c.086 0 .155-.07.155-.156v-.56a.156.156 0 0 0-.155-.157m.791-2.924a.156.156 0 0 0-.156.156v3.486c0 .086.07.155.156.155h.562c.086 0 .155-.07.155-.155V4.918a.156.156 0 0 0-.155-.156zm3.863 0a.156.156 0 0 0-.156.156v2.07L7.923 4.832l-.013-.015v-.001l-.01-.01-.003-.003-.011-.009h-.001L7.88 4.79l-.003-.002-.005-.003-.008-.005h-.002l-.003-.002-.01-.004-.004-.002-.01-.003h-.002l-.003-.001-.009-.002h-.006l-.003-.001h-.004l-.002-.001h-.574a.156.156 0 0 0-.156.155v3.486c0 .086.07.155.156.155h.56c.087 0 .157-.07.157-.155v-2.07l1.6 2.16a.2.2 0 0 0 .039.038l.001.001.01.006.004.002.008.004.007.003.005.002.01.003h.003a.2.2 0 0 0 .04.006h.56c.087 0 .157-.07.157-.155V4.918a.156.156 0 0 0-.156-.156zm3.815.717v-.56a.156.156 0 0 0-.155-.157h-2.242a.16.16 0 0 0-.108.044h-.001l-.001.002-.002.003a.16.16 0 0 0-.044.107v3.486c0 .041.017.08.044.107l.002.003.002.002a.16.16 0 0 0 .108.043h2.242c.086 0 .155-.07.155-.156v-.56a.156.156 0 0 0-.155-.157H11.81v-.589h1.525c.086 0 .155-.07.155-.156v-.56a.156.156 0 0 0-.155-.157H11.81v-.589h1.525c.086 0 .155-.07.155-.156Z"
                /></svg>{{ t("home.quick.line") }}
            </a>
            <a :href="`tel:${phone}`" class="btn outline"
              >{{ t("home.quick.tel") }}: {{ phone }}</a
            >
          </div>
        </div>
        <p style="margin: 20px 10px">{{ t("contact.address") }}</p>
        <div class="map box" style="margin-top: 12px">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.7460348758596!2d101.52090121020683!3d14.55651048586588!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x311c31938d543b11%3A0xe363e23be6d164b9!2sDoratahill%20khaoyai!5e0!3m2!1sen!2sth!4v1762946668086!5m2!1sen!2sth"
            style="border: 0"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </section>

    <!-- (อาจไม่ได้ใช้ในหน้า Home ปัจจุบัน) ตัวอย่างเพจจิ้งสถานที่เที่ยว -->
    <div class="grid" v-if="pagedAtt.items.length">
      <article v-for="a in pagedAtt.items" :key="a.id" class="card">
        <div class="thumb" @click="openLightbox('att', a, 0)">
          <img
            :src="cover(a)"
            :alt="a.title"
            loading="lazy"
            @error="onImgError"
          />
        </div>
        <div class="meta">
          <h3 class="title" v-if="lang === 'th'">{{ a.title_th }}</h3>
          <h3 class="title" v-if="lang === 'en'">{{ a.title_en }}</h3>
          <p class="desc" v-if="a.description_th && lang === 'th'">
            {{ a.description_th }}
          </p>
          <p class="desc" v-if="a.description_en && lang === 'en'">
            {{ a.description_en }}
          </p>
          <div class="links">
            <a
              v-if="a.map_link"
              :href="a.map_link"
              target="_blank"
              rel="noopener"
              >{{ t("common.viewMap") }}</a
            >
          </div>
          <div class="imgs" v-if="(a.images?.length || 0) > 1">
            <img
              v-for="(im, i) in a.images.slice(1, 5)"
              :key="i"
              :src="im.file_path"
              :alt="a.title + ' photo ' + (i + 2)"
              loading="lazy"
              @click="openLightbox('att', a, i + 1)"
              @error="onImgError"
            />
            <span v-if="a.images.length > 5" class="more"
              >+{{ a.images.length - 5 }}</span
            >
          </div>
        </div>
      </article>
    </div>

    <div class="pager" v-if="pagedAtt.totalPages > 1">
      <button class="btn sm" @click="attPage--" :disabled="attPage === 1">
        ‹
      </button>
      <span>{{
        t("pager.pageOf", { cur: attPage, total: pagedAtt.totalPages })
      }}</span>
      <button
        class="btn sm"
        @click="attPage++"
        :disabled="attPage === pagedAtt.totalPages"
      >
        ›
      </button>
    </div>
    <!-- FB root + chat box -->
    <div id="fb-root"></div>
    <div id="fb-customer-chat" class="fb-customerchat"></div>
  </div>

  <CheckBooking ref="ck" />
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, watch, nextTick } from "vue";
import BookingPopup from "@/components/BookingPopup.vue";
import CheckBooking from "@/components/CheckBooking.vue";
import { useT } from "@/components/useT";

const { t, locale, withLang } = useT();

/* ===== state: generic ===== */
const q = ref("");

/* ===== state: attractions (for pager demo) ===== */
const lang = computed(() => locale.value);
const visiblePosts = computed(() =>
  Array.isArray(posts.value) ? posts.value : []
);
watch(locale, (v) => {
  lang.value = v;
});
const atts = ref([]);
const loadingAtt = ref(false);
const errAtt = ref("");
const qAtt = ref("");
const attPage = ref(1);
const attPerPage = ref(6);

/* ===== news list (admin-ish leftover) ===== */
const active = ref(-1);
const page = ref(1);
const limit = ref(12);
const items = ref([]);
const total = ref(0);
const loading = ref(false);

/* ===== contact ===== */
const lineHref = "https://line.me/R/ti/p/@doratahill";
const phone = "061 919 9596";

/* ===== lightbox (placeholder hooks) ===== */
const lightbox = ref(null);
const activeIndex = ref(0);
const activeType = ref("act");

function onImgError(e) {
  e.target.src = "https://placehold.co/800x600?text=No+Image";
}
function cover(item) {
  return (
    item.images?.[0]?.file_path || "https://placehold.co/800x600?text=No+Image"
  );
}

/* ===== pagination helpers ===== */
function paginate(arr, page, perPage) {
  const total = arr.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const p = Math.min(Math.max(1, page), totalPages);
  const start = (p - 1) * perPage;
  const end = start + perPage;
  return { items: arr.slice(start, end), total, totalPages, page: p };
}

/* == (leftover) load items example, now language-aware == */
async function load() {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      q: q.value,
      page: String(page.value),
      limit: String(limit.value),
      active: String(active.value),
    });
    const r = await fetch(withLang("/api/news/list.php?" + params.toString()));
    const raw = await r.text();
    const data = JSON.parse(raw || "{}");
    items.value = data.items || [];
    total.value = data.total || 0;
  } finally {
    loading.value = false;
  }
}

watch([q, active], () => {
  page.value = 1;
  load();
});
watch([page, limit], load);

/* ===== filter + pager (attractions sample) ===== */
const filteredAtts = computed(() => {
  const s = qAtt.value.toLowerCase();
  return s
    ? atts.value.filter(
        (x) =>
          (x.title || "").toLowerCase().includes(s) ||
          (x.description || "").toLowerCase().includes(s)
      )
    : atts.value;
});

const pagedAtt = computed(() =>
  paginate(filteredAtts.value, attPage.value, attPerPage.value)
);

/* ===== SLIDER ===== */
const slides = ref([]);
const idx = ref(0);
let timer;
function go(step) {
  if (!slides.value.length) return;
  idx.value = (idx.value + step + slides.value.length) % slides.value.length;
}
function play() {
  stop();
  if (slides.value.length) timer = setInterval(() => go(1), 4000);
}
function pause() {
  stop();
}
function stop() {
  if (timer) clearInterval(timer);
}

async function loadSlides() {
  try {
    const r = await fetch(withLang("/api/slides"));
    const data = await r.json();
    slides.value = (data.items || []).map((s) => ({
      file_path: s.file_path,
      alt_text: s.alt_text || "",
    }));
    idx.value = 0;
    play();
  } catch (e) {
    console.error("load slides failed", e);
  }
}
onMounted(play);
onUnmounted(stop);

/* ===== imgs helpers ===== */
const galleryTop = ref(null);
function imgAt(r, i) {
  return (
    r?.images?.[i]?.file_path || "https://placehold.co/800x600?text=No+Image"
  );
}
function has(r, i) {
  return Array.isArray(r?.images) && r.images[i] && r.images[i].file_path;
}
function scrollToGallery() {
  galleryTop.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ===== NEWS (public) ===== */
const newsLoading = ref(true);
const newsItems = ref([]);
async function loadNews() {
  try {
    const res = await fetch(withLang("/api/news/list.php?active=1&limit=6"));
    const raw = await res.text();
    const data = JSON.parse(raw || "{}");
    newsItems.value = (data.items || []).map((n) => ({
      title: n.title,
      title_th: n.title_th,
      title_rn: n.title_rn,
      body_th: n.body_th,
      body_en: n.body_en,
      image: n.cover_path,
      link: n.link,
    }));
  } finally {
    newsLoading.value = false;
  }
}

/* ===== Promotions (not rendered here directly but kept) ===== */
const promos = ref([]);
const promoLoading = ref(true);
async function loadPromos() {
  try {
    const r = await fetch(withLang("/api/news/list.php?active=1&limit=8"));
    const txt = await r.text();
    const data = JSON.parse(txt || "{}");
    promos.value = (data.items || []).map((n) => ({
      title: n.title,
      body: n.body,
      image: n.cover_path,
      link: n.link,
    }));
  } finally {
    promoLoading.value = false;
  }
}

/* ===== FACILITIES (exclude activity) ===== */
const facilities = ref([]);
const facLoading = ref(true);
async function loadFacilities() {
  try {
    const r = await fetch(withLang("/api/facilities/list.php"));
    const txt = await r.text();
    const data = JSON.parse(txt || "{}");
    const all = (data.items || []).map((x) => ({
      ...x,
      images: (x.images || []).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    }));
    facilities.value = all.filter((x) => x.category == "kitchen");
  } finally {
    facLoading.value = false;
  }
}

/* ===== ROOMS / ACTIVITIES / REVIEWS ===== */
const ph = "https://placehold.co/800x600?text=No+Image";
function onErr(e) {
  e.target.src = ph;
}

const rooms = ref([]);
const roomsLoading = ref(true);
async function loadRooms() {
  try {
    const r = await fetch(withLang("/api/rooms_list.php"));
    const txt = await r.text();
    const data = JSON.parse(txt || "{}");
    rooms.value = (data.rooms || []).map((x) => ({
      ...x,
      images: (x.images || []).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    }));
  } finally {
    roomsLoading.value = false;
  }
}

const acts = ref([]);
const actsLoading = ref(true);
async function loadActs() {
  try {
    const r = await fetch(
      withLang("/api/facilities/list.php?category=activity")
    );
    const txt = await r.text();
    const data = JSON.parse(txt || "{}");
    acts.value = (data.items || []).map((x) => ({
      ...x,
      images: (x.images || []).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    }));
  } finally {
    actsLoading.value = false;
  }
}

/* ---- Posts ---- */
const posts = ref([]);
const postsLoading = ref(false);
const postsError = ref("");

const placeImg = "https://placehold.co/800x500?text=Post+Cover";
const onErrPost = (e) => (e.target.src = placeImg);

async function loadPosts() {
  postsLoading.value = true;
  postsError.value = "";
  try {
    const qs = new URLSearchParams({
      status: "published",
      page: "1",
      limit: "6",
    });
    const r = await fetch(withLang("/api/posts/list?" + qs.toString()));
    const data = await r.json();
    if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`);

    posts.value = (data.items || []).map((x) => ({
      id: x.id,
      slug: x.slug,
      title: x.title,
      title_th: x.title_th,
      title_en: x.title_en,
      body_th: x.body_th,
      body_en: x.body_en,
      excerpt_th: x.excerpt_th,
      excerpt_en: x.excerpt_en,
      cover_path: x.cover_path,
      publish_at: x.publish_at,
      tags: x.tags || [],
    }));

    // 👇 ใส่ console.log ตรงนี้
    // console.log('posts >>>', posts.value)
    // console.log('lang  >>>', lang.value)
  } catch (e) {
    postsError.value = e.message || "server_error";
  } finally {
    postsLoading.value = false;
  }
}

/* ---- Reviews ---- */
const reviews = ref([]);
const reviewsLoading = ref(true);
async function loadReviews() {
  try {
    const r = await fetch(withLang("/api/reviews/list.php"));
    const txt = await r.text();
    const data = JSON.parse(txt || "{}");
    reviews.value = (data.items || []).map((x) => ({
      ...x,
      images: (x.images || []).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    }));
  } finally {
    reviewsLoading.value = false;
  }
}

/* ---- Nearby Attractions ---- */
const attractions = ref([]);
const atLoading = ref(true);
async function loadAttractions() {
  try {
    const r = await fetch(withLang("/api/attractions/list.php"));
    const txt = await r.text();
    const data = JSON.parse(txt || "{}");
    attractions.value = (data.items || []).map((x) => ({
      ...x,
      images: (x.images || []).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    }));
  } finally {
    atLoading.value = false;
  }
}

/* ===== misc ===== */
const bookingHref = "#booking";
// === Facebook Chat Plugin (Messenger) ===
const FB_PAGE_ID = "111132315206571"; // ใส่ Page ID ของคุณ
const FB_LOCALE = "th_TH"; // หรือ "en_US" ตามต้องการ
const FB_SDK_VERSION = "v19.0"; // แนะนำใช้เวอร์ชันปัจจุบัน

function initFacebookChat() {
  // ป้องกัน DOM ไม่มี container
  const chatbox = document.getElementById("fb-customer-chat");
  if (!chatbox) return;

  // ตั้ง attributes ผ่าน JS จะเสถียรกว่าใน Vue
  chatbox.setAttribute("page_id", FB_PAGE_ID);
  chatbox.setAttribute("attribution", "biz_inbox");
  chatbox.setAttribute("greeting_dialog_display", "show");
  chatbox.setAttribute(
    "logged_in_greeting",
    "สวัสดีค่ะ ติดต่อสอบถาม/จองบ้านได้เลยนะคะ"
  );
  chatbox.setAttribute(
    "logged_out_greeting",
    "สวัสดีค่ะ ติดต่อสอบถาม/จองบ้านได้เลยนะคะ"
  );
  chatbox.setAttribute("theme_color", "#0084ff");

  // โหลด SDK แค่ครั้งเดียว
  if (!document.getElementById("facebook-jssdk")) {
    // ฟังก์ชัน init ถูกเรียกอัตโนมัติหลังโหลด SDK
    window.fbAsyncInit = function () {
      window.FB?.init({
        xfbml: true,
        version: FB_SDK_VERSION,
      });
      // เผื่อเคส DOM พร้อมแล้ว ค่อย parse อีกรอบ
      window.FB?.XFBML?.parse?.();
    };

    const js = document.createElement("script");
    js.id = "facebook-jssdk";
    // ใช้ไฟล์ customerchat โดยตรง (ไม่ต้อง sdk.js ตัวใหญ่)
    js.src = `https://connect.facebook.net/${FB_LOCALE}/sdk/xfbml.customerchat.js`;
    js.async = true;
    document.body.appendChild(js);
  } else {
    // ถ้าโหลดแล้ว แค่ parse ซ้ำให้มองเห็น node ใหม่
    window.FB?.XFBML?.parse?.();
  }
}

onMounted(async () => {
  initFacebookChat();
  // โหลดข้อมูลทั้งหมด (ตามภาษาเริ่มต้น)
  loadRooms();
  loadFacilities();
  loadActs();
  loadPromos();
  loadReviews();
  loadAttractions();
  loadNews();
  loadPosts();
  await loadSlides();
  play();

  // ป้องกันโหลด FB SDK ซ้ำ
  if (!document.getElementById("facebook-jssdk")) {
    window.fbAsyncInit = function () {
      window.FB?.init({ xfbml: true, version: "v19.0" });
      window.FB?.XFBML?.parse?.();
    };
    const js = document.createElement("script");
    js.id = "facebook-jssdk";
    js.src = "https://connect.facebook.net/th_TH/sdk/xfbml.customerchat.js";
    document.body.appendChild(js);
  } else {
    await nextTick();
    window.FB?.XFBML?.parse?.();
  }

  // Google Translate (ถ้าจะใช้ควบคู่)
  if (!window.googleTranslateElementInit) {
    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "th",
          includedLanguages: "en,th",
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "lang-switch"
      );
    };
  }
  if (!document.getElementById("google-translate-script")) {
    const s = document.createElement("script");
    s.id = "google-translate-script";
    s.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.head.appendChild(s);
  }
});


// ของเดิมมี reviews ในระบบเราเองอยู่แล้ว
const googleReviews = ref([])
const googlePlaceInfo = ref(null)

async function loadGoogleReviews () {
  try {
    const res = await fetch(`/api/reviews/google-places?lang=${lang.value}`)
    const data = await res.json()
    if (!data.ok) throw new Error(data.error || 'google_error')
    googlePlaceInfo.value = data.place
    googleReviews.value = data.reviews || []
  } catch (e) {
    console.error('loadGoogleReviews', e)
  }
}


/* เมื่อเปลี่ยนภาษา → รีโหลดข้อมูลที่ขึ้นกับภาษาจาก API */
watch(locale, async () => {
  await Promise.all([
    loadRooms(),
    loadFacilities(),
    loadActs(),
    loadReviews(),
    loadAttractions(),
    loadNews(),
    loadPosts(),
    loadSlides(),
    loadGoogleReviews()
  ]);
});

/* — ปรับค่า — */
const openHours = "07:00 - 20:00 น.";
const lineId = "doratahill";

const lineUrl = computed(
  () => `https://line.me/R/ti/p/@${encodeURIComponent(lineId)}`
);
const displayPhone = computed(() =>
  phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")
);

function bookNow() {
  const el = document.querySelector("#booking, [data-booking]");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  else window.location.href = "tel:" + phone;
}

function goPage() {
  const PAGE_ID = FB_PAGE_ID; // ใช้ตัวเดียวกัน
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;

  if (!isMobile) {
    window.open(`https://www.facebook.com/messages/t/${PAGE_ID}`, "_blank");
    return;
  }
  const deepLink = isIOS
    ? `fb-messenger://user-thread/${PAGE_ID}`
    : `fb-messenger://user/${PAGE_ID}`;
  window.location.href = deepLink;
  setTimeout(() => {
    window.location.href = `https://m.me/${PAGE_ID}`;
  }, 900);
}

function goLine() {
  window.open("https://line.me/R/ti/p/@" + lineId, "_blank");
}
</script>
<style scoped>
:root {
  --bg: #f7f8fb;
  --card: #fff;
  --text: #1a1d22;
  --muted: #6b7280;
  --ring: #e5e7eb;
  --accent: #7aa63a;
  --shadow: 0 14px 30px rgba(16, 24, 40, 0.08);
  --radius: 18px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 768px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
.reviews .card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

/* กล่องรวม */
.quick-card {
  width: min(100%, 960px);
  margin: -42px auto 22px; /* ลอยทับท้ายฮีโร่เล็กน้อย */
  padding: 10px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(16, 24, 40, 0.08);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

/* ช่องย่อย */
.quick-item {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 14px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  text-align: left;
  transition: 0.2s ease;
  width: 100%;
}
.quick-item:hover {
  box-shadow: 0 6px 18px rgba(16, 24, 40, 0.08);
  transform: translateY(-1px);
}
.quick-item svg {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  fill: #7aa63a;
}
.qi-text {
  line-height: 1.1;
}
.qi-text strong {
  display: block;
  font-weight: 800;
  color: #1f2937;
}
.qi-text span {
  color: #6b7280;
  font-size: 14px;
}

/* Hamburger */
.burger {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  width: 40px;
  height: 40px;
  border: 0;
  background: #8fa34c;
  color: #fff;
  border-radius: 10px;
  justify-content: center;
  align-items: center;
}
/* ===== Responsive rules ===== */
@media (min-width: 901px) {
  .quick-card {
    display: none;
  }
}

/* ปรับบนจอเล็ก */
@media (max-width: 640px) {
  .quick-card {
    grid-template-columns: 1fr 1fr;
  }
  .quick-item {
    padding: 12px;
  }
  .quick-item svg {
    width: 24px;
    height: 24px;
  }
  .qi-text strong {
    font-size: 15px;
  }
  .qi-text span {
    font-size: 13px;
  }
}
.fb_dialog,
.fb-customerchat > span {
  z-index: 2147483000 !important;
}

.wrap {
  max-width: 1200px;
  margin: auto;
  padding: 12px 16px 32px;
}

/* Gallery 2 คอลัมน์ รูปโค้งมน ใกล้เคียงตัวอย่าง */
.gallery {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.gallery img {
  width: 100%;
  aspect-ratio: 4 / 3;
  /* ไม่ล็อกความสูงตายตัว */
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

/* ============== HERO / SLIDER ============== */
.hero {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 16px;
  align-items: stretch;
  max-width: 1100px;
    margin: auto;
    padding: 18px;
}

@media (max-width: 960px) {
  .hero .quick-card{
    margin-left: auto;
    margin-right: auto;
    width: 90%;
    
  }
  .hero {
    grid-template-columns: 1fr;
    margin-left: 0px;
    margin-right: 0px;
    padding: 0px;
  }
}

.slider {
  position: relative;
  background: #eef0f4;
  border: 1px solid var(--ring);
  /* border-radius: 18px; */
  overflow: hidden;
  box-shadow: var(--shadow);
}

.viewport {
  width: 100%;
  overflow: hidden;
}

.track {
  display: flex;
  transition: transform 0.5s ease;
}

.slide {
  min-width: 100%;
  height: 420px;
  background: #ddd;
}

/* แถบคำบรรยายโปร่งทับภาพ */
.caption {
  position: relative;
  left: 10px;
  right: 10px;
  bottom: 100px;
  padding: 10px 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.55); /* เทาดำโปร่งใส */
  border-radius: 12px;
  font-weight: 600;
  line-height: 1.35;
  /* ป้องกันข้อความยาวเกิน */
  /* display: -webkit-box; */
  -webkit-line-clamp: 2; /*      แสดง 2 บรรทัด ถ้ายาวจะ … */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  backdrop-filter: saturate(120%) blur(1.5px);
  max-width: 92%;
  max-height: 100px;
  height: auto;
  font-size: clamp(12px, 1.8vw, 16px);
}

@media (max-width: 640px) {
  .slide {
    height: 280px;
  }
}

.slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  border: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.prev {
  left: 10px;
}

.next {
  right: 10px;
}

.dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  display: flex;
  justify-content: center;
  gap: 6px;
}

.dots button {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: 0;
  background: #e5e7eb;
  cursor: pointer;
}

.dots button.active {
  background: #7aa63a;
}

.hero-text {
  background: var(--card);
  border: 1px solid var(--ring);
  border-radius: 18px;
  padding: 22px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title {
  margin: 0 0 4px;
  font-size: 32px;
}

/* src/assets/fonts.css */
@font-face {
  font-family: "PGSunderland";
  src: url("../assets/font/JustNote_Demo.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
  /* font-display: swap; */
}

/* ใช้กับ h1#booking */

.title-site {
  /* ย่อ-ขยายตามจอให้พอดีบรรทัด */
  font-size: clamp(28px, 13vw, 56px);
  line-height: 1.05;
  word-break: keep-all; /* ไม่ตัดคำอังกฤษกลางคำ */
  overflow-wrap: normal; /* หลีกเลี่ยงการตัดที่ไม่จำเป็น */
  font-family: "PGSunderland", "Noto Sans Thai", system-ui, sans-serif;
  color: blueviolet;
  text-wrap: balance;
}
.nowrap {
  white-space: nowrap;
} /* ← กัน "Khao Yai" แตกบรรทัด */

.tag {
  color: var(--muted);
  margin: 0 0 12px;
}

.cta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  border: 0;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 700;
  background: linear-gradient(180deg, #8fc857, #7aa63a);
  color: #fff;
  text-decoration: none;
}

.btn.outline {
  background: transparent;
  color: var(--accent);
  border: 1.5px solid var(--accent);
}

/* ============== Sections ============== */
.sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 22px 0 10px;
}

.sec-head h2 {
  margin: 0;
  font-size: 22px;
}

.more {
  color: #2563eb;
  text-decoration: none;
  font-weight: 700;
  white-space: nowrap;
}

.state {
  padding: 14px;
  border: 1px dashed var(--ring);
  border-radius: 12px;
}

.state.muted {
  color: var(--muted);
}

/* News */
.news-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 960px) {
  .news-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 620px) {
  .news-grid {
    grid-template-columns: 1fr;
  }
}

.news-card {
  background: #fff;
  border: 1px solid var(--ring);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
}

.news-card img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.news-card .meta {
  padding: 12px;
}

.news-card h3 {
  margin: 2px 0 6px;
  font-size: 18px;
}

.desc{
  display: -webkit-box;
  -webkit-line-clamp: 3;     
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;   
}

.news-card .desc {
  color: var(--muted);
  margin: 0 0 8px;
}

.news-card .link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 700;
}

/* Cards grid (rooms/acts/reviews) */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 620px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: #fff;
  border: 1px solid var(--ring);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
}

.thumb {
  aspect-ratio: 16/10;
  background: #f3f4f6;
}

.thumb.small {
  aspect-ratio: 16/9;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.meta {
  padding: 12px;
}

.meta .desc {
  color: var(--muted);
  margin: 0.25rem 0 0.5rem;
}

.link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 700;
}

.muted {
  color: var(--muted);
}

.home {
  color: var(--text);
}

.wrap {
  max-width: 1100px;
  margin: auto;
  padding: 18px;
}

.hero-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin: 10px 0 18px 0;
  flex-wrap: wrap;
}

.hero-head h1 {
  margin: 0;
  font-size: clamp(24px, 2.4vw, 36px);
  line-height: 1.2;
}

.hero-head h1 small {
  display: block;
  font-weight: 500;
  color: var(--muted);
  font-size: 0.7em;
}

.cta {
  display: flex;
  gap: 10px;
}

.btn {
  border: 0;
  padding: 12px 18px;
  border-radius: 12px;
  background: linear-gradient(180deg, #8fc857, #7aa63a);
  color: #fff;
  font-weight: 700;
  box-shadow: var(--shadow);
  cursor: pointer;
  text-decoration: none;
}

.ghost {
  border: 1px solid var(--ring);
  background: #fff;
  color: var(--text);
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 18px;
  padding: 10px;
}

.hero-grid figure {
  margin: 0;
  overflow: hidden;
  border-radius: 12px;
  background: #f3f4f6;
}

.hero-grid img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: 12px;
}

.big {
  aspect-ratio: 4 / 5;
}

/* ซ้ายสูงยาว */
.side {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 18px;
}

.side figure {
  aspect-ratio: 4 / 3;
}

/* สัดส่วนใกล้เคียงภาพตัวอย่าง */

/* คอลเลจ 5 รูป */
.collage5 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  /* ซ้าย-ขวา */
  gap: 14px;
  padding: 10px;
}

.collage5 .col {
  display: grid;
  gap: 14px;
}

/* ซ้าย: 2 รูป (บน/ล่างสูง) */
.collage5 .left {
  grid-template-rows: auto auto;
}

/* ขวา: 3 รูป (บน/กลาง/ล่าง) */
.collage5 .right {
  grid-template-rows: auto auto auto;
}

/* กรอบรูป */
.collage5 figure {
  border-radius: 18px;
  overflow: hidden;
  background: #eef1f4;
}

/* อัตราส่วนให้ใกล้ภาพตัวอย่าง */
.collage5 .a,
.collage5 .b,
.collage5 .d,
.collage5 .e {
  aspect-ratio: 4 / 3;
  /* แนวนอน */
}

/* ถ้ารูป < 4 -> ปล่อยอัตราส่วนอัตโนมัติ (แทน 4/0) ให้สูงตามคอนเทนต์ */
.collage5.few .a,
.collage5.few .b,
.collage5.few .d,
.collage5.few .e {
  aspect-ratio: auto;
  /* ใช้ได้จริง, แทนที่ 4/0 */
}

.collage5 .c {
  aspect-ratio: 3 / 4;
  /* แนวตั้ง (รูปใหญ่ใต้ซ้าย) */
}

.collage5 img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

/* มือถือ: ซ้อนเป็นคอลัมน์เดียว สวยและอ่านง่าย */
@media (max-width: 680px) {
  /* .collage5{
    grid-template-columns: 1fr;
  }
  .collage5 .left,
  .collage5 .right{
    grid-template-rows: none;
  } */
  /* ทำให้รูปย่อยเรียง 2 ต่อแถวถ้าพื้นที่พอ */
  /* .collage5 .right{
    grid-template-columns: repeat(2, 1fr);
  }
  .collage5 .right .b{ grid-column: span 2; } รูปบนขวาให้เต็มความกว้าง */
}

.lead {
  margin: 16px 2px 6px;
}

.lead h2 {
  margin: 0.8rem 0 0.25rem;
  font-size: clamp(18px, 2vw, 24px);
}

.lead p {
  margin: 0;
  color: var(--muted);
}

.home-posts {
  margin-top: 24px;
}

.hp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.hp-head h2 {
  margin: 0;
  font-size: 22px;
}

.hp-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 960px) {
  .hp-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .hp-grid {
    grid-template-columns: 1fr;
  }
}

.hp-card {
  padding: 14px;
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.hp-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
}

/* รูปปก */
.hp-cover {
  display: block;
  position: relative;
  overflow: hidden;
}

.hp-cover img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
  transition: transform 0.25s ease;
}

.hp-card:hover .hp-cover img {
  transform: scale(1.03);
}

/* เนื้อหาด้านล่าง */
.hp-meta {
  padding: 14px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* title */
.hp-title {
  margin: 0;
  font-size: 16px;
  line-height: 1.35;
}

.hp-title a {
  text-decoration: none;
  color: #111827;
  font-weight: 700;
}

.hp-title a:hover {
  color: #7aa63a;
}

/* excerpt – จำกัดบรรทัดให้ดูเรียบร้อย */
.hp-excerpt {
  margin: 4px 0 6px;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3; /* แสดง 3 บรรทัด */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* footer (วันที่ + read more) */
.hp-foot {
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
}

.hp-date {
  color: #9ca3af;
}

.hp-more {
  text-decoration: none;
  font-weight: 600;
  color: #2563eb;
}

.hp-more:hover {
  text-decoration: underline;
}
.g-rev-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
  display: grid;
  gap: 8px;
}
.g-rev-item {
  padding: 6px 0;
  border-bottom: 1px dashed #e5e7eb;
}
.g-rev-item:last-child {
  border-bottom: 0;
}
.g-rev-head {
  font-size: 14px;
  color: #111827;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.g-rev-time {
  color: #6b7280;
}
.g-rev-text {
  margin: 2px 0 0;
  font-size: 14px;
  color: #374151;
}

</style>
