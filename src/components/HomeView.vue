<template>
  <main class="home-page">
    <section class="hero" aria-labelledby="home-title">
      <img class="hero-image" src="../assets/seoul-hero-v2.png" alt="남산서울타워와 서울의 한옥 지붕이 어우러진 저녁 풍경">
      <div class="hero-shade"></div>
      <div class="container hero-inner">
        <div class="hero-copy">
          <p class="hero-kicker"><span>✈️</span> 오늘의 서울, 여기서 시작해요</p>
          <h1 id="home-title">낯선 서울도<br>내 여행처럼 편안하게</h1>
          <p class="hero-text">관광지부터 로컬 이야기까지 한 번에 찾아보고,<br>AI와 함께 나만의 서울 여행을 완성해 보세요.</p>
          <div class="hero-actions">
            <RouterLink to="/map" class="btn hero-primary">🗺️ 여행지 둘러보기</RouterLink>
            <RouterLink to="/chat" class="btn hero-secondary">✨ AI에게 추천받기</RouterLink>
          </div>
        </div>
        <div class="weather-chip" :class="{ loading: isWeatherLoading, error: weatherError && !weather }" :aria-label="weatherAriaLabel" aria-live="polite">
          <span class="weather-icon" aria-hidden="true">{{ isWeatherLoading ? '⏳' : weatherIcon }}</span>
          <span class="weather-copy">
            <span class="weather-title">
              <strong v-if="isWeatherLoading">서울 날씨 확인 중</strong>
              <strong v-else-if="weather">{{ temperatureText }} · {{ weatherLabel }}</strong>
              <strong v-else>날씨 정보 없음</strong>
              <em v-if="weather">{{ weatherUpdatedAt }}</em>
            </span>
            <small>{{ weatherError && !weather ? weatherError : weatherAdvice }}</small>
          </span>
          <button type="button" class="weather-refresh" :class="{ spinning: isWeatherLoading }" :disabled="isWeatherLoading" title="날씨 새로고침" aria-label="서울 날씨 새로고침" @click="refreshWeather">↻</button>
        </div>
      </div>
      <div class="floating-sticker sticker-camera" aria-hidden="true">📸</div>
      <div class="floating-sticker sticker-pin" aria-hidden="true">📍</div>
    </section>

    <section class="quick-section">
      <div class="container">
        <div class="quick-bar" aria-label="빠른 여행 메뉴">
          <RouterLink to="/map" class="quick-item">
            <span class="quick-icon blue">🗺️</span>
            <span><strong>여행지도</strong><small>서울 명소를 한눈에</small></span>
            <b aria-hidden="true">›</b>
          </RouterLink>
          <RouterLink to="/chat" class="quick-item">
            <span class="quick-icon yellow">✨</span>
            <span><strong>AI 코스 추천</strong><small>취향에 맞는 여행</small></span>
            <b aria-hidden="true">›</b>
          </RouterLink>
          <RouterLink to="/board" class="quick-item">
            <span class="quick-icon coral">💬</span>
            <span><strong>여행자 이야기</strong><small>생생한 로컬 팁</small></span>
            <b aria-hidden="true">›</b>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="discover-section">
      <div class="container discover-inner">
        <div class="section-copy">
          <p class="eyebrow">SEOUL, YOUR WAY</p>
          <h2>오늘은 어떤 서울을<br>만나고 싶나요?</h2>
          <p>익숙한 명소도, 골목의 작은 공간도 여행자의 기분에 따라 전혀 다르게 보이니까요.</p>
          <RouterLink to="/map" class="text-link">서울 전체 보기 <span>→</span></RouterLink>
        </div>
        <div class="mood-grid">
          <RouterLink to="/map" class="mood-card mood-blue">
            <span class="mood-emoji">🌊</span><small>천천히 쉬고 싶을 때</small><strong>한강 따라 걷기</strong><span>여의도 · 반포 · 뚝섬</span>
          </RouterLink>
          <RouterLink to="/map" class="mood-card mood-green">
            <span class="mood-emoji">🌿</span><small>초록이 필요한 날</small><strong>서울 숲 여행</strong><span>성수 · 남산 · 북서울</span>
          </RouterLink>
          <RouterLink to="/map" class="mood-card mood-coral">
            <span class="mood-emoji">🏮</span><small>서울의 시간을 따라</small><strong>오래된 동네 산책</strong><span>서촌 · 익선동 · 을지로</span>
          </RouterLink>
          <RouterLink to="/map" class="mood-card mood-yellow">
            <span class="mood-emoji">🍜</span><small>맛있는 게 당길 때</small><strong>로컬 미식 탐험</strong><span>망원 · 광장시장 · 신당</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="ai-section">
      <div class="container ai-band">
        <div class="ai-visual" aria-hidden="true">
          <span class="ai-orbit">✨</span><div class="ai-core">S</div><span class="ai-bubble">이번 주말<br><strong>서울 어디 갈까?</strong></span>
        </div>
        <div class="ai-copy">
          <p class="eyebrow">LOCALHUB AI</p>
          <h2>고민은 줄이고,<br>설레는 여행만 남겨요</h2>
          <p>원하는 분위기와 동네를 말하면 공공데이터와 여행자 이야기를 바탕으로 알맞은 장소를 찾아드려요.</p>
          <RouterLink to="/chat" class="btn">AI 가이드 시작하기</RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current=temperature_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m,is_day&timezone=Asia%2FSeoul'
