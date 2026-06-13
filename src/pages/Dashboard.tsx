import { useEffect } from 'react';
import EChartsChart from '../components/EChartsChart';
import { 
  BarChart3, 
  Activity, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckSquare,
  Target,
  Zap,
} from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { dashboardStats, fetchDashboardStats, loading } = useTaskStore();
  
  useEffect(() => {
    fetchDashboardStats();
  }, []);
  
  const stats = dashboardStats;
  
  const trendChartOption = stats ? {
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增任务', '完成任务'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: stats.dailyTrend.map(d => d.date) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '新增任务',
        type: 'line',
        smooth: true,
        data: stats.dailyTrend.map(d => d.created),
        lineStyle: { color: '#0B3D91', width: 2 },
        itemStyle: { color: '#0B3D91' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(11, 61, 145, 0.3)' },
              { offset: 1, color: 'rgba(11, 61, 145, 0.02)' },
            ],
          },
        },
      },
      {
        name: '完成任务',
        type: 'line',
        smooth: true,
        data: stats.dailyTrend.map(d => d.completed),
        lineStyle: { color: '#34C759', width: 2 },
        itemStyle: { color: '#34C759' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(52, 199, 89, 0.3)' },
              { offset: 1, color: 'rgba(52, 199, 89, 0.02)' },
            ],
          },
        },
      },
    ],
  } : {};
  
  const cancerTypeChartOption = stats ? {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: '14', fontWeight: 'bold' },
      },
      data: stats.cancerTypeDistribution.map(d => ({ value: d.count, name: d.type })),
    }],
  } : {};
  
  const stageChartOption = stats ? {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: stats.stageDistribution.map(d => d.stage) },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: stats.stageDistribution.map(d => d.count),
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#00B4D8' },
            { offset: 1, color: '#0B3D91' },
          ],
        },
        borderRadius: [6, 6, 0, 0],
      },
      barWidth: '50%',
    }],
  } : {};
  
  const statCards = [
    { 
      label: '总任务数', 
      value: stats?.totalTasks || 0, 
      icon: Activity, 
      color: 'from-primary/10 to-primary/5',
      iconColor: 'text-primary',
    },
    { 
      label: '完成率', 
      value: `${((stats?.completionRate || 0) * 100).toFixed(1)}%`, 
      icon: Target, 
      color: 'from-success/10 to-success/5',
      iconColor: 'text-success',
    },
    { 
      label: '平均响应时间', 
      value: `${stats?.avgResponseTime?.toFixed(1) || 0}h`, 
      icon: Clock, 
      color: 'from-accent/10 to-accent/5',
      iconColor: 'text-accent',
    },
    { 
      label: '方案收敛次数', 
      value: stats?.convergenceCount || 0, 
      icon: TrendingUp, 
      color: 'from-purple-500/10 to-purple-500/5',
      iconColor: 'text-purple-500',
    },
    { 
      label: '进行中模拟', 
      value: stats?.activeSimulations || 0, 
      icon: Zap, 
      color: 'from-warning/10 to-warning/5',
      iconColor: 'text-warning',
    },
    { 
      label: '今日预警', 
      value: stats?.alertsToday || 0, 
      icon: AlertTriangle, 
      color: 'from-danger/10 to-danger/5',
      iconColor: 'text-danger',
    },
    { 
      label: '待审批', 
      value: stats?.approvalsPending || 0, 
      icon: CheckSquare, 
      color: 'from-amber-500/10 to-amber-500/5',
      iconColor: 'text-amber-500',
    },
    { 
      label: '完成任务', 
      value: stats?.completedTasks || 0, 
      icon: BarChart3, 
      color: 'from-emerald-500/10 to-emerald-500/5',
      iconColor: 'text-emerald-500',
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">性能看板</h2>
          <p className="text-sm text-slate-500 mt-1">
            系统运行数据统计与趋势分析
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span>数据更新于 {new Date().toLocaleTimeString('zh-CN')}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i} 
              className={cn(
                "bg-white rounded-xl shadow-card p-5 hover:shadow-card-hover transition-all"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                </div>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
                  card.color
                )}>
                  <Icon className={cn("w-5 h-5", card.iconColor)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-card p-5">
          <h3 className="font-semibold text-slate-800 mb-4">近7日趋势</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <EChartsChart option={trendChartOption} style={{ height: '280px' }} />
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-card p-5">
          <h3 className="font-semibold text-slate-800 mb-4">癌症类型分布</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <EChartsChart option={cancerTypeChartOption} style={{ height: '280px' }} />
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-card p-5">
          <h3 className="font-semibold text-slate-800 mb-4">分期分布</h3>
          {loading ? (
            <div className="h-56 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <EChartsChart option={stageChartOption} style={{ height: '240px' }} />
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-card p-5">
          <h3 className="font-semibold text-slate-800 mb-4">系统状态</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">模拟引擎</span>
              <span className="flex items-center gap-2 text-sm text-success font-medium">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                运行正常
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">数据服务</span>
              <span className="flex items-center gap-2 text-sm text-success font-medium">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                运行正常
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">临床系统对接</span>
              <span className="flex items-center gap-2 text-sm text-success font-medium">
                <span className="w-2 h-2 rounded-full bg-success" />
                已连接
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">推荐模型版本</span>
              <span className="text-sm text-primary font-medium">v2.3.1</span>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-primary/5 border border-primary/10 rounded-lg">
            <p className="text-sm text-primary font-medium mb-1">系统提示</p>
            <p className="text-xs text-primary/70">
              本周期方案收敛率提升12%，建议关注肺腺癌III期病例的模拟参数优化。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
