import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { questionBankApi } from '../../services/questionBankApi';

interface QuestionStatsProps {
  subject: string;
}

interface StatsData {
  total: number;
  byType: Array<{ type: string; count: number }>;
  byDifficulty: Array<{ difficulty: string; count: number }>;
  recentActivity: Array<{ date: string; count: number }>;
}

const QuestionStats: React.FC<QuestionStatsProps> = ({ subject }) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await questionBankApi.getStats(subject);
        setStats(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || '加载统计数据失败');
      } finally {
        setLoading(false);
      }
    };

    if (subject) {
      loadStats();
    }
  }, [subject]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const recentCount = stats?.recentActivity?.reduce((sum, item) => sum + item.count, 0) || 0;
  
  const statCards = [
    {
      title: '题目总数',
      value: stats?.total || 0,
      icon: DocumentTextIcon,
      color: 'text-blue-600 bg-blue-50',
      description: '当前学科题目总量'
    },
    {
      title: '最近新增',
      value: recentCount,
      icon: ClockIcon,
      color: 'text-green-600 bg-green-50',
      description: '近7天新增题目'
    },
    {
      title: '题型种类',
      value: stats?.byType?.length || 0,
      icon: ChartBarIcon,
      color: 'text-purple-600 bg-purple-50',
      description: '包含的题型数量'
    },
    {
      title: '难度层次',
      value: stats?.byDifficulty?.length || 0,
      icon: CheckCircleIcon,
      color: 'text-orange-600 bg-orange-50',
      description: '涵盖的难度等级'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "p-3 rounded-lg",
                  card.color
                )}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  {card.title}
                </p>
                <p className="text-xs text-gray-500">
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 详细统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 题型分布 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">题型分布</h3>
          <div className="space-y-3">
            {(stats?.byType || []).map((item) => {
              const percentage = stats?.total && stats.total > 0 ? (item.count / stats.total * 100).toFixed(1) : '0';
              return (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-gray-700">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              );
            })}
            {(!stats?.byType || stats.byType.length === 0) && (
              <div className="text-center py-4 text-gray-500 text-sm">
                暂无数据
              </div>
            )}
          </div>
        </div>

        {/* 难度分布 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">难度分布</h3>
          <div className="space-y-3">
            {(stats?.byDifficulty || []).map((item) => {
              const percentage = stats?.total && stats.total > 0 ? (item.count / stats.total * 100).toFixed(1) : '0';
              const getDifficultyColor = (diff: string) => {
                switch (diff) {
                  case '简单': return 'bg-green-500';
                  case '中等': return 'bg-yellow-500';
                  case '困难': return 'bg-red-500';
                  default: return 'bg-gray-500';
                }
              };
              
              return (
                <div key={item.difficulty} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      getDifficultyColor(item.difficulty)
                    )}></div>
                    <span className="text-sm font-medium text-gray-700">{item.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          getDifficultyColor(item.difficulty)
                        )}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              );
            })}
            {(!stats?.byDifficulty || stats.byDifficulty.length === 0) && (
              <div className="text-center py-4 text-gray-500 text-sm">
                暂无数据
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionStats;