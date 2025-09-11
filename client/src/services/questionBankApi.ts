import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const authData = JSON.parse(authStorage);
        if (authData.token && authData.isAuthenticated) {
          config.headers.Authorization = `Bearer ${authData.token}`;
        }
      }
    } catch (error) {
      console.error('Failed to parse auth storage:', error);
      localStorage.removeItem('auth-storage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 题目接口类型定义
export interface Question {
  _id: string;
  content: string;
  type: string;
  subject: string;
  difficulty?: string;
  options?: Array<string | { label: string; content: string; isCorrect: boolean }>;
  correctAnswer?: string | number;
  explanation?: string;
  knowledgePoints?: string[];
  tags?: string[];
  chapter?: string;
  section?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
  // 图片相关字段
  imageData?: string;
  mimeType?: string;
  // SVG图形相关字段
  svgData?: string;
  figureProperties?: any;
  hasGeometryFigure?: boolean;
  statistics?: {
    totalAttempts: number;
    correctAttempts: number;
    averageTime: number;
  };
}

export interface QuestionListResponse {
  success: boolean;
  data: {
    questions: Question[];
    pagination: {
      current: number;
      total: number;
      limit: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface QuestionStatsResponse {
  success: boolean;
  data: {
    total: number;
    byType: Array<{ type: string; count: number }>;
    byDifficulty: Array<{ difficulty: string; count: number }>;
    recentActivity: Array<{ date: string; count: number }>;
  };
}

export interface CreateQuestionRequest {
  content: string;
  type: string;
  difficulty?: string;
  options?: Array<string | { label: string; content: string; isCorrect: boolean }>;
  correctAnswer?: string | number;
  explanation?: string;
  knowledgePoints?: string[];
  tags?: string[];
  chapter?: string;
  section?: string;
  source?: string;
  // SVG图形相关字段
  svgData?: string;
  figureProperties?: any;
  hasGeometryFigure?: boolean;
}

export interface BatchOperationRequest {
  action: 'delete' | 'update' | 'export';
  questionIds: string[];
  data?: any;
}

export interface QuestionListParams {
  page?: number;
  limit?: number;
  type?: string;
  difficulty?: string;
  keyword?: string;
  knowledgePoint?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 题库管理API
export const questionBankApi = {
  // 获取支持的学科列表
  async getSubjects() {
    const response = await api.get('/question-bank');
    return response.data;
  },

  // 获取学科题目列表
  async getQuestions(subject: string, params: QuestionListParams = {}): Promise<QuestionListResponse> {
    const response = await api.get(`/question-bank/${subject}`, { params });
    return response.data;
  },

  // 获取学科统计信息
  async getStats(subject: string): Promise<QuestionStatsResponse> {
    const response = await api.get(`/question-bank/${subject}/stats`);
    return response.data;
  },

  // 获取单个题目详情
  async getQuestion(subject: string, id: string): Promise<{ success: boolean; data: Question }> {
    const response = await api.get(`/question-bank/${subject}/${id}`);
    return response.data;
  },

  // 创建题目
  async createQuestion(subject: string, data: CreateQuestionRequest): Promise<{ success: boolean; data: { questionId: string } }> {
    const response = await api.post(`/question-bank/${subject}`, data);
    return response.data;
  },

  // 更新题目
  async updateQuestion(subject: string, id: string, data: Partial<CreateQuestionRequest>): Promise<{ success: boolean; data: Question }> {
    const response = await api.put(`/question-bank/${subject}/${id}`, data);
    return response.data;
  },

  // 删除题目
  async deleteQuestion(subject: string, id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/question-bank/${subject}/${id}`);
    return response.data;
  },

  // 批量操作
  async batchOperation(subject: string, data: BatchOperationRequest): Promise<{ success: boolean; message: string; data?: any }> {
    const response = await api.post(`/question-bank/${subject}/batch`, data);
    return response.data;
  },
};

export default questionBankApi;