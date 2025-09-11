import React from 'react';
import {
  XMarkIcon,
  PencilIcon,
  TagIcon,
  AcademicCapIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { Question } from '../../services/questionBankApi';
import MathRenderer from '../MathRenderer';
import SVGViewer from '../SVGViewer';
import ImageViewer from '../ImageViewer';

interface QuestionPreviewProps {
  question: Question;
  onClose: () => void;
  onEdit: () => void;
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({
  question,
  onClose,
  onEdit
}) => {
  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取难度颜色
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case '简单': return 'text-green-600 bg-green-50 border-green-200';
      case '中等': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case '困难': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // 获取类型颜色
  const getTypeColor = (type: string) => {
    const colors = {
      '选择题': 'text-blue-600 bg-blue-50 border-blue-200',
      '填空题': 'text-purple-600 bg-purple-50 border-purple-200',
      '解答题': 'text-indigo-600 bg-indigo-50 border-indigo-200',
      '判断题': 'text-green-600 bg-green-50 border-green-200',
      '简答题': 'text-orange-600 bg-orange-50 border-orange-200',
      '计算题': 'text-red-600 bg-red-50 border-red-200',
      '证明题': 'text-pink-600 bg-pink-50 border-pink-200',
      '作文题': 'text-teal-600 bg-teal-50 border-teal-200'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  // 渲染选项
  const renderOptions = () => {
    if (!question.options || question.options.length === 0) {
      return null;
    }

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">选项：</h4>
        <div className="space-y-2">
          {question.options.map((option, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-500 mt-0.5">
                {String.fromCharCode(65 + index)}.
              </span>
              <div className="text-sm text-gray-700 flex-1">
                <MathRenderer content={typeof option === 'string' ? option : option.content} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染正确答案
  const renderCorrectAnswer = () => {
    if (!question.correctAnswer) {
      return null;
    }

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">正确答案：</h4>
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-800">
            <MathRenderer content={String(question.correctAnswer)} />
          </div>
        </div>
      </div>
    );
  };

  // 渲染解析
  const renderExplanation = () => {
    if (!question.explanation) {
      return null;
    }

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">题目解析：</h4>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800 whitespace-pre-wrap">
            <MathRenderer content={question.explanation} />
          </div>
        </div>
      </div>
    );
  };

  // 渲染知识点
  const renderKnowledgePoints = () => {
    if (!question.knowledgePoints || question.knowledgePoints.length === 0) {
      return null;
    }

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <AcademicCapIcon className="h-4 w-4" />
          知识点：
        </h4>
        <div className="flex flex-wrap gap-2">
          {question.knowledgePoints.map((kp, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full"
            >
              {kp}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // 渲染标签
  const renderTags = () => {
    if (!question.tags || question.tags.length === 0) {
      return null;
    }

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <TagIcon className="h-4 w-4" />
          标签：
        </h4>
        <div className="flex flex-wrap gap-2">
          {question.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">题目预览</h2>
              <p className="text-sm text-gray-500">{question.subject}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <PencilIcon className="h-4 w-4" />
              编辑
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* 题目信息 */}
            <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-gray-200">
              <span className={cn(
                "px-3 py-1 text-sm font-medium border rounded-full",
                getTypeColor(question.type)
              )}>
                {question.type}
              </span>
              
              {question.difficulty && (
                <span className={cn(
                  "px-3 py-1 text-sm font-medium border rounded-full",
                  getDifficultyColor(question.difficulty)
                )}>
                  {question.difficulty}
                </span>
              )}

              <div className="flex items-center gap-1 text-sm text-gray-500">
                <ClockIcon className="h-4 w-4" />
                {formatDate(question.createdAt)}
              </div>
            </div>

            {/* 题目内容 */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">题目内容</h3>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  <MathRenderer content={question.content} />
                </div>
              </div>
            </div>

            {/* 题目图片 */}
            {question.imageData && question.mimeType && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">题目图片</h3>
                <ImageViewer
                  imageData={question.imageData}
                  mimeType={question.mimeType}
                  alt="题目图片"
                  showControls={true}
                />
              </div>
            )}

            {/* SVG几何图形 */}
            {question.hasGeometryFigure && question.svgData && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">几何图形</h3>
                <SVGViewer 
                  svgData={question.svgData}
                  title="几何图形"
                  showControls={true}
                />
              </div>
            )}

            {/* 选项 */}
            {renderOptions()}

            {/* 正确答案 */}
            {renderCorrectAnswer()}

            {/* 解析 */}
            {renderExplanation()}

            {/* 知识点 */}
            {renderKnowledgePoints()}

            {/* 标签 */}
            {renderTags()}

            {/* 统计信息 */}
            {question.statistics && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">统计信息：</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {question.statistics.totalAttempts || 0}
                    </div>
                    <div className="text-xs text-gray-500">总答题次数</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {question.statistics.correctAttempts || 0}
                    </div>
                    <div className="text-xs text-gray-500">正确次数</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {question.statistics.totalAttempts > 0 
                        ? Math.round((question.statistics.correctAttempts || 0) / question.statistics.totalAttempts * 100)
                        : 0}%
                    </div>
                    <div className="text-xs text-gray-500">正确率</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      {Math.round(question.statistics.averageTime || 0)}s
                    </div>
                    <div className="text-xs text-gray-500">平均用时</div>
                  </div>
                </div>
              </div>
            )}

            {/* 创建和更新时间 */}
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <span className="font-medium">创建时间：</span>
                  {formatDate(question.createdAt)}
                </div>
                <div>
                  <span className="font-medium">更新时间：</span>
                  {formatDate(question.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPreview;