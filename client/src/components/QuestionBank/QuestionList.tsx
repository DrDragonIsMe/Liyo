import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { Question, QuestionListParams } from '../../services/questionBankApi';
import QuestionEditor from './QuestionEditor';
import QuestionPreview from './QuestionPreview';
import BatchOperations from './BatchOperations';
import MathRenderer from '../MathRenderer';

interface QuestionListProps {
  questions: Question[];
  loading: boolean;
  pagination: {
    current: number;
    total: number;
    limit: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: QuestionListParams;
  onFiltersChange: (filters: QuestionListParams) => void;
  onPageChange: (page: number) => void;
  onQuestionDelete: (questionId: string) => void;
  onBatchOperation: (action: string, questionIds: string[]) => void;
  activeTab: number;
  subject: string;
}

const QUESTION_TYPES = [
  { value: '', label: '全部类型' },
  { value: '选择题', label: '选择题' },
  { value: '填空题', label: '填空题' },
  { value: '解答题', label: '解答题' },
  { value: '判断题', label: '判断题' },
  { value: '简答题', label: '简答题' },
  { value: '计算题', label: '计算题' },
  { value: '证明题', label: '证明题' },
  { value: '作文题', label: '作文题' }
];

const DIFFICULTY_LEVELS = [
  { value: '', label: '全部难度' },
  { value: '简单', label: '简单' },
  { value: '中等', label: '中等' },
  { value: '困难', label: '困难' }
];

const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  loading,
  pagination,
  filters,
  onFiltersChange,
  onPageChange,
  onQuestionDelete,
  onBatchOperation,
  activeTab,
  subject
}) => {
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // 处理搜索
  const handleSearch = (keyword: string) => {
    onFiltersChange({ ...filters, keyword, page: 1 });
  };

  // 处理筛选
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuestions(questions.map(q => q._id));
    } else {
      setSelectedQuestions([]);
    }
  };

  // 处理单选
  const handleSelectQuestion = (questionId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestions([...selectedQuestions, questionId]);
    } else {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    }
  };

  // 处理编辑
  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setShowEditor(true);
  };

  // 处理预览
  const handlePreview = (question: Question) => {
    setPreviewQuestion(question);
    setShowPreview(true);
  };

  // 处理新增
  const handleAdd = () => {
    setEditingQuestion(null);
    setShowEditor(true);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  // 截取内容预览
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // 获取难度颜色
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case '简单': return 'text-green-600 bg-green-50';
      case '中等': return 'text-yellow-600 bg-yellow-50';
      case '困难': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // 获取类型颜色
  const getTypeColor = (type: string) => {
    const colors = {
      '选择题': 'text-blue-600 bg-blue-50',
      '填空题': 'text-purple-600 bg-purple-50',
      '解答题': 'text-indigo-600 bg-indigo-50',
      '判断题': 'text-green-600 bg-green-50',
      '简答题': 'text-orange-600 bg-orange-50',
      '计算题': 'text-red-600 bg-red-50',
      '证明题': 'text-pink-600 bg-pink-50',
      '作文题': 'text-teal-600 bg-teal-50'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  if (showEditor) {
    return (
      <QuestionEditor
        question={editingQuestion}
        subject={subject}
        onClose={() => {
          setShowEditor(false);
          setEditingQuestion(null);
        }}
        onSave={() => {
          setShowEditor(false);
          setEditingQuestion(null);
          // 重新加载列表
          onFiltersChange(filters);
        }}
      />
    );
  }

  if (showPreview && previewQuestion) {
    return (
      <QuestionPreview
        question={previewQuestion}
        onClose={() => {
          setShowPreview(false);
          setPreviewQuestion(null);
        }}
        onEdit={() => {
          setShowPreview(false);
          handleEdit(previewQuestion);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* 搜索和筛选栏 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索题目内容或解析..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.keyword || ''}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* 筛选按钮 */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <FunnelIcon className="h-5 w-5" />
          筛选
        </button>

        {/* 新增按钮 */}
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          新增题目
        </button>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 题目类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                题目类型
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {QUESTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 难度等级 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                难度等级
              </label>
              <select
                value={filters.difficulty || ''}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {DIFFICULTY_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 知识点 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                知识点
              </label>
              <input
                type="text"
                placeholder="输入知识点名称"
                value={filters.knowledgePoint || ''}
                onChange={(e) => handleFilterChange('knowledgePoint', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* 批量操作 */}
      {activeTab === 1 && (
        <BatchOperations
          selectedQuestions={selectedQuestions}
          onBatchOperation={onBatchOperation}
          onClearSelection={() => setSelectedQuestions([])}
        />
      )}

      {/* 题目列表 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* 表头 */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {activeTab === 1 && (
                <input
                  type="checkbox"
                  checked={selectedQuestions.length === questions.length && questions.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              )}
              <span className="text-sm font-medium text-gray-700">
                共 {pagination.totalItems} 道题目
              </span>
            </div>
            {selectedQuestions.length > 0 && (
              <span className="text-sm text-blue-600">
                已选择 {selectedQuestions.length} 道题目
              </span>
            )}
          </div>
        </div>

        {/* 题目列表 */}
        <div className="divide-y divide-gray-200">
          {questions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500">
                {loading ? '正在加载...' : '暂无题目数据'}
              </div>
            </div>
          ) : (
            questions.map((question) => (
              <div key={question._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  {activeTab === 1 && (
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(question._id)}
                      onChange={(e) => handleSelectQuestion(question._id, e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  )}
                  
                  {/* 图片缩略图 */}
                  {(question.imageData || (question.hasGeometryFigure && question.svgData)) && (
                    <div className="flex-shrink-0 w-16 h-16 mr-3">
                      {question.imageData && question.mimeType ? (
                        <img
                          src={`data:${question.mimeType};base64,${question.imageData}`}
                          alt="题目图片"
                          className="w-full h-full object-cover rounded-lg border"
                        />
                      ) : question.hasGeometryFigure && question.svgData ? (
                        <div 
                          className="w-full h-full border rounded-lg bg-gray-50 flex items-center justify-center text-xs text-gray-500"
                          title="几何图形"
                        >
                          📐
                        </div>
                      ) : null}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    {/* 题目内容 */}
                    <div className="mb-2">
                      <div className="text-gray-900 font-medium">
                        <MathRenderer content={truncateContent(question.content)} />
                      </div>
                    </div>

                    {/* 标签和信息 */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        getTypeColor(question.type)
                      )}>
                        {question.type}
                      </span>
                      
                      {question.difficulty && (
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          getDifficultyColor(question.difficulty)
                        )}>
                          {question.difficulty}
                        </span>
                      )}

                      {question.knowledgePoints && question.knowledgePoints.length > 0 && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full text-gray-600 bg-gray-100">
                          {question.knowledgePoints[0]}
                          {question.knowledgePoints.length > 1 && (
                            <span className="ml-1">+{question.knowledgePoints.length - 1}</span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* 创建时间 */}
                    <div className="text-sm text-gray-500">
                      创建于 {formatDate(question.createdAt)}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePreview(question)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="预览"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => handleEdit(question)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => onQuestionDelete(question._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 分页 */}
      {pagination.total > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            显示第 {(pagination.current - 1) * pagination.limit + 1} - {Math.min(pagination.current * pagination.limit, pagination.totalItems)} 条，
            共 {pagination.totalItems} 条记录
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.current - 1)}
              disabled={!pagination.hasPrev}
              className={cn(
                "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md",
                pagination.hasPrev
                  ? "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                  : "text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
              )}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              上一页
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-700">
              第 {pagination.current} 页，共 {pagination.total} 页
            </span>
            
            <button
              onClick={() => onPageChange(pagination.current + 1)}
              disabled={!pagination.hasNext}
              className={cn(
                "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md",
                pagination.hasNext
                  ? "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                  : "text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
              )}
            >
              下一页
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionList;