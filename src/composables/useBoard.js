import { ref, watch } from 'vue'

// 선정 권역 카테고리 (예: 서울 권역 세부 카테고리)
export const CATEGORIES = [
  '전체',
  '종로/중구 (도심)',
  '마포/서대문 (서북)',
  '강남/서초 (강남)',
  '성동/광진 (동북)',
  '로컬 꿀팁 공유'
]

export function useBoard() {
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
    }
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