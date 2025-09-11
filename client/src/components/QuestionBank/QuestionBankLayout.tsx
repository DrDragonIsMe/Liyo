import React, { useState, useEffect } from 'react';
import QuestionList from './QuestionList';
import QuestionStats from './QuestionStats';
import { questionBankApi, Question, QuestionListParams } from '../../services/questionBankApi';
import { useSubjectStore } from '../../store/subjectStore';

const QuestionBankLayout: React.FC = () => {
  const { currentSubject } = useSubjectStore();
  const [activeTab, setActiveTab] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    limit: 20,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState<QuestionListParams>({
    page: 1,
    limit: 20
  });

  // 加载题目列表
  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!currentSubject) return;
      const response = await questionBankApi.getQuestions(currentSubject.name, filters);
      setQuestions(response.data.questions);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || '加载题目失败');
    } finally {
      setLoading(false);
    }
  };

  // 当学科或筛选条件改变时重新加载
  useEffect(() => {
    if (currentSubject) {
      loadQuestions();
    }
  }, [currentSubject, filters]);

  // 处理筛选条件变化
  const handleFiltersChange = (newFilters: Partial<QuestionListParams>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  // 处理分页变化
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // 处理题目删除
  const handleQuestionDelete = async (questionId: string) => {
    try {
      if (!currentSubject) return;
      await questionBankApi.deleteQuestion(currentSubject.name, questionId);
      // 重新加载当前页
      loadQuestions();
    } catch (err: any) {
      setError(err.response?.data?.message || '删除题目失败');
    }
  };

  // 处理批量操作
  const handleBatchOperation = async (action: string, questionIds: string[]) => {
    try {
      if (!currentSubject) return;
      await questionBankApi.batchOperation(currentSubject.name, {
        action: action as any,
        questionIds
      });
      // 重新加载当前页
      loadQuestions();
    } catch (err: any) {
      setError(err.response?.data?.message || '批量操作失败');
    }
  };

  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
  };

  return (
    <div>
      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* 左侧 - 题目列表 */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-lg shadow">
            {/* 标签页 */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => handleTabChange(0)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 0
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  题目管理
                </button>
                <button
                  onClick={() => handleTabChange(1)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 1
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  批量操作
                </button>
              </nav>
            </div>

            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <QuestionList
                  questions={questions}
                  loading={loading}
                  pagination={pagination}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onPageChange={handlePageChange}
                  onQuestionDelete={handleQuestionDelete}
                  onBatchOperation={handleBatchOperation}
                  activeTab={activeTab}
                  subject={currentSubject?.name || ''}
                />
              )}
            </div>
          </div>
        </div>

        {/* 右侧 - 统计信息 */}
        <div className="lg:col-span-4">
          <QuestionStats subject={currentSubject?.name || ''} />
        </div>
      </div>
    </div>
  );
};

export default QuestionBankLayout;