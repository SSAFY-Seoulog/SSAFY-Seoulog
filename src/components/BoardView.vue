<template>
  <div class="board-container">
    <header class="board-header">
      <h2>Seoulog 익명 커뮤니티 (서울 권역)</h2>
      <p class="warning-banner">
        ⚠️ 본 서비스는 교육용으로 개발되었으며, 작성된 데이터는 브라우저(localStorage)에만 저장되며 외부 기기와 공유되지 않습니다.
      </p>
    </header>

    <section v-if="isWriting || isEditing" class="card form-section">
      <h3>{{ isEditing ? '게시글 수정' : '새로운 로컬 정보 공유하기' }}</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>지역 카테고리</label>
          <select v-model="form.category" required class="form-control">
            <option v-for="cat in writeCategories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>닉네임 (익명)</label>
            <input v-model="form.author" type="text" required class="form-control" placeholder="익명닉네임">
          </div>
          <div class="form-group">
            <label>수정/삭제 비밀번호</label>
            <input v-model="form.password" type="password" required class="form-control" placeholder="비밀번호 입력">
          </div>
        </div>

        <div class="form-group">
          <label>제목</label>
          <input v-model="form.title" type="text" required class="form-control" placeholder="제목을 입력하세요.">
        </div>

        <div class="form-group">
          <label>내용</label>
          <textarea v-model="form.content" required class="form-control" rows="6" placeholder="내용을 입력하세요."></textarea>
        </div>

        <div class="button-group">
          <button type="button" @click="cancelWrite" class="btn btn-secondary">취소</button>
          <button type="submit" class="btn btn-primary">{{ isEditing ? '수정 완료' : '등록하기' }}</button>
        </div>
      </form>
    </section>

    <section v-else-if="selectedPost" class="card detail-section">
      <div class="detail-header">
        <span class="badge">{{ selectedPost.category }}</span>
        <h2>{{ selectedPost.title }}</h2>
        <div class="post-meta">
          <span>작성자: <strong>{{ selectedPost.author }}</strong></span>
          <span>작성일: {{ formatDate(selectedPost.createdAt) }}</span>
          <span>조회수: {{ selectedPost.views }}</span>
        </div>
      </div>
      <div class="detail-body">
        <p class="post-content">{{ selectedPost.content }}</p>
      </div>
      <div class="detail-actions">
        <button @click="selectedPost = null" class="btn btn-secondary">목록으로</button>
        <div class="auth-actions">
          <button @click="openAuthModal('edit')" class="btn btn-warning">수정</button>
          <button @click="openAuthModal('delete')" class="btn btn-danger">삭제</button>
        </div>
      </div>
    </section>

    <section v-else>
      <div class="list-controls">
        <div class="filter-group">
          <label for="category-filter">카테고리 필터:</label>
          <select id="category-filter" v-model="selectedCategory" class="form-control inline-select">
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
        <button @click="startWrite" class="btn btn-primary">✏️ 글쓰기</button>
      </div>

      <div class="table-responsive">
        <table class="post-table">
          <thead>
            <tr>
              <th style="width: 15%">카테고리</th>
              <th style="width: 50%">제목</th>
              <th style="width: 15%">작성자</th>
              <th style="width: 12%">작성일</th>
              <th style="width: 8%">조회</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredPosts.length === 0">
              <td colspan="5" class="no-data">등록된 게시글이 없습니다.</td>
            </tr>
            <tr v-for="post in paginatedPosts" :key="post.id" @click="viewPost(post.id)" class="clickable-row">
              <td><span class="badge">{{ post.category }}</span></td>
              <td class="text-left font-semibold">{{ post.title }}</td>
              <td>{{ post.author }}</td>
              <td>{{ formatDate(post.createdAt) }}</td>
              <td>{{ post.views }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="pagination-container">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 1" 
          class="page-btn arrow"
        >
          &lt;
        </button>

        <button 
          v-for="page in totalPages" 
          :key="page" 
          @click="changePage(page)" 
          :class="['page-btn', { active: currentPage === page }]"
        >
          {{ page }}
        </button>

        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage === totalPages" 
          class="page-btn arrow"
        >
          &gt;
        </button>
      </div>
    </section>

    <div v-if="authModal.show" class="modal-backdrop">
      <div class="modal">
        <h3>본인 확인</h3>
        <p>비밀번호를 입력해주세요.</p>
        <div class="form-group">
          <input v-model="authModal.password" type="password" class="form-control" placeholder="비밀번호" @keyup.enter="confirmAuth">
        </div>
        <p v-if="authModal.error" class="error-text">{{ authModal.error }}</p>
        <div class="button-group">
          <button @click="closeAuthModal" class="btn btn-secondary">취소</button>
          <button @click="confirmAuth" class="btn btn-primary">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// 선정 권역 카테고리 (예: 서울 권역 세부 카테고리)
const CATEGORIES = [
  '전체',
  '종로/중구 (도심)',
  '마포/서대문 (서북)',
  '강남/서초 (강남)',
  '성동/광진 (동북)',
  '로컬 꿀팁 공유'
]

function useBoard() {
  // localStorage에서 데이터를 가져오고, 없으면 빈 배열로 초기화
  const posts = ref(JSON.parse(localStorage.getItem('seoulog_posts')) || [
    // 초기 더미 데이터 예시 (최초 접속 시 확인용)
    {
      id: 1,
      category: '마포/서대문 (서북)',
      title: '경의선 숲길 근처 조용한 공유 작업 공간 추천합니다!',
      content: '연남동 끝자락에 있는 조용한 카페인데 익명으로 정보 공유해요. 노트북 작업하기 정말 좋습니다.',
      author: '마포주민',
      password: '1234', // 제약사항에 따른 평문 저장
      createdAt: '2026-07-14T10:00:00.000Z',
      views: 12
    },
    {
      id: 2,
      category: '성동/광진 (동북)',
      title: '성수동 팝업스토어 대기 걸어놓고 시간 때우기 좋은 틈새 공간',
      content: '팝업스토어 대기 시간 2시간 뜨면 정말 난감하죠. 연무장길 뒤편 골목으로 조금만 들어가면 무료로 관람할 수 있는 작은 갤러리나 쇼룸이 꽤 많습니다. 에어컨 쐬면서 가볍게 구경하다 보면 입장 톡 금방 와요.',
      author: '팝업러',
      password: 'pass',
      createdAt: '2026-07-14T10:00:00.000Z',
      views: 15
    },
    {
      id: 3,
      category: '강남/서초 (강남)',
      title: '반포 한강공원 잠수교 보행 편하게 건너는 시간대 추천',
      content: '요즘 잠수교 쪽에 행사나 차 없는 거리 많이 하던데, 해 질 무렵 노을 보면서 남단에서 북단 방향으로 걸어 올라가면 시야가 확 트여서 기분 진짜 좋습니다. 자전거 도로랑 보행로 잘 구분되어 있으니 안전하게 걸어보세요.',
      author: '서초바람',
      password: 'pass',
      createdAt: '2026-07-14T11:05:00.000Z',
      views: 20
    },
    {
      id: 4,
      category: '종로/중구 (도심)',
      title: '삼청동 수제비 대기 없이 먹는 애매한 시간대 공유',
      content: '워낙 유명한 곳이라 주말엔 줄이 엄청 길잖아요? 토요일 기준 오후 3시 반에서 4시 사이에 가면 웨이팅 거의 없이 바로 입장 가능합니다. 회전율이 빨라서 살짝 대기해도 금방 빠지긴 하니 참고하세요!',
      author: '삼청동러버',
      password: 'pass',
      createdAt: '2026-07-14T13:20:00.000Z',
      views: 42
    },
    {
      id: 5,
      category: '마포/서대문 (서북)',
      title: '경의선 숲길 근처 조용한 공유 작업 공간 추천합니다!',
      content: '연남동 끝자락에 있는 조용한 카페인데 익명으로 정보 공유해요. 노트북 작업하기 정말 좋습니다.',
      author: '마포주민',
      password: 'pass',
      createdAt: '2026-07-14T15:45:00.000Z',
      views: 13
    },
    {
      id: 6,
      category: '성동/광진 (동북)',
      title: '건대입구역 먹자골목 너무 시끄러울 때 피신하는 자양동 이자카야',
      content: '건대 메인 거리는 음악 소리도 크고 너무 대학가 텐션이라 피곤할 때가 있죠. 자양동 쪽으로 한 블록만 내려오면 조용한 1인 셰프 야키토리 집이 있어요. 하이볼 한 잔에 꼬치구이 몇 개 먹으면서 조용히 얘기 나누기 최고입니다.',
      author: '건대화석',
      password: 'pass',
      createdAt: '2026-07-14T18:12:00.000Z',
      views: 25
    },
    {
      id: 7,
      category: '강남/서초 (강남)',
      title: '양재천 메타세쿼이아길 주차 및 무료 산책 꿀팁',
      content: '양재천 영동2교 근처 공영주차장 이용하시면 주차비 정말 저렴합니다. 주말 낮에는 사람 좀 있지만 저녁 8시 이후에 가면 가로등 불빛이 예쁘게 켜져서 연인들 데이트 코스나 조용히 생각 정리하며 걷기 최적이에요.',
      author: '양재천스나이퍼',
      password: 'pass',
      createdAt: '2026-07-14T23:00:00.000Z',
      views: 18
    },
    {
      id: 8,
      category: '종로/중구 (도심)',
      title: '을지로3가 인쇄소 골목 숨겨진 LP바 솔직 후기 (익명 공유)',
      content: '진짜 낡은 건물 3층에 간판도 없이 영업하는 LP바인데 아는 사람만 갑니다. 사장님 신청곡도 잘 틀어주시고 하이볼 비율이 예술이에요. 금요일 밤에 퇴근하고 혼술하러 가기에도 부담 없는 아지트 느낌입니다.',
      author: '힙지로탐험가',
      password: 'pass',
      createdAt: '2026-07-15T04:20:00.000Z',
      views: 33
    },
    {
      id: 9,
      category: '마포/서대문 (서북)',
      title: '홍대입구역 경의선 책거리 산책길 조용한 벤치 명당 위치',
      content: '책거리 중간쯤 올라가다 보면 책방 건물 윗길 쪽에 작은 대나무 숲처럼 조성해 둔 벤치 자리가 있어요. 거기는 유동인구도 적고 그늘이 져서 테이크아웃 커피 한 잔 들고 멍 때리기 딱 좋습니다.',
      author: '경의선단골',
      password: 'pass',
      createdAt: '2026-07-15T07:40:00.000Z',
      views: 9
    },
    {
      id: 10,
      category: '성동/광진 (동북)',
      title: '뚝섬역 서울숲 뒤편 조용하게 노트북 작업하기 좋은 카페 공유',
      content: '성수동 메인거리는 주말에 사람 터져나가서 작업 절대 못 하는데요, 뚝섬역 갈비골목 안쪽 너머 주택가에 있는 북카페는 다들 공부하는 분위기라 조용합니다. 사장님이 직접 굽는 스콘도 진짜 맛있어요.',
      author: '성수동주민',
      password: 'pass',
      createdAt: '2026-07-15T09:15:00.000Z',
      views: 14
    },
    {
      id: 11,
      category: '강남/서초 (강남)',
      title: '강남역 11번 출구 헬게이트 피하는 신분당선 라인 출구 팁',
      content: '출퇴근 시간에 11번, 12번 출구는 에스컬레이터 줄만 5분 넘게 서야 하잖아요? 약속 장소가 그쪽이더라도 차라리 신분당선 쪽 4번이나 5번 출구로 나와서 지상으로 걸어가시는 게 정신건강에 훨씬 이롭습니다.',
      author: '강남역도비',
      password: 'pass',
      createdAt: '2026-07-15T11:30:00.000Z',
      views: 21
    },
    {
      id: 12,
      category: '종로/중구 (도심)',
      title: '정동길 근처 직장인 점심 산책코스랑 조용한 테이크아웃 카페',
      content: '서대문역에서 정동길로 이어지는 라인 점심시간에 산책하기 너무 좋습니다. 정동교회 맞은편 골목에 숨겨진 작은 에스프레소 바가 있는데, 12시 반쯤 가면 한적하고 크림 들어간 에스프레소가 진짜 예술이에요.',
      author: '정동길산책러',
      password: 'pass',
      createdAt: '2026-07-15T12:00:00.000Z',
      views: 5
    },
  ])

  // 로컬스토리지 자동 저장
  watch(posts, (newPosts) => {
    localStorage.setItem('seoulog_posts', JSON.stringify(newPosts))
  }, { deep: true })

  // 1. Create (작성)
  const createPost = (postData) => {
    const newPost = {
      id: Date.now(), // 고유 ID 시퀀스 대체
      category: postData.category,
      title: postData.title,
      content: postData.content,
      author: postData.author,
      password: postData.password, // 평문 저장
      createdAt: new Date().toISOString(),
      views: 0
    }
    posts.value.unshift(newPost)
    return newPost
  }

  // 2. Read (상세 조회 - 조회수 증가 포함)
  const getPost = (id) => {
    const post = posts.value.find(p => p.id === Number(id))
    if (post) {
      post.views += 1 // 상세 보기 시 조회수 단순 증가
    }
    return post
  }

  // 3. Update (수정 - 비밀번호 검증 포함)
  const updatePost = (id, updatedData, inputPassword) => {
    const index = posts.value.findIndex(p => p.id === Number(id))
    if (index === -1) return { success: false, message: '게시글을 찾을 수 없습니다.' }
    
    // 평문 비밀번호 비교 (제약 준수)
    if (posts.value[index].password !== inputPassword) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' }
    }

    posts.value[index] = {
      ...posts.value[index],
      category: updatedData.category,
      title: updatedData.title,
      content: updatedData.content,
      author: updatedData.author // 작성자 이름도 수정 허용할 경우
    }
    return { success: true }
  }

  // 4. Delete (삭제 - 비밀번호 검증 포함)
  const deletePost = (id, inputPassword) => {
    const index = posts.value.findIndex(p => p.id === Number(id))
    if (index === -1) return { success: false, message: '게시글을 찾을 수 없습니다.' }

    if (posts.value[index].password !== inputPassword) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' }
    }

    posts.value.splice(index, 1)
    return { success: true }
  }

  return {
    posts,
    createPost,
    getPost,
    updatePost,
    deletePost
  }
}