const WEATHER_REFRESH_INTERVAL = 10 * 60 * 1000
const AI_CACHE_KEY = 'localhub_weather_ai_advice'

const weather = ref(null)
const weatherAdvice = ref('서울의 현재 날씨를 확인하고 있어요')
const isWeatherLoading = ref(true)
const weatherError = ref('')
let weatherTimer = null

const weatherCode = computed(() => weather.value?.weather_code ?? -1)

const weatherIcon = computed(() => {
  const code = weatherCode.value
  if (code === 0) return weather.value?.is_day === 0 ? '🌙' : '☀️'
  if (code <= 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code === 45 || code === 48) return '🌫️'
  if (code >= 51 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '🌨️'
  if (code >= 80 && code <= 82) return '🌦️'
  if (code >= 85 && code <= 86) return '🌨️'
  if (code >= 95) return '⛈️'
  return '🌡️'
})

const weatherLabel = computed(() => {
  const code = weatherCode.value
  if (code === 0) return '맑음'
  if (code <= 2) return '대체로 맑음'
  if (code === 3) return '흐림'
  if (code === 45 || code === 48) return '안개'
  if (code >= 51 && code <= 57) return '이슬비'
  if (code >= 61 && code <= 67) return '비'
  if (code >= 71 && code <= 77) return '눈'
  if (code >= 80 && code <= 82) return '소나기'
  if (code >= 85 && code <= 86) return '눈 소나기'
  if (code >= 95) return '뇌우'
  return '날씨 정보'
})

const temperatureText = computed(() => {
  const temperature = weather.value?.temperature_2m
  return Number.isFinite(temperature) ? Math.round(temperature) + '°' : '--°'
})

const weatherUpdatedAt = computed(() => {
  const time = weather.value?.time
  return time ? time.slice(11, 16) + ' 기준' : '실시간'
})

const weatherAriaLabel = computed(() => {
  if (isWeatherLoading.value) return '서울 실시간 날씨를 불러오는 중'
  if (weatherError.value && !weather.value) return weatherError.value
  return '서울 현재 날씨 ' + temperatureText.value + ', ' + weatherLabel.value + '. ' + weatherAdvice.value
})

function getFallbackAdvice(current) {
  if ((current.precipitation || 0) > 0 || (current.weather_code >= 51 && current.weather_code <= 82)) {
    return '우산을 챙기고 실내 명소를 함께 계획해요'
  }
  if ((current.wind_speed_10m || 0) >= 30) return '바람이 강해 야외 이동 시간을 짧게 잡아보세요'
  if (current.temperature_2m >= 30) return '한낮 야외 일정은 줄이고 시원한 실내를 섞어보세요'
  if (current.temperature_2m <= 5) return '따뜻하게 입고 실내와 야외를 번갈아 둘러보세요'
  if (current.weather_code <= 2) return '걷기 좋은 날씨예요. 한강이나 골목 산책을 즐겨보세요'
  return '가벼운 겉옷과 함께 여유로운 서울 여행을 즐겨보세요'
}

function getWeatherSignature(current) {
  return [
    Math.round(current.temperature_2m),
    Math.round(current.apparent_temperature),
    current.weather_code,
    Math.round(current.precipitation || 0),
    Math.round(current.wind_speed_10m || 0)
  ].join(':')
}

async function updateAIWeatherAdvice(current) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) return

  const signature = getWeatherSignature(current)
  try {
    const cached = JSON.parse(sessionStorage.getItem(AI_CACHE_KEY))
    if (cached?.signature === signature && cached.expiresAt > Date.now() && cached.advice) {
      weatherAdvice.value = cached.advice
      return
    }
  } catch (error) {
    sessionStorage.removeItem(AI_CACHE_KEY)
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        max_completion_tokens: 300,
        reasoning_effort: 'minimal',
        messages: [
          {
            role: 'system',
            content: '서울 여행 서비스의 날씨 안내 도우미다. 제공된 현재 관측값만 근거로 여행자에게 실용적인 조언 한 문장을 한국어 35자 이내로 작성한다. 인사, 마크다운, 온도 반복, 과장된 표현은 사용하지 않는다.'
          },
          {
            role: 'user',
            content:
              '기온 ' + current.temperature_2m + '°C, 체감 ' + current.apparent_temperature +
              '°C, 날씨코드 ' + current.weather_code + ', 강수 ' + current.precipitation +
              'mm, 풍속 ' + current.wind_speed_10m + 'km/h'
          }
        ]
      })
    })

    if (!response.ok) return
    const data = await response.json()
    const advice = data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, '')
    if (!advice) return

    weatherAdvice.value = advice
    sessionStorage.setItem(AI_CACHE_KEY, JSON.stringify({
      signature,
      advice,
      expiresAt: Date.now() + 30 * 60 * 1000
    }))
  } catch (error) {
    // AI 요약 실패 시 관측값 기반 기본 안내를 유지한다.
  }
}

