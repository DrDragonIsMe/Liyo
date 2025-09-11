import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  DocumentCheckIcon,
  PlusIcon,
  TrashIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { Question, questionBankApi } from '../../services/questionBankApi';
import MathRenderer from '../MathRenderer';
import SVGEditor from '../SVGEditor';

interface QuestionEditorProps {
  question?: Question | null;
  subject: string;
  onClose: () => void;
  onSave: () => void;
}

const QUESTION_TYPES = [
  '选择题',
  '填空题', 
  '解答题',
  '判断题',
  '简答题',
  '计算题',
  '证明题',
  '作文题'
];

const DIFFICULTY_LEVELS = [
  '简单',
  '中等',
  '困难'
];

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  subject,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    content: '',
    type: '选择题',
    difficulty: '中等',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    knowledgePoints: [''],
    tags: [''],
    points: 1,
    svgData: '',
    hasGeometryFigure: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSVGEditor, setShowSVGEditor] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (question) {
      setFormData({
        content: question.content || '',
        type: question.type || '选择题',
        difficulty: question.difficulty || '中等',
        options: question.options ? 
          (Array.isArray(question.options) && question.options.length > 0 && typeof question.options[0] === 'object' 
            ? question.options.map((opt: any) => opt.content || '') 
            : question.options) 
          : ['', '', '', ''],
        correctAnswer: String(question.correctAnswer || ''),
        explanation: question.explanation || '',
        knowledgePoints: question.knowledgePoints || [''],
        tags: question.tags || [''],
        points: 1,
        svgData: (question as any).svgData || '',
        hasGeometryFigure: (question as any).hasGeometryFigure || false
      });
      setShowSVGEditor(!!(question as any).svgData);
    }
  }, [question]);

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.content.trim()) {
      newErrors.content = '题目内容不能为空';
    }

    if (!formData.type) {
      newErrors.type = '请选择题目类型';
    }

    if (formData.type === '选择题' || formData.type === '判断题') {
      if (formData.type === '选择题') {
        const validOptions = formData.options.filter(opt => opt.trim());
        if (validOptions.length < 2) {
          newErrors.options = '选择题至少需要2个选项';
        }
      }
      
      if (!formData.correctAnswer.trim()) {
        newErrors.correctAnswer = '请填写正确答案';
      }
    }

    if (!formData.explanation.trim()) {
      newErrors.explanation = '题目解析不能为空';
    }

    const validKnowledgePoints = formData.knowledgePoints.filter(kp => kp.trim());
    if (validKnowledgePoints.length === 0) {
      newErrors.knowledgePoints = '至少需要一个知识点';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        subject,
        options: formData.options.filter(opt => opt.trim()),
        knowledgePoints: formData.knowledgePoints.filter(kp => kp.trim()),
        tags: formData.tags.filter(tag => tag.trim()),
        svgData: formData.svgData,
        hasGeometryFigure: formData.hasGeometryFigure && formData.svgData.length > 0
      };

      if (question) {
        await questionBankApi.updateQuestion(subject, question._id, submitData);
      } else {
        await questionBankApi.createQuestion(subject, submitData);
      }
      
      onSave();
    } catch (error) {
      console.error('保存题目失败:', error);
      setErrors({ submit: '保存失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  // 处理选项变化
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  // 添加选项
  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, '']
    });
  };

  // 删除选项
  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
    }
  };

  // 处理知识点变化
  const handleKnowledgePointChange = (index: number, value: string) => {
    const newKnowledgePoints = [...formData.knowledgePoints];
    newKnowledgePoints[index] = value;
    setFormData({ ...formData, knowledgePoints: newKnowledgePoints });
  };

  // 添加知识点
  const addKnowledgePoint = () => {
    setFormData({
      ...formData,
      knowledgePoints: [...formData.knowledgePoints, '']
    });
  };

  // 删除知识点
  const removeKnowledgePoint = (index: number) => {
    if (formData.knowledgePoints.length > 1) {
      const newKnowledgePoints = formData.knowledgePoints.filter((_, i) => i !== index);
      setFormData({ ...formData, knowledgePoints: newKnowledgePoints });
    }
  };

  // 处理标签变化
  const handleTagChange = (index: number, value: string) => {
    const newTags = [...formData.tags];
    newTags[index] = value;
    setFormData({ ...formData, tags: newTags });
  };

  // 添加标签
  const addTag = () => {
    setFormData({
      ...formData,
      tags: [...formData.tags, '']
    });
  };

  // 删除标签
  const removeTag = (index: number) => {
    const newTags = formData.tags.filter((_, i) => i !== index);
    setFormData({ ...formData, tags: newTags });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <DocumentCheckIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {question ? '编辑题目' : '新增题目'} - {subject}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 题目类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  题目类型 *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    errors.type ? "border-red-300" : "border-gray-300"
                  )}
                >
                  {QUESTION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                )}
              </div>

              {/* 难度等级 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  难度等级
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DIFFICULTY_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 题目内容 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                题目内容 *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                className={cn(
                  "w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  errors.content ? "border-red-300" : "border-gray-300"
                )}
                placeholder="请输入题目内容..."
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
              {/* 数学公式预览 */}
              {formData.content && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">预览效果：</h4>
                  <div className="text-gray-800">
                    <MathRenderer content={formData.content} />
                  </div>
                </div>
              )}
            </div>

            {/* SVG几何图形编辑 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  几何图形
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowSVGEditor(!showSVGEditor);
                    if (!showSVGEditor) {
                      setFormData({ ...formData, hasGeometryFigure: true });
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors",
                    showSVGEditor
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <PhotoIcon className="h-4 w-4" />
                  {showSVGEditor ? '隐藏编辑器' : '添加几何图形'}
                </button>
              </div>
              
              {showSVGEditor && (
                <div className="mt-3">
                  <SVGEditor
                    initialSvg={formData.svgData}
                    onSvgChange={(svg) => {
                      setFormData({ 
                        ...formData, 
                        svgData: svg,
                        hasGeometryFigure: svg.length > 0
                      });
                    }}
                    width={500}
                    height={350}
                  />
                </div>
              )}
              
              {/* SVG预览 */}
              {formData.svgData && !showSVGEditor && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">几何图形预览：</h4>
                  <div className="flex justify-center">
                    <div 
                      className="border rounded-lg p-4 bg-white"
                      dangerouslySetInnerHTML={{ __html: formData.svgData }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 选项（仅选择题和判断题显示） */}
            {(formData.type === '选择题' || formData.type === '判断题') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选项 {formData.type === '选择题' && '*'}
                </label>
                <div className="space-y-2">
                  {formData.type === '判断题' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="true"
                          name="judgeOption"
                          checked={formData.correctAnswer === '正确'}
                          onChange={() => setFormData({ ...formData, correctAnswer: '正确' })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="true" className="text-sm text-gray-700">正确</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="false"
                          name="judgeOption"
                          checked={formData.correctAnswer === '错误'}
                          onChange={() => setFormData({ ...formData, correctAnswer: '错误' })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="false" className="text-sm text-gray-700">错误</label>
                      </div>
                    </div>
                  ) : (
                    formData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500 w-8">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                        />
                        {formData.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                  
                  {formData.type === '选择题' && formData.options.length < 8 && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      添加选项
                    </button>
                  )}
                </div>
                {errors.options && (
                  <p className="mt-1 text-sm text-red-600">{errors.options}</p>
                )}
              </div>
            )}

            {/* 正确答案 */}
            {formData.type !== '判断题' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  正确答案 {(formData.type === '选择题') && '*'}
                </label>
                <textarea
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  rows={2}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    errors.correctAnswer ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="请输入正确答案..."
                />
                {errors.correctAnswer && (
                  <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>
                )}
                {/* 正确答案预览 */}
                {formData.correctAnswer && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">答案预览：</h4>
                    <div className="text-gray-800">
                      <MathRenderer content={formData.correctAnswer} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 题目解析 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                题目解析 *
              </label>
              <textarea
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                rows={3}
                className={cn(
                  "w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  errors.explanation ? "border-red-300" : "border-gray-300"
                )}
                placeholder="请输入题目解析..."
              />
              {errors.explanation && (
                <p className="mt-1 text-sm text-red-600">{errors.explanation}</p>
              )}
              {/* 解析预览 */}
              {formData.explanation && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">解析预览：</h4>
                  <div className="text-gray-800">
                    <MathRenderer content={formData.explanation} />
                  </div>
                </div>
              )}
            </div>

            {/* 知识点 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                知识点 *
              </label>
              <div className="space-y-2">
                {formData.knowledgePoints.map((kp, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={kp}
                      onChange={(e) => handleKnowledgePointChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入知识点"
                    />
                    {formData.knowledgePoints.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeKnowledgePoint(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addKnowledgePoint}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  添加知识点
                </button>
              </div>
              {errors.knowledgePoints && (
                <p className="mt-1 text-sm text-red-600">{errors.knowledgePoints}</p>
              )}
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签
              </label>
              <div className="space-y-2">
                {formData.tags.map((tag, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => handleTagChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入标签"
                    />
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTag}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  添加标签
                </button>
              </div>
            </div>

            {/* 分值 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分值
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 错误提示 */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </form>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={cn(
              "px-4 py-2 text-white rounded-md transition-colors",
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;