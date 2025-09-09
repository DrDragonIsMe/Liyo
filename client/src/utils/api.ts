const API_BASE_URL = 'http://localhost:5001/api';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint: string, options: RequestOptions = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('token') || 'demo-token';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // HTTP method helpers
  async get(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Auth methods
  async login(credentials: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: { name: string; email: string; password: string }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Learning paths methods
  async getSubjects() {
    return this.request('/learning-paths/subjects');
  }

  async getSubjectDetails(subjectId: string) {
    return this.request(`/learning-paths/subjects/${subjectId}`);
  }

  async createLearningPath(pathData: any) {
    return this.request('/learning-paths', {
      method: 'POST',
      body: JSON.stringify(pathData),
    });
  }

  async getLearningPaths(userId: string) {
    return this.request(`/learning-paths/user/${userId}`);
  }

  async updateLearningPath(pathId: string, updates: any) {
    return this.request(`/learning-paths/${pathId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteLearningPath(pathId: string) {
    return this.request(`/learning-paths/${pathId}`, {
      method: 'DELETE',
    });
  }

  // Papers methods
  async uploadPaper(formData: FormData) {
    const url = `${this.baseURL}/papers/upload`;
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }

  // 预览试卷
  async previewPaper(paperId: string): Promise<Blob> {
    const url = `${this.baseURL}/papers/${paperId}/preview`;
    let token = localStorage.getItem('token');
    // 如果token无效或不存在，使用demo-token
    if (!token || token === 'null' || token === 'undefined') {
      token = 'demo-token';
    }
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.blob();
  }

  // 下载试卷
  async downloadPaper(paperId: string): Promise<Blob> {
    const url = `${this.baseURL}/papers/${paperId}/download`;
    let token = localStorage.getItem('token');
    // 如果token无效或不存在，使用demo-token
    if (!token || token === 'null' || token === 'undefined') {
      token = 'demo-token';
    }
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.blob();
  }

  // 获取试卷统计信息
  async getPaperStats(paperId: string) {
    return this.request(`/papers/${paperId}/stats`);
  }

  async getPapers(userId: string) {
    return this.request(`/papers/user/${userId}`);
  }

  async getPaper(paperId: string) {
    return this.request(`/papers/${paperId}`);
  }

  async deletePaper(paperId: string) {
    return this.request(`/papers/${paperId}`, {
      method: 'DELETE',
    });
  }

  // Questions methods
  async getQuestions(paperId: string) {
    return this.request(`/questions/paper/${paperId}`);
  }

  async updateQuestion(questionId: string, updates: any) {
    return this.request(`/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // AI Chat methods
  async sendChatMessage(message: string, context: any = {}) {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }
}

const api = new ApiClient();
export default api;