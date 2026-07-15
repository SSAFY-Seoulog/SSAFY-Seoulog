<template>
  <main class="map-page">
    <section class="map-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Seoulog</p>
          <h1>서울 데이터 지도</h1>
        </div>
        <p class="section-description">서울의 자치구별 데이터를 지도 위에서 한눈에 확인하세요. 관광객 수, 혼잡도, 인기 지역 정보를 시각적으로 제공합니다.</p>
      </div>

      <div class="map-layout">
        <aside class="panel">
          <h2>서울 관광 데이터</h2>
          <p>자치구별 방문객 수와 상권 흐름을 시각적으로 보여주는 대시보드입니다.</p>
          <div class="button-group">
            <button>혼잡도</button>
            <button>관광객증감</button>
            <button>관람통계</button>
          </div>
          <div class="summary-card">
            <strong>2.4M</strong>
            <span>일별 관광 방문객</span>
          </div>
          <div class="stats-grid">
            <div class="stat-pill"><strong>중구</strong><span>인기 지자체 Top</span></div>
            <div class="stat-pill"><strong>강남구</strong><span>핫플, 코엑스 근처</span></div>
          </div>
          <div class="list-card">
            <div class="list-item">
              <div>
                <p class="district">중구</p>
                <div class="bar"><span style="width:92%"></span></div>
              </div>
              <strong>320K명</strong>
            </div>
            <div class="list-item">
              <div>
                <p class="district">강남구</p>
                <div class="bar"><span style="width:82%"></span></div>
              </div>
              <strong>285K명</strong>
            </div>
            <div class="list-item">
              <div>
                <p class="district">종로구</p>
                <div class="bar"><span style="width:74%"></span></div>
              </div>
              <strong>210K명</strong>
            </div>
            <div class="list-item">
              <div>
                <p class="district">마포구</p>
                <div class="bar"><span style="width:61%"></span></div>
              </div>
              <strong>180K명</strong>
            </div>
          </div>
        </aside>

        <section class="map-card">
          <div class="map-header">
            <h3>서울 데이터 지도를 확인하세요</h3>
            <div class="legend">
              <span><span class="dot low"></span>보통</span>
              <span><span class="dot medium"></span>높음</span>
              <span><span class="dot high"></span>상승세</span>
            </div>
          </div>
          <div id="map"></div>
        </section>
      </div>
    </section>
  </main>
</template>

<script setup>
import { onMounted } from 'vue'

const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY

