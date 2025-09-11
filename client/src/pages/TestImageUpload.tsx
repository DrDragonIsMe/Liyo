import React, { useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const TestImageUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Selected file:', file);
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('subject', '数学');

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Starting upload...');
      const data = await api.uploadImage(formData);
      console.log('Upload completed:', data);
      setResult(data);
      toast.success('图片上传成功！');
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || '上传失败');
      toast.error('图片上传失败');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthStatus = () => {
    const authStorage = localStorage.getItem('auth-storage');
    console.log('Auth storage:', authStorage);
    if (authStorage) {
      try {
        const authData = JSON.parse(authStorage);
        console.log('Auth data:', authData);
        toast.success(`已登录: ${authData.user?.name || '未知用户'}`);
      } catch (e) {
        console.error('Failed to parse auth data:', e);
        toast.error('认证数据解析失败');
      }
    } else {
      toast.error('未登录');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">图片上传测试</h1>
      
      <div className="space-y-4">
        <button
          onClick={checkAuthStatus}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          检查登录状态
        </button>

        <div>
          <label className="block text-sm font-medium mb-2">
            选择图片文件:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {isLoading && (
          <div className="text-blue-600">
            上传中...
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-semibold text-red-800">错误信息:</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800">上传成功:</h3>
            <pre className="text-sm text-green-600 mt-2 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">调试信息:</h3>
        <p className="text-sm text-gray-600">
          请打开浏览器开发者工具(F12)查看控制台输出的详细信息。
        </p>
      </div>
    </div>
  );
};

export default TestImageUpload;