async function refreshWeather() {
  if (!weather.value) isWeatherLoading.value = true
  weatherError.value = ''

  try {
    const response = await fetch(WEATHER_URL)
    if (!response.ok) throw new Error('날씨 응답 오류')
    const data = await response.json()
    if (!data.current || !Number.isFinite(data.current.temperature_2m)) throw new Error('날씨 데이터 오류')

    weather.value = data.current
    weatherAdvice.value = getFallbackAdvice(data.current)
    isWeatherLoading.value = false
    updateAIWeatherAdvice(data.current)
  } catch (error) {
    weatherError.value = '서울 날씨를 잠시 불러올 수 없어요'
    weatherAdvice.value = weather.value ? getFallbackAdvice(weather.value) : '잠시 후 새로고침해 주세요'
    isWeatherLoading.value = false
  }
}

onMounted(() => {
  refreshWeather()
  weatherTimer = window.setInterval(refreshWeather, WEATHER_REFRESH_INTERVAL)
})

onBeforeUnmount(() => {
  if (weatherTimer) window.clearInterval(weatherTimer)
})
</script>

<style scoped>
.home-page { overflow: hidden; background: #fff; }
.hero { position: relative; min-height: 680px; display: flex; align-items: center; isolation: isolate; overflow: hidden; }
.hero-image, .hero-shade { position: absolute; inset: 0; width: 100%; height: 100%; }
.hero-image { object-fit: cover; z-index: -3; }
.hero-shade { z-index: -2; background: linear-gradient(90deg, rgba(10,25,43,.82) 0%, rgba(10,25,43,.56) 43%, rgba(10,25,43,.08) 72%, rgba(10,25,43,.14) 100%); }
.hero-inner { position: relative; min-height: 680px; display: flex; align-items: center; padding-top: 56px; padding-bottom: 100px; }
.hero-copy { color: #fff; max-width: 650px; text-align: left; }
.hero-kicker { display: inline-flex; gap: 8px; align-items: center; margin-bottom: 22px; padding: 8px 12px; border: 1px solid rgba(255,255,255,.25); border-radius: 999px; background: rgba(255,255,255,.13); backdrop-filter: blur(10px); font-size: 14px; font-weight: 750; }
.hero h1 { color: #fff; font-size: 58px; line-height: 1.16; margin: 0 0 22px; font-weight: 850; }
.hero-text { margin: 0 0 34px; color: rgba(255,255,255,.84); font-size: 19px; line-height: 1.7; }
.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.hero-primary, .hero-secondary { min-height: 54px; padding: 0 23px; }
.hero-secondary { background: rgba(255,255,255,.94); color: #191f28; }
.hero-secondary:hover { background: #fff; color: #191f28; }
.weather-chip { position: absolute; right: 0; bottom: 84px; display: grid; grid-template-columns: 34px minmax(0,1fr) 30px; align-items: center; gap: 10px; width: min(390px,calc(100% - 40px)); min-height: 76px; padding: 13px 13px 13px 16px; border: 1px solid rgba(255,255,255,.32); border-radius: 8px; background: rgba(255,255,255,.93); color: #191f28; box-shadow: 0 18px 40px rgba(0,0,0,.18); backdrop-filter: blur(16px); }
.weather-chip.error { background: rgba(255,248,247,.95); }
.weather-icon { display: grid; place-items: center; width: 34px; height: 34px; font-size: 27px; }
.weather-copy { min-width: 0; }
.weather-title { display: flex; align-items: baseline; justify-content: space-between; gap: 9px; }
.weather-chip strong, .weather-chip small { display: block; }
.weather-chip strong { overflow: hidden; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.weather-chip em { flex: 0 0 auto; color: #8b95a1; font-size: 9px; font-style: normal; }
.weather-chip small { margin-top: 3px; overflow: hidden; color: #6b7684; font-size: 11px; line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; }
.weather-refresh { display: grid; place-items: center; width: 30px; height: 30px; padding: 0; border: 0; border-radius: 50%; background: #f2f4f6; color: #6b7684; cursor: pointer; font-size: 17px; }
.weather-refresh:hover { background: #e5e8eb; color: #3182f6; }
.weather-refresh:disabled { cursor: wait; opacity: .65; }
.weather-refresh.spinning { animation: weather-spin 1.1s linear infinite; }
@keyframes weather-spin { to { transform: rotate(360deg); } }
.floating-sticker { position: absolute; display: grid; place-items: center; width: 52px; height: 52px; border: 1px solid rgba(255,255,255,.35); border-radius: 50%; background: rgba(255,255,255,.88); box-shadow: 0 12px 30px rgba(0,0,0,.16); font-size: 25px; animation: float 4s ease-in-out infinite; }
.sticker-camera { top: 140px; right: 9%; }
.sticker-pin { top: 240px; right: 21%; animation-delay: -1.8s; }
@keyframes float { 50% { transform: translateY(-9px) rotate(3deg); } }
.quick-section { position: relative; z-index: 2; margin-top: -52px; }
.quick-bar { display: grid; grid-template-columns: repeat(3, 1fr); padding: 12px; border: 1px solid #e5e8eb; border-radius: 8px; background: #fff; box-shadow: 0 18px 45px rgba(15,23,42,.12); }
.quick-item { display: grid; grid-template-columns: 48px 1fr 18px; align-items: center; gap: 12px; min-height: 82px; padding: 12px 22px; border-right: 1px solid #e5e8eb; transition: background .16s ease; }
.quick-item:last-child { border-right: 0; }
.quick-item:hover { background: #f7f9fc; }
.quick-icon { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 8px; font-size: 23px; }
.quick-icon.blue { background: #eaf3ff; } .quick-icon.yellow { background: #fff6dc; } .quick-icon.coral { background: #fff0ee; }
.quick-item strong, .quick-item small { display: block; }
.quick-item strong { font-size: 15px; } .quick-item small { color: #8b95a1; font-size: 12px; margin-top: 3px; } .quick-item b { color: #b0b8c1; font-size: 24px; font-weight: 400; }
.discover-section { padding: 150px 0 130px; }
.discover-inner { display: grid; grid-template-columns: .78fr 1.4fr; align-items: center; gap: 76px; }
.section-copy h2, .ai-copy h2 { margin: 0 0 20px; font-size: 40px; line-height: 1.3; font-weight: 800; }
.section-copy > p:not(.eyebrow), .ai-copy > p:not(.eyebrow) { color: #6b7684; line-height: 1.75; }
.text-link { display: inline-flex; gap: 8px; margin-top: 22px; color: #3182f6; font-weight: 750; }
.mood-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 14px; }
.mood-card { position: relative; min-height: 205px; padding: 26px; border-radius: 8px; overflow: hidden; transition: transform .18s ease, box-shadow .18s ease; }
.mood-card:hover { transform: translateY(-4px); box-shadow: 0 18px 34px rgba(15,23,42,.12); }
.mood-card small, .mood-card strong, .mood-card > span:last-child { display: block; position: relative; z-index: 1; }
.mood-card small { margin-bottom: 8px; color: #4e5968; font-size: 13px; }
.mood-card strong { margin-bottom: 8px; font-size: 22px; }
.mood-card > span:last-child { color: #6b7684; font-size: 13px; }
.mood-emoji { position: absolute; right: 17px; bottom: 5px; font-size: 68px; transform: rotate(-6deg); filter: drop-shadow(0 8px 10px rgba(0,0,0,.08)); }
.mood-blue { background: #eaf4ff; } .mood-green { background: #eaf9f2; } .mood-coral { background: #fff0ee; } .mood-yellow { background: #fff7de; }
.ai-section { padding: 0 0 130px; }
.ai-band { display: grid; grid-template-columns: 1fr 1fr; align-items: center; min-height: 430px; border-radius: 8px; background: #f2f7ff; overflow: hidden; }
.ai-visual { position: relative; display: grid; place-items: center; min-height: 430px; }
.ai-core { display: grid; place-items: center; width: 150px; height: 150px; border-radius: 50%; background: #3182f6; color: #fff; box-shadow: 0 0 0 28px rgba(49,130,246,.09), 0 25px 50px rgba(49,130,246,.3); font-size: 64px; font-weight: 900; }
.ai-orbit { position: absolute; top: 74px; left: 28%; font-size: 34px; animation: float 3.5s ease-in-out infinite; }
.ai-bubble { position: absolute; right: 8%; bottom: 62px; padding: 13px 17px; border-radius: 8px; background: #fff; box-shadow: 0 12px 28px rgba(15,23,42,.12); color: #4e5968; font-size: 13px; line-height: 1.5; }
.ai-bubble strong { color: #191f28; }
.ai-copy { padding: 60px 70px 60px 20px; }
.ai-copy .btn { margin-top: 24px; }
@media (max-width: 900px) {
  .hero, .hero-inner { min-height: 620px; }
  .hero h1 { font-size: 46px; }
  .sticker-pin { right: 10%; } .weather-chip { right: 20px; }
  .quick-bar { grid-template-columns: 1fr; }
  .quick-item { border-right: 0; border-bottom: 1px solid #e5e8eb; }
  .quick-item:last-child { border-bottom: 0; }
  .discover-inner, .ai-band { grid-template-columns: 1fr; }
  .discover-inner { gap: 46px; }
  .ai-copy { padding: 20px 40px 55px; text-align: center; }
}
@media (max-width: 640px) {
  .hero, .hero-inner { min-height: 590px; }
  .hero-inner { align-items: flex-end; padding-bottom: 95px; }
  .hero-shade { background: linear-gradient(0deg, rgba(10,25,43,.9) 0%, rgba(10,25,43,.54) 64%, rgba(10,25,43,.18) 100%); }
  .hero h1 { font-size: 36px; }
  .hero-text { font-size: 16px; } .hero-text br { display: none; }
  .hero-actions { display: grid; grid-template-columns: 1fr; }
  .hero-actions .btn { width: 100%; }
  .floating-sticker { display: none; }
  .weather-chip { top: 18px; right: 16px; bottom: auto; left: 16px; width: auto; }
  .quick-section { margin-top: -34px; }
  .quick-bar { padding: 8px; }
  .quick-item { min-height: 72px; padding: 9px 12px; }
  .discover-section { padding: 105px 0 90px; }
  .discover-inner { gap: 34px; }
  .section-copy h2, .ai-copy h2 { font-size: 32px; }
  .mood-grid { grid-template-columns: 1fr; }
  .mood-card { min-height: 175px; }
  .ai-section { padding-bottom: 90px; }
  .ai-visual { min-height: 320px; }
  .ai-core { width: 120px; height: 120px; font-size: 52px; }
  .ai-copy { padding: 10px 24px 42px; }
}
</style>