function loadKakaoScript() {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      return resolve()
    }

    const existingScript = document.querySelector('script[data-kakao]')
    if (existingScript) {
      existingScript.addEventListener('load', resolve)
      existingScript.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.setAttribute('data-kakao', 'true')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services,clusterer,visualization&autoload=false`
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function getDistrictFromAddr(addr = '') {
  // 알려진 패턴에서 '○○구' 또는 '○○시' 이름을 추출
  const m = addr.match(/([가-힣]+(구|시))/)
  return m ? m[1] : '알수없음'
}

async function fetchData(url) {
  const res = await fetch(url)
  if (!res.ok) return { items: [] }
  return res.json()
}

function createMap() {
  if (!window.kakao || !window.kakao.maps) {
    console.warn('Kakao Maps SDK가 로드되지 않았습니다.')
    return
  }

  const container = document.getElementById('map')
  const options = { center: new kakao.maps.LatLng(37.5665, 126.9780), level: 7 }
  const map = new kakao.maps.Map(container, options)

  // 레전드 추가
  const legend = document.createElement('div')
  legend.className = 'map-legend panel'
  legend.innerHTML = `
    <strong>범례</strong>
    <div class="legend-row"><span class="dot very-high"></span>매우 높음</div>
    <div class="legend-row"><span class="dot high"></span>높음</div>
    <div class="legend-row"><span class="dot rise"></span>상승세 (전주대비)</div>
  `
  legend.style.position = 'absolute'
  legend.style.left = '16px'
  legend.style.bottom = '16px'
  legend.style.zIndex = 2000
  container.appendChild(legend)

  // 데이터 로드 및 집계
  Promise.all([
    fetchData('/data/seoul_attractions.json'),
    fetchData('/data/seoul_festivals.json')
  ]).then(([attractions, festivals]) => {
    const allItems = [...(attractions.items || []), ...(festivals.items || [])]

    const groups = {}
    allItems.forEach(it => {
      const lat = parseFloat(it.mapy)
      const lng = parseFloat(it.mapx)
      if (!lat || !lng) return
      const district = getDistrictFromAddr(it.addr1 || it.title || '')
      if (!groups[district]) groups[district] = { count: 0, latSum: 0, lngSum: 0, items: [] }
      groups[district].count += 1
      groups[district].latSum += lat
      groups[district].lngSum += lng
      groups[district].items.push(it)
    })

    const groupList = Object.keys(groups).map(k => {
      const g = groups[k]
      return {
        name: k,
        count: g.count,
        center: new kakao.maps.LatLng(g.latSum / g.count, g.lngSum / g.count),
        items: g.items
      }
    })

    // 정렬 및 가중치 계산
    groupList.sort((a, b) => b.count - a.count)
    const max = groupList.length ? groupList[0].count : 1

    // 오버레이(원형)과 마커 생성
    groupList.forEach((g, idx) => {
      const weight = g.count / max
      const radius = 800 + weight * 8000 // 가시화용 반경

      const circle = new kakao.maps.Circle({
        center: g.center,
        radius,
        strokeWeight: 0,
        fillColor: weight > 0.66 ? 'rgba(10,118,178,0.28)' : weight > 0.33 ? 'rgba(79,187,196,0.18)' : 'rgba(158,231,255,0.12)',
        fillOpacity: 1,
        map
      })

      const marker = new kakao.maps.Marker({ position: g.center, map })
      const overlayContent = `
        <div class="district-overlay">
          <strong>${g.name}</strong>
          <div class="count">${g.count}개</div>
        </div>
      `
      const customOverlay = new kakao.maps.CustomOverlay({
        position: g.center,
        content: overlayContent,
        yAnchor: 1.4,
        map
      })

      const infowindow = new kakao.maps.InfoWindow({
        removable: true,
        content: renderInfoContent(g)
      })

      kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.setContent(renderInfoContent(g))
        infowindow.open(map, marker)
      })
    })
  }).catch(err => console.error('데이터 로드 실패', err))
}

function renderInfoContent(group) {
  const list = group.items.slice(0, 6).map(i => `<li><strong>${i.title}</strong><div class="mini">${i.addr1 || ''}</div></li>`).join('')
  return `
    <div style="padding:12px 16px;min-width:220px;">
      <h4 style="margin:0 0 8px;">${group.name} — ${group.count}건</h4>
      <ul style="padding:0;margin:0;list-style:none;max-height:200px;overflow:auto;">
        ${list}
      </ul>
    </div>
  `
}

onMounted(async () => {
  if (!kakaoKey) {
    console.warn('VITE_KAKAO_JS_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.')
    return
  }

  try {
    await loadKakaoScript()
    window.kakao.maps.load(createMap)
  } catch (error) {
    console.error('Kakao Maps SDK 로드 실패', error)
  }
})
</script>

<style scoped>
.map-legend { padding:12px 14px; border-radius:12px; background:#fff; box-shadow:0 10px 24px rgba(15,23,42,0.06); font-size:13px; color:#475569; }
.map-legend strong { display:block; margin-bottom:8px; color:#0f1724 }
.map-legend .legend-row { display:flex; align-items:center; gap:8px; margin-top:6px }
.map-legend .dot { width:12px; height:12px; border-radius:50%; display:inline-block }
.dot.very-high { background:#0b74b2 }
.dot.high { background:#55b5ff }
.dot.rise { background:#0aa27a }

.district-overlay { background:rgba(255,255,255,0.95); padding:8px 10px; border-radius:10px; box-shadow:0 8px 20px rgba(15,23,42,0.08); border:1px solid rgba(15,23,42,0.06); }
.district-overlay strong { display:block; font-size:13px; color:#0f1724 }
.district-overlay .count { font-size:12px; color:#6b7280 }

#map { min-height:560px; border-radius:10px; overflow:hidden }
</style>
