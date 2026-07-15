const STORAGE_KEY = 'anonymous_board_posts';

export const boardService = {
  // 1. 목록 조회 (Read All)
  getPosts() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  // 2. 상세 조회 (Read One)
  getPost(id) {
    const posts = this.getPosts();
    return posts.find(post => post.id === Number(id)) || null;
  },

  // 3. 게시글 작성 (Create)
  createPost(title, content, password) {
    const posts = this.getPosts();
    const newPost = {
      id: Date.now(), // 고유 ID 생성용
      title,
      content,
      password, // 요구사항 나: 암호화 없이 저장
      createdAt: new Date().toISOString()
    };
    posts.push(newPost);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    return newPost;
  },

  // 4. 게시글 수정 (Update) - 요구사항 나: 비밀번호 일치 여부 검증
  updatePost(id, title, content, inputPassword) {
    const posts = this.getPosts();
    const index = posts.findIndex(post => post.id === Number(id));
    
    if (index === -1) return { success: false, message: '게시글을 찾을 수 없습니다.' };
    
    // 비밀번호 검증
    if (posts[index].password !== inputPassword) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' };
    }

    posts[index].title = title;
    posts[index].content = content;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    return { success: true };
  },

  // 5. 게시글 삭제 (Delete) - 요구사항 나: 비밀번호 일치 여부 검증
  deletePost(id, inputPassword) {
    const posts = this.getPosts();
    const post = posts.find(post => post.id === Number(id));
    
    if (!post) return { success: false, message: '게시글을 찾을 수 없습니다.' };
    
    // 비밀번호 검증
    if (post.password !== inputPassword) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' };
    }

    const filteredPosts = posts.filter(post => post.id !== Number(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPosts));
    return { success: true };
  }
};