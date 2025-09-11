import React, { useEffect, useState } from 'react';
import QuestionBankLayout from '../components/QuestionBank/QuestionBankLayout';
import { questionBankApi } from '../services/questionBankApi';
import { useSubjectStore } from '../store/subjectStore';

const QuestionBankPage: React.FC = () => {
  const { currentSubject } = useSubjectStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查API连接
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setLoading(true);
        await questionBankApi.getSubjects();
        setError(null);
      } catch (err) {
        console.error('题库API连接失败:', err);
        setError('无法连接到题库服务，请检查网络连接');
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, []);



  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="flex justify-center items-center min-h-96">
          <div className="text-lg">正在加载题库...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          题库管理
        </h1>
        <p className="text-gray-600">
          按学科管理和组织题目，支持增删改查、批量操作和数学公式编辑
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <QuestionBankLayout />
    </div>
  );
};

export default QuestionBankPage;