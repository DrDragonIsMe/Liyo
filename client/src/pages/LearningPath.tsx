import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useSubjectStore } from '../store/subjectStore';
import { 
  BookOpen, 
  Target, 
  Clock, 
  TrendingUp, 
  Plus,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Calendar,

} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

interface LearningPathType {
  id: string;
  _id: string;
  title: string;
  subject: string;
  subjects?: string[];
  description: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  totalUnits: number;
  completedUnits: number;
  estimatedTime: string;
  estimatedTotalTime?: number;
  completedSteps?: number;
  totalSteps?: number;
  difficulty: string;
  createdAt: string;
}

interface SubjectType {
  code: string;
  name: string;
  modules: any[];
  totalUnits: number;
}

interface StatsType {
  totalPaths: number;
  activePaths: number;
  completedPaths: number;
  totalProgress: number;
}

const LearningPath = () => {
  const navigate = useNavigate();
  const { currentSubject } = useSubjectStore();
  const [learningPaths, setLearningPaths] = useState<LearningPathType[]>([]);
  const [subjects, setSubjects] = useState<SubjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-paths');
  const [stats, setStats] = useState<StatsType>({
    totalPaths: 0,
    activePaths: 0,
    completedPaths: 0,
    totalProgress: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  // 当学科变化时重新计算统计信息
  useEffect(() => {
    if (learningPaths.length > 0) {
      calculateStats(learningPaths);
    }
  }, [currentSubject, learningPaths]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pathsRes, subjectsRes] = await Promise.all([
        api.get('/learning-paths/my-paths'),
        api.get('/learning-paths/subjects')
      ]);

      if (pathsRes.data.success) {
        setLearningPaths(pathsRes.data.data.learningPaths);
        calculateStats(pathsRes.data.data.learningPaths);
      }

      if (subjectsRes.data.success) {
        setSubjects(subjectsRes.data.data);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      toast.error('获取学习路径数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 根据当前学科过滤学习路径
  const filteredLearningPaths = currentSubject 
    ? learningPaths.filter(path => 
        path.subject === currentSubject.id || 
        (path.subjects && path.subjects.includes(currentSubject.id))
      )
    : learningPaths;

  const calculateStats = (paths: LearningPathType[]) => {
    const pathsToCalculate = currentSubject ? filteredLearningPaths : paths;
    const stats = {
      totalPaths: pathsToCalculate.length,
      activePaths: pathsToCalculate.filter((p: LearningPathType) => p.status === 'active').length,
      completedPaths: pathsToCalculate.filter((p: LearningPathType) => p.status === 'completed').length,
      totalProgress: pathsToCalculate.length > 0 ? 
        Math.round(pathsToCalculate.reduce((sum: number, p: LearningPathType) => sum + (p.progress || 0), 0) / pathsToCalculate.length) : 0
    };
    setStats(stats);
  };

  const handleCreatePath = () => {
    const url = currentSubject 
      ? `/learning-path/create?subject=${currentSubject.id}`
      : '/learning-path/create';
    navigate(url);
  };

  const handleViewPath = (pathId: string) => {
    navigate(`/learning-path/${pathId}`);
  };

  const handleTogglePathStatus = async (pathId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const response = await api.put(`/learning-paths/${pathId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        toast.success(`学习路径已${newStatus === 'active' ? '恢复' : '暂停'}`);
        fetchData();
      }
    } catch (error) {
      console.error('更新状态失败:', error);
      toast.error('操作失败，请重试');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {currentSubject ? `${currentSubject.name} 学习路径` : '学习路径'}
          </h1>
          <p className="text-gray-600 mt-2">
            {currentSubject 
              ? `专为${currentSubject.name}学科设计的个性化学习计划` 
              : '个性化学习计划，助您高效掌握知识'
            }
          </p>
        </div>
        <Button onClick={handleCreatePath} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          创建学习路径
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总路径数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPaths}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">进行中</p>
                <p className="text-2xl font-bold text-green-600">{stats.activePaths}</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已完成</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completedPaths}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均进度</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalProgress}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-paths">我的学习路径</TabsTrigger>
          <TabsTrigger value="subjects">学科浏览</TabsTrigger>
        </TabsList>

        <TabsContent value="my-paths" className="mt-6">
          {filteredLearningPaths.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {currentSubject ? `还没有${currentSubject.name}学习路径` : '还没有学习路径'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {currentSubject 
                    ? `创建您的第一个${currentSubject.name}学习路径，开始专业学习之旅`
                    : '创建您的第一个个性化学习路径，开始高效学习之旅'
                  }
                </p>
                <Button onClick={handleCreatePath} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  创建学习路径
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredLearningPaths.map((path) => (
                <Card key={path._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{path.title}</CardTitle>
                        <p className="text-sm text-gray-600 line-clamp-2">{path.description}</p>
                      </div>
                      <Badge className={`ml-2 ${getStatusColor(path.status)}`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(path.status)}
                          {path.status === 'active' ? '进行中' : 
                           path.status === 'paused' ? '已暂停' : 
                           path.status === 'completed' ? '已完成' : '未知'}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* 进度条 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">学习进度</span>
                        <span className="text-sm text-gray-600">{path.progress}%</span>
                      </div>
                      <Progress value={path.progress} className="h-2" />
                    </div>

                    {/* 学科标签 */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {path.subjects?.map((subject: string) => (
                        <Badge key={subject} variant="outline" className="text-xs">
                          {subjects.find(s => s.code === subject)?.name || subject}
                        </Badge>
                      ))}
                    </div>

                    {/* 统计信息 */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span>{path.completedSteps}/{path.totalSteps} 步骤</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(path.estimatedTotalTime || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>创建于 {formatDate(path.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        <span>{path.difficulty}/4 难度</span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleViewPath(path._id)}
                        className="flex-1"
                      >
                        查看详情
                      </Button>
                      {path.status !== 'completed' && (
                        <Button
                          variant="outline"
                          onClick={() => handleTogglePathStatus(path._id, path.status)}
                          className="flex items-center gap-2"
                        >
                          {path.status === 'active' ? (
                            <><Pause className="w-4 h-4" /> 暂停</>
                          ) : (
                            <><Play className="w-4 h-4" /> 继续</>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subjects" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <Card key={subject.code} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/learning-path/create?subject=${subject.code}`)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{subject.name}</h3>
                      <p className="text-sm text-gray-600">{subject.code}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">模块数量</span>
                      <span className="font-medium">{subject.modules.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">知识单元</span>
                      <span className="font-medium">{subject.totalUnits}</span>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      创建学习路径
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearningPath;