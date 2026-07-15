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
            <tr v-for="post in filteredPosts" :key="post.id" @click="viewPost(post.id)" class="clickable-row">
              <td><span class="badge">{{ post.category }}</span></td>
              <td class="text-left font-semibold">{{ post.title }}</td>
              <td>{{ post.author }}</td>
              <td>{{ formatDate(post.createdAt) }}</td>
              <td>{{ post.views }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 비밀번호 확인 모달 -->
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

import { ref, computed } from 'vue'
import { useBoard, CATEGORIES } from '../composables/useBoard'

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

const formatDate = (isoString) => {import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import BoardView from '@/views/BoardView.vue'

const router = createRouter({
  history: createWebHistory(),

  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/board',
      name: 'board',
      component: BoardView
    }
  ]
})

export default router
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
.list-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.inline-select {
  width: auto;
  display: inline-block;
  margin-left: 0.5rem;
}
.table-responsive {
  width: 100%;
  overflow-x: auto;
  background: white;
  border-radius: 12px;
}
.post-table {
  width: 100%;
  border-collapse: collapse;
}
.post-table th, .post-table td {
  padding: 1rem;
  border-bottom: 1px solid #edf2f7;
}
.post-table th {
  background-color: #f7fafc;
  color: #4a5568;
}
.clickable-row {
  cursor: pointer;
}
.clickable-row:hover {
  background-color: #f0f7ff;
}
.text-left {
  text-align: left;
}
.font-semibold {
  font-weight: 600;
}
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}
.btn-primary {
  background-color: #005ea2;
  color: white;
}
.btn-secondary {
  background-color: #e2e8f0;
  color: #4a5568;
}
.btn-warning {
  background-color: #ffb547;
  color: white;
}
.btn-danger {
  background-color: #ba1a1a;
  color: white;
}
.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
.badge {
  background-color: #ebf8ff;
  color: #2b6cb0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}
.detail-header {
  border-bottom: 1px solid #edf2f7;
  padding-bottom: 1.5rem;
}
.post-meta {
  display: flex;
  gap: 1.5rem;
  color: #718096;
  font-size: 0.9rem;
  margin-top: 0.75rem;
}
.post-content {
  line-height: 1.7;
  white-space: pre-line;
  font-size: 1.05rem;
}
.detail-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  border-top: 1px solid #edf2f7;
  padding-top: 1.5rem;
}
.auth-actions {
  display: flex;
  gap: 0.5rem;
}
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.modal {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
}
.error-text {
  color: #ba1a1a;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
</style>