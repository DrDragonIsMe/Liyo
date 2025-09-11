import React, { useState } from 'react';
import {
  TrashIcon,
  DocumentDuplicateIcon,
  TagIcon,
  ArchiveBoxIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

interface BatchOperationsProps {
  selectedQuestions: string[];
  onBatchOperation: (action: string, questionIds: string[], data?: any) => void;
  onClearSelection: () => void;
}

const BatchOperations: React.FC<BatchOperationsProps> = ({
  selectedQuestions,
  onBatchOperation,
  onClearSelection
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTag, setNewTag] = useState('');

  if (selectedQuestions.length === 0) {
    return null;
  }

  const handleBatchDelete = () => {
    if (window.confirm(`确定要删除选中的 ${selectedQuestions.length} 道题目吗？此操作不可撤销。`)) {
      onBatchOperation('delete', selectedQuestions);
      onClearSelection();
    }
  };

  const handleBatchDuplicate = () => {
    onBatchOperation('duplicate', selectedQuestions);
    onClearSelection();
  };

  const handleBatchArchive = () => {
    onBatchOperation('archive', selectedQuestions);
    onClearSelection();
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      onBatchOperation('addTag', selectedQuestions, newTag.trim());
      setNewTag('');
      setShowTagModal(false);
      onClearSelection();
    }
  };

  const operations = [
    {
      id: 'duplicate',
      label: '批量复制',
      icon: DocumentDuplicateIcon,
      color: 'text-blue-600 hover:bg-blue-50',
      action: handleBatchDuplicate
    },
    {
      id: 'tag',
      label: '添加标签',
      icon: TagIcon,
      color: 'text-green-600 hover:bg-green-50',
      action: () => setShowTagModal(true)
    },
    {
      id: 'archive',
      label: '批量归档',
      icon: ArchiveBoxIcon,
      color: 'text-yellow-600 hover:bg-yellow-50',
      action: handleBatchArchive
    },
    {
      id: 'delete',
      label: '批量删除',
      icon: TrashIcon,
      color: 'text-red-600 hover:bg-red-50',
      action: handleBatchDelete
    }
  ];

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-sm font-medium text-blue-800">
              已选择 {selectedQuestions.length} 道题目
            </span>
          </div>
          <button
            onClick={onClearSelection}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            清除选择
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* 快速删除按钮 */}
          <button
            onClick={handleBatchDelete}
            className="flex items-center gap-2 px-3 py-2 text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
            删除
          </button>

          {/* 更多操作下拉菜单 */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              更多操作
              <ChevronDownIcon className={cn(
                "h-4 w-4 transition-transform",
                showDropdown && "rotate-180"
              )} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  {operations.map((operation) => {
                    const Icon = operation.icon;
                    return (
                      <button
                        key={operation.id}
                        onClick={() => {
                          operation.action();
                          setShowDropdown(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                          operation.color
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {operation.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 添加标签模态框 */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                为选中的 {selectedQuestions.length} 道题目添加标签
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    标签名称
                  </label>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="输入标签名称"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTag();
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowTagModal(false);
                      setNewTag('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                    className={cn(
                      "px-4 py-2 text-white rounded-md transition-colors",
                      newTag.trim()
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-400 cursor-not-allowed"
                    )}
                  >
                    添加标签
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 点击外部关闭下拉菜单 */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </>
  );
};

export default BatchOperations;