// 컴포넌트 로직
const { posts, createPost, getPost, updatePost, deletePost } = useBoard()

const categories = CATEGORIES
const writeCategories = CATEGORIES.filter(cat => cat !== '전체')

const selectedCategory = ref('전체')
const selectedPost = ref(null)
const isWriting = ref(false)
const isEditing = ref(false)
const form = ref({
  category: writeCategories[0],
  title: '',
  content: '',
  author: '',
  password: ''
})

const authModal = ref({
  show: false,
  type: '',
  password: '',
  error: ''
})

const filteredPosts = computed(() => {
  if (selectedCategory.value === '전체') return posts.value
  return posts.value.filter(post => post.category === selectedCategory.value)
})

// ==========================================
// 💡 페이지네이션 관련 상태 변수
// ==========================================
const currentPage = ref(1)      // 현재 페이지 번호
const postsPerPage = 10         // 한 페이지에 보여줄 게시글 수

// 1. 카테고리가 바뀌면 페이지 번호를 1로 초기화해 줍니다.
watch(selectedCategory, () => {
  currentPage.value = 1
})

// 2. 전체 페이지 수 계산 (예: 23개 글이 있으면 총 3페이지가 나옴)
const totalPages = computed(() => {
  return Math.ceil(filteredPosts.value.length / postsPerPage) || 1
})

