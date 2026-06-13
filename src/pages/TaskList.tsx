import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Activity,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@shared/types';
import type { SimulationTask, TaskStatus } from '@shared/types';
import { cn } from '../lib/utils';

const statusFilters: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending_verify', label: '待校验' },
  { value: 'model_building', label: '模型构建中' },
  { value: 'growth_calculating', label: '生长计算中' },
  { value: 'treatment_intervening', label: '治疗干预中' },
  { value: 'completed', label: '已完成' },
  { value: 'error_fallback', label: '异常' },
];

function TaskCard({ task }: { task: SimulationTask }) {
  const navigate = useNavigate();
  
  const statusColor = TASK_STATUS_COLORS[task.status];
  const progress = getProgress(task.status, task.simulationDays, task.currentVolume);
  
  return (
    <div 
      className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer overflow-hidden group"
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-800">{task.patient.name}</h3>
              <span className="text-xs text-slate-400">{task.id}</span>
            </div>
            <p className="text-sm text-slate-500">
              {task.patient.cancerType} · {task.patient.stage}
            </p>
          </div>
          <span className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium border",
            statusColor
          )}>
            {TASK_STATUS_LABELS[task.status]}
          </span>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">模拟进度</span>
            <span className="text-xs font-medium text-slate-700">{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-slate-500">肿瘤体积</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {task.currentVolume.toFixed(2)} <span className="text-xs font-normal text-slate-400">cm³</span>
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-warning" />
              <span className="text-xs text-slate-500">坏死比例</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {(task.necrosisRatio * 100).toFixed(1)} <span className="text-xs font-normal text-slate-400">%</span>
            </p>
          </div>
        </div>
        
        {task.alerts.filter(a => !a.reviewed).length > 0 && (
          <div className="bg-danger/5 border border-danger/20 rounded-lg p-2.5 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0" />
              <span className="text-sm text-danger font-medium">
                {task.alerts.filter(a => !a.reviewed).length} 条预警待复核
              </span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {new Date(task.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
          <div className="flex items-center gap-1 text-primary font-medium text-sm group-hover:gap-2 transition-all">
            查看详情
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function getProgress(status: TaskStatus, days: number, volume: number): number {
  switch (status) {
    case 'pending_verify': return 5;
    case 'model_building': return 25;
    case 'growth_calculating': return 50;
    case 'treatment_intervening': return 75;
    case 'completed': return 100;
    case 'error_fallback': return 30;
    default: return 0;
  }
}

export default function TaskList() {
  const navigate = useNavigate();
  const { tasks, loading, fetchTasks } = useTaskStore();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    fetchTasks({ 
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchQuery || undefined,
    });
  }, [statusFilter, searchQuery]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">模拟任务列表</h2>
          <p className="text-sm text-slate-500 mt-1">
            共 {tasks.length} 个任务 · {tasks.filter(t => t.status !== 'completed' && t.status !== 'error_fallback').length} 个进行中
          </p>
        </div>
        <button
          onClick={() => navigate('/tasks/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-light text-white rounded-lg transition-colors font-medium text-sm shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          新建任务
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索患者姓名、任务ID或癌症类型..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex flex-wrap gap-1.5">
              {statusFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    statusFilter === f.value
                      ? "bg-primary text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-card p-5 animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-2">
                  <div className="h-5 w-24 bg-slate-200 rounded" />
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                </div>
                <div className="h-6 w-16 bg-slate-200 rounded-full" />
              </div>
              <div className="h-24 bg-slate-100 rounded-lg mb-3" />
              <div className="h-8 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">暂无任务</p>
          <button
            onClick={() => navigate('/tasks/new')}
            className="mt-4 text-primary font-medium text-sm hover:underline"
          >
            创建第一个模拟任务
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
