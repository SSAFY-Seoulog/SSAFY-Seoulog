<template>
  <main class="home-page">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Seoulog</p>
        <h1>서울 여행을 더 쉽게,<br>더 선명하게</h1>
        <p class="hero-text">지도, 커뮤니티, AI 가이드를 한곳에서 확인하고 서울의 다음 목적지를 빠르게 찾아보세요.</p>
        <div class="hero-actions">
          <RouterLink to="/map" class="btn">지도 보기</RouterLink>
          <RouterLink to="/board" class="btn btn-secondary">게시판 둘러보기</RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>