// 3. 현재 페이지에 해당하는 '10개의 게시글'만 쏙 잘라내서 테이블에 뿌려주는 computed
const paginatedPosts = computed(() => {
  const startIndex = (currentPage.value - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage
  return filteredPosts.value.slice(startIndex, endIndex)
})

// 4. 페이지 이동 처리 함수
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const resetForm = () => {
  form.value = {
    category: writeCategories[0],
    title: '',
    content: '',
    author: '',
    password: ''
  }
}

const startWrite = () => {
  resetForm()
  isWriting.value = true
}

const cancelWrite = () => {
  isWriting.value = false
  isEditing.value = false
  resetForm()
}

const handleSubmit = () => {
  if (isEditing.value) {
    const res = updatePost(selectedPost.value.id, form.value, form.value.password)
    if (res.success) {
      selectedPost.value = getPost(selectedPost.value.id)
      isEditing.value = false
      resetForm()
    } else {
      alert(res.message)
    }
  } else {
    createPost(form.value)
    isWriting.value = false
    resetForm()
  }
}

const viewPost = (id) => {
  selectedPost.value = getPost(id)
}

const openAuthModal = (type) => {
  authModal.value = {
    show: true,
    type,
    password: '',
    error: ''
  }
}

const closeAuthModal = () => {
  authModal.value.show = false
}

const confirmAuth = () => {
  const targetPassword = selectedPost.value.password
  if (authModal.value.password !== targetPassword) {
    authModal.value.error = '비밀번호가 올바르지 않습니다.'
    return
  }

  const type = authModal.value.type
  const id = selectedPost.value.id
  const inputPwd = authModal.value.password

  closeAuthModal()

  if (type === 'edit') {
    form.value = {
      category: selectedPost.value.category,
      title: selectedPost.value.title,
      content: selectedPost.value.content,
      author: selectedPost.value.author,
      password: selectedPost.value.password
    }
    isEditing.value = true
  } else if (type === 'delete') {
    const res = deletePost(id, inputPwd)
    if (res.success) {
      alert('게시글이 삭제되었습니다.')
      selectedPost.value = null
    } else {
      alert(res.message)
    }
  }
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.board-container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  color: #333333;
}
.board-header {
  margin-bottom: 2rem;
  border-bottom: 2px solid #005ea2;
  padding-bottom: 1rem;
}
.warning-banner {
  background-color: #ffebeb;
  color: #ba1a1a;
  border: 1px solid #ffccd0;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}
.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  text-align: left;
}
.form-group {
  margin-bottom: 1.25rem;
}
.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #717783;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
}
.button-group { display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem }
.list-controls { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem }
.post-table { width:100%; border-collapse:collapse }
.post-table th, .post-table td { padding:0.75rem; border-bottom:1px solid #e6eef6 }
.clickable-row { cursor:pointer }
.modal-backdrop { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.4) }
.modal { width:360px; background:#fff; padding:1.25rem; border-radius:8px }
.error-text { color:#b91c1c; margin-top:0.5rem }

.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.35rem;
  margin-top: 1.5rem;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 6px;
  border: 1px solid #e2e8f0;
  background-color: #ffffff;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background-color: #f7fafc;
  border-color: #cbd5e0;
  color: #1a202c;
}

/* 현재 머물러 있는 페이지 번호 스타일 */
.page-btn.active {
  background-color: #005ea2;
  border-color: #005ea2;
  color: #ffffff;
  font-weight: bold;
}

/* 이전/다음 버튼 비활성화 상태 */
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: #edf2f7;
}
</style>
