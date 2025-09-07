import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

import { Progress } from '../components/ui/progress';
import { 
  ArrowLeft, 
  BookOpen, 
  Target, 
  Clock, 
  Brain,
  CheckCircle,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

interface SubjectType {
  code: string;
  name: string;
  modules: any[];
  totalUnits: number;
}

interface FormDataType {
  title: string;
  description: string;
  subjects: string[];
  targetLevel: string;
  studyTimePerDay: number;
  totalDuration: number;
  learningStyle: string;
  difficulty: number;
  goals: string[];
  customGoals: string;
  preferences: {
    includeExercises: boolean;
    includeQuizzes: boolean;
    includeProjects: boolean;
    adaptiveLearning: boolean;
  };
  weakAreas: string[];
  strongAreas: string[];
  availableDays: string[];
  preferredTimeSlots: string[];
  includeReview: boolean;
  includePractice: boolean;
  includeAssessment: boolean;
}

const CreateLearningPath = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSubject = searchParams.get('subject');
  
  const [step, setStep] = useState(1);
  const [loading] = useState(false);
  const [subjects, setSubjects] = useState<SubjectType[]>([]);
  const [generatingPath, setGeneratingPath] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const [formData, setFormData] = useState<FormDataType>({
    title: '',
    description: '',
    subjects: preselectedSubject ? [preselectedSubject] : [],
    targetLevel: 'intermediate', // beginner, intermediate, advanced
    studyTimePerDay: 60, // 分钟
    totalDuration: 30, // 天数
    learningStyle: 'balanced', // visual, auditory, kinesthetic, balanced
    difficulty: 2, // 1-4
    goals: [],
    customGoals: '',
    preferences: {
      includeExercises: false,
      includeQuizzes: false,
      includeProjects: false,
      adaptiveLearning: false
    },
    weakAreas: [],
    strongAreas: [],
    availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    preferredTimeSlots: ['morning'], // morning, afternoon, evening
    includeReview: true,
    includePractice: true,
    includeAssessment: true
  })

  const predefinedGoals = [
    { id: 'exam_prep', label: '备考准备', description: '针对重要考试进行系统复习' },
    { id: 'knowledge_consolidation', label: '知识巩固', description: '加强基础知识理解和记忆' },
    { id: 'skill_improvement', label: '技能提升', description: '提高解题技巧和应用能力' },
    { id: 'weak_area_focus', label: '薄弱环节', description: '重点攻克学习难点' },
    { id: 'comprehensive_review', label: '全面复习', description: '系统梳理所有知识点' },
    { id: 'advanced_learning', label: '拓展学习', description: '学习更高难度的内容' }
  ];

  const learningStyles = [
    { value: 'visual', label: '视觉型', description: '通过图表、图像学习效果更好' },
    { value: 'auditory', label: '听觉型', description: '通过讲解、讨论学习效果更好' },
    { value: 'kinesthetic', label: '动手型', description: '通过实践、操作学习效果更好' },
    { value: 'balanced', label: '综合型', description: '多种学习方式结合使用' }
  ];

  const timeSlots = [
    { value: 'morning', label: '上午 (8:00-12:00)', icon: '🌅' },
    { value: 'afternoon', label: '下午 (13:00-17:00)', icon: '☀️' },
    { value: 'evening', label: '晚上 (18:00-22:00)', icon: '🌙' }
  ];

  const weekDays = [
    { value: 'monday', label: '周一' },
    { value: 'tuesday', label: '周二' },
    { value: 'wednesday', label: '周三' },
    { value: 'thursday', label: '周四' },
    { value: 'friday', label: '周五' },
    { value: 'saturday', label: '周六' },
    { value: 'sunday', label: '周日' }
  ];

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/learning-paths/subjects');
      if (response.data.success) {
        setSubjects(response.data.data);
      }
    } catch (error) {
      console.error('获取学科列表失败:', error);
      toast.error('获取学科列表失败');
    }
  };

  const handleInputChange = (field: keyof FormDataType, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayToggle = (field: keyof FormDataType, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter((item: string) => item !== value)
        : [...(prev[field] as string[]), value]
    }));
  };

  const validateStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return formData.title.trim() && formData.subjects.length > 0;
      case 2:
        return formData.goals.length > 0 || formData.customGoals.trim();
      case 3:
        return formData.availableDays.length > 0 && formData.preferredTimeSlots.length > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 4));
    } else {
      toast.error('请完成当前步骤的必填项');
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) {
      toast.error('请完成所有必填项');
      return;
    }

    try {
      setGeneratingPath(true);
      setGenerationProgress(0);

      // 模拟生成进度
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      const response = await api.post('/learning-paths/generate', formData);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (response.data.success) {
        toast.success('学习路径创建成功！');
        setTimeout(() => {
          navigate(`/learning-path/${response.data.data._id}`);
        }, 1000);
      }
    } catch (error: any) {
      console.error('创建学习路径失败:', error);
      toast.error(error.response?.data?.message || '创建失败，请重试');
      setGeneratingPath(false);
      setGenerationProgress(0);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-base font-medium">学习路径名称 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="例如：高中数学全面复习计划"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-base font-medium">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="简要描述您的学习目标和计划..."
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">选择学科 *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {subjects.map((subject) => (
                  <div
                    key={subject.code}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.subjects.includes(subject.code)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleArrayToggle('subjects', subject.code)}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.subjects.includes(subject.code)}
                        onChange={() => handleArrayToggle('subjects', subject.code)}
                      />
                      <div>
                        <p className="font-medium">{subject.name}</p>
                        <p className="text-sm text-gray-600">{subject.totalUnits} 个单元</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base font-medium">目标水平</Label>
                <Select value={formData.targetLevel} onValueChange={(value) => handleInputChange('targetLevel', value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">初学者</SelectItem>
                    <SelectItem value="intermediate">中等水平</SelectItem>
                    <SelectItem value="advanced">高级水平</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium">难度等级</Label>
                <Select value={formData.difficulty.toString()} onValueChange={(value) => handleInputChange('difficulty', parseInt(value))}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - 基础</SelectItem>
                    <SelectItem value="2">2 - 中等</SelectItem>
                    <SelectItem value="3">3 - 较难</SelectItem>
                    <SelectItem value="4">4 - 困难</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-4 block">学习目标 *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {predefinedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.goals.includes(goal.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleArrayToggle('goals', goal.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={formData.goals.includes(goal.id)}
                        onChange={() => handleArrayToggle('goals', goal.id)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">{goal.label}</p>
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="customGoals" className="text-base font-medium">自定义目标</Label>
              <Textarea
                id="customGoals"
                value={formData.customGoals}
                onChange={(e) => handleInputChange('customGoals', e.target.value)}
                placeholder="描述您的特定学习目标..."
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">学习风格</Label>
              <RadioGroup
                value={formData.learningStyle}
                onValueChange={(value) => handleInputChange('learningStyle', value)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {learningStyles.map((style) => (
                  <div key={style.value} className="flex items-start space-x-3 p-4 border rounded-lg">
                    <RadioGroupItem value={style.value} id={style.value} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={style.value} className="font-medium cursor-pointer">
                        {style.label}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{style.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base font-medium">每日学习时间（分钟）</Label>
                <Input
                  type="number"
                  value={formData.studyTimePerDay}
                  onChange={(e) => handleInputChange('studyTimePerDay', parseInt(e.target.value) || 0)}
                  min="15"
                  max="480"
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-base font-medium">计划总时长（天）</Label>
                <Input
                  type="number"
                  value={formData.totalDuration}
                  onChange={(e) => handleInputChange('totalDuration', parseInt(e.target.value) || 0)}
                  min="7"
                  max="365"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">可学习日期 *</Label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {weekDays.map((day) => (
                  <div
                    key={day.value}
                    className={`p-3 text-center border rounded-lg cursor-pointer transition-all ${
                      formData.availableDays.includes(day.value)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleArrayToggle('availableDays', day.value)}
                  >
                    <p className="text-sm font-medium">{day.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">偏好时间段 *</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {timeSlots.map((slot) => (
                  <div
                    key={slot.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.preferredTimeSlots.includes(slot.value)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleArrayToggle('preferredTimeSlots', slot.value)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{slot.icon}</span>
                      <div>
                        <p className="font-medium">{slot.label}</p>
                      </div>
                      <Checkbox
                        checked={formData.preferredTimeSlots.includes(slot.value)}
                        onChange={() => handleArrayToggle('preferredTimeSlots', slot.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-4 block">学习内容设置</Label>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    checked={formData.includeReview}
                    onChange={(checked) => handleInputChange('includeReview', checked)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">包含复习环节</p>
                    <p className="text-sm text-gray-600">定期复习已学内容，巩固记忆</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    checked={formData.includePractice}
                    onChange={(checked) => handleInputChange('includePractice', checked)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">包含练习题</p>
                    <p className="text-sm text-gray-600">通过练习加深理解和应用</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    checked={formData.includeAssessment}
                    onChange={(checked) => handleInputChange('includeAssessment', checked)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">包含阶段测评</p>
                    <p className="text-sm text-gray-600">定期评估学习效果和进度</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 预览信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  学习路径预览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>学科: {formData.subjects.map(s => subjects.find(sub => sub.code === s)?.name).join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span>目标: {formData.goals.length} 个学习目标</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span>时长: {formData.totalDuration} 天，每日 {formData.studyTimePerDay} 分钟</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span>难度: {formData.difficulty}/4</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (generatingPath) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">正在生成学习路径</h2>
              <p className="text-gray-600">AI正在根据您的需求制定个性化学习计划...</p>
            </div>
            
            <div className="mb-4">
              <Progress value={generationProgress} className="h-3" />
              <p className="text-sm text-gray-600 mt-2">{Math.round(generationProgress)}% 完成</p>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>这可能需要几秒钟时间，请耐心等待...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate('/learning-path')} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">创建学习路径</h1>
          <p className="text-gray-600 mt-1">定制您的个性化学习计划</p>
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                step >= stepNumber 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step > stepNumber ? <CheckCircle className="w-5 h-5" /> : stepNumber}
              </div>
              {stepNumber < 4 && (
                <div className={`w-20 h-1 mx-2 ${
                  step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>基本信息</span>
          <span>学习目标</span>
          <span>时间安排</span>
          <span>完成设置</span>
        </div>
      </div>

      {/* 主要内容 */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>
            {step === 1 && '基本信息'}
            {step === 2 && '学习目标'}
            {step === 3 && '时间安排'}
            {step === 4 && '完成设置'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
        
        <div className="flex justify-between p-6 border-t">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={step === 1}
          >
            上一步
          </Button>
          
          {step < 4 ? (
            <Button onClick={nextStep} disabled={!validateStep(step)}>
              下一步
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || !validateStep(step)}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                '创建学习路径'
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CreateLearningPath;