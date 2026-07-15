<template>
  <!-- main.js의 app.mount('#app')과 일치하도록 id를 'app'으로 변경했습니다 -->
  <div id="app">
    <!-- 상단 내비게이션 바 (GNB) -->
    <nav class="navigation-bar">
      <div class="nav-content">
        <span class="brand-logo">Seoulog 🗺️</span>
        <div class="nav-links">
          <router-link to="/" class="nav-item">홈</router-link>
          <span class="divider">|</span>
          <router-link to="/board" class="nav-item">로컬 게시판</router-link>
        </div>
      </div>
    </nav>

    <!-- 라우터로 연결된 화면(HomeView, BoardView)이 렌더링되는 영역 -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style>
/* 전역 기본 스타일 초기화 */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #f8fafc;
  color: #333333;
}

/* main.js와 매칭되는 최상위 컨테이너 스타일 */
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  max-width: 100%;
  margin: 0;
  text-align: left; /* 기존 style.css의 center 정렬을 초기화 */
}

/* 내비게이션 바 디자인 */
.navigation-bar {
  padding: 1rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nav-content {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand-logo {
  font-size: 1.25rem;
  font-weight: 800;
  color: #005ea2;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 15px;
}

.nav-item {
  font-weight: 600;
  text-decoration: none;
  color: #4a5568;
  padding: 0.25rem 0.5rem;
  transition: color 0.2s;
}

.nav-item:hover {
  color: #005ea2;
}

/* 현재 활성화된 메뉴 링크 스타일 강조 */
.router-link-active {
  color: #005ea2 !important;
  border-bottom: 2px solid #005ea2;
}

.divider {
  color: #cbd5e1;
}

/* 메인 콘텐츠 영역 */
.main-content {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
}
</style>