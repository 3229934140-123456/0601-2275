import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Pause,
  AlertTriangle, 
  Activity,
  Clock,
  User,
  FileText,
  FileImage,
  Download,
  RefreshCw,
  Check,
  X,
  Settings,
  Layers,
} from 'lucide-react';
import EChartsChart from '../components/EChartsChart';
import { useTaskStore } from '../store/taskStore';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@shared/types';
import type { TreatmentPlan, ChemoPlan, RadioPlan } from '@shared/types';
import { cn } from '../lib/utils';

const statusSteps = [
  { key: 'pending_verify', label: '待校验' },
  { key: 'model_building', label: '模型构建' },
  { key: 'growth_calculating', label: '生长计算' },
  { key: 'treatment_intervening', label: '治疗干预' },
  { key: 'completed', label: '已完成' },
];

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTask, loading, fetchTask, startTask, advanceTask, reviewAlert, adjustTreatment } = useTaskStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | '3d' | 'alerts' | 'treatment'>('overview');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [treatmentModalOpen, setTreatmentModalOpen] = useState(false);
  const [chemoPlans, setChemoPlans] = useState<ChemoPlan[]>([]);
  const [radioPlans, setRadioPlans] = useState<RadioPlan[]>([]);
  const [adjustReason, setAdjustReason] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationDay, setSimulationDay] = useState(0);
  const simIntervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (id) {
      fetchTask(id);
    }
    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, [id]);
  
  useEffect(() => {
    if (currentTask && currentTask.simulationData) {
      const totalDays = currentTask.simulationData.timeline.length;
      if (currentTask.status === 'completed' || currentTask.status === 'treatment_intervening') {
        setSimulationDay(totalDays - 1);
      }
    }
  }, [currentTask]);
  
  const handleStartSimulation = async () => {
    if (!id) return;
    await startTask(id);
    
    setTimeout(async () => {
      await advanceTask(id, 'model_done');
      startRealtimeSimulation();
    }, 1500);
  };
  
  const startRealtimeSimulation = () => {
    if (!currentTask?.simulationData) return;
    
    setIsSimulating(true);
    let day = 0;
    const totalDays = currentTask.simulationData.timeline.length;
    const treatmentStartDay = Math.floor(totalDays * 0.2);
    
    simIntervalRef.current = window.setInterval(() => {
      day++;
      setSimulationDay(day);
      
      if (day === treatmentStartDay && currentTask.treatmentPlan) {
        advanceTask(id!, 'treatment_start');
      }
      
      if (day >= totalDays - 1) {
        if (simIntervalRef.current) {
          clearInterval(simIntervalRef.current);
        }
        setIsSimulating(false);
        advanceTask(id!, 'complete');
      }
    }, 150);
  };
  
  const toggleSimulation = () => {
    if (isSimulating) {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
      setIsSimulating(false);
    } else {
      startRealtimeSimulation();
    }
  };
  
  const handleReviewAlert = async (result: 'adjust_treatment' | 'continue') => {
    if (!id || !selectedAlert) return;
    await reviewAlert(id, selectedAlert, result, '李医生');
    setShowReviewModal(false);
    setSelectedAlert(null);
    
    if (result === 'adjust_treatment') {
      setTreatmentModalOpen(true);
    }
  };
  
  const handleAdjustTreatment = async () => {
    if (!id) return;
    const plan: TreatmentPlan = {
      chemotherapy: chemoPlans,
      radiotherapy: radioPlans,
      version: (currentTask?.treatmentPlan?.version || 0) + 1,
    };
    await adjustTreatment(id, plan, adjustReason);
    setTreatmentModalOpen(false);
    startRealtimeSimulation();
  };
  
  const addChemoPlan = () => {
    setChemoPlans([...chemoPlans, { drug: '紫杉醇', dose: 175, unit: 'mg/m²', frequency: '每3周', cycles: 6 }]);
  };
  
  const addRadioPlan = () => {
    setRadioPlans([...radioPlans, { dose: 60, fractions: 30, frequency: '每日', targetVolume: 'GTV+CTV' }]);
  };
  
  if (loading && !currentTask) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!currentTask) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">任务不存在</p>
      </div>
    );
  }
  
  const currentStepIndex = statusSteps.findIndex(s => s.key === currentTask.status);
  const simData = currentTask.simulationData;
  
  const volumeChartOption = simData ? {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: simData.timeline.slice(0, simulationDay + 1),
      name: '天数',
    },
    yAxis: {
      type: 'value',
      name: '体积 (cm³)',
    },
    series: [{
      data: simData.volumes.slice(0, simulationDay + 1),
      type: 'line',
      smooth: true,
      lineStyle: { color: '#0B3D91', width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(11, 61, 145, 0.3)' },
            { offset: 1, color: 'rgba(11, 61, 145, 0.02)' },
          ],
        },
      },
      itemStyle: { color: '#0B3D91' },
    }],
  } : {};
  
  const necrosisChartOption = simData ? {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: simData.timeline.slice(0, simulationDay + 1),
      name: '天数',
    },
    yAxis: {
      type: 'value',
      name: '坏死比例',
      axisLabel: { formatter: '{value}%' },
    },
    series: [{
      data: simData.necrosisRatios.slice(0, simulationDay + 1).map(v => (v * 100).toFixed(1)),
      type: 'line',
      smooth: true,
      lineStyle: { color: '#FF9500', width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(255, 149, 0, 0.3)' },
            { offset: 1, color: 'rgba(255, 149, 0, 0.02)' },
          ],
        },
      },
      itemStyle: { color: '#FF9500' },
      markLine: {
        data: [{ yAxis: 30, label: { formatter: '预警阈值30%' }, lineStyle: { color: '#FF3B30', type: 'dashed' } }],
      },
    }],
  } : {};
  
  const heatmapData = simData?.cellDensityMaps?.[Math.min(
    Math.floor(simulationDay / Math.max(1, Math.floor(currentTask.simulationDays / 8))),
    (simData.cellDensityMaps?.length || 1) - 1
  )];
  
  const heatmapOption = heatmapData ? {
    tooltip: {
      position: 'top',
      formatter: (params: any) => `细胞密度: ${(params.value[2] * 100).toFixed(1)}%`,
    },
    grid: { left: '10%', right: '10%', top: '5%', bottom: '15%' },
    xAxis: { type: 'category', data: heatmapData.data[0]?.map((_, i) => i) || [], show: false },
    yAxis: { type: 'category', data: heatmapData.data.map((_, i) => i), show: false },
    visualMap: {
      min: 0,
      max: 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#e0f7fa', '#00acc1', '#006064', '#b71c1c'],
      },
    },
    series: [{
      name: '细胞密度',
      type: 'heatmap',
      data: heatmapData.data.flatMap((row, i) => 
        row.map((val, j) => [j, i, val])
      ),
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
    }],
  } : {};
  
  const statusColor = TASK_STATUS_COLORS[currentTask.status];
  const unreviewedAlerts = currentTask.alerts.filter(a => !a.reviewed);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">{currentTask.patient.name}</h2>
              <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium border",
                statusColor
              )}>
                {TASK_STATUS_LABELS[currentTask.status]}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {currentTask.id} · {currentTask.patient.cancerType} · {currentTask.patient.stage}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {currentTask.status === 'pending_verify' && (
            <button
              onClick={handleStartSimulation}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-light text-white rounded-lg transition-all font-medium text-sm shadow-md hover:shadow-lg"
            >
              <Play className="w-4 h-4" />
              启动模拟
            </button>
          )}
          
          {(currentTask.status === 'growth_calculating' || currentTask.status === 'treatment_intervening') && (
            <button
              onClick={toggleSimulation}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium text-sm shadow-md",
                isSimulating 
                  ? "bg-warning hover:bg-warning/90 text-white" 
                  : "bg-success hover:bg-success/90 text-white"
              )}
            >
              {isSimulating ? (
                <><Pause className="w-4 h-4" />暂停模拟</>
              ) : (
                <><Play className="w-4 h-4" />继续模拟</>
              )}
            </button>
          )}
          
          {currentTask.status === 'completed' && (
            <>
              <button
                onClick={() => navigate(`/reports/${id}`)}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-all font-medium text-sm"
              >
                <FileText className="w-4 h-4" />
                查看报告
              </button>
              <button
                onClick={() => navigate('/recommendations')}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-light text-white rounded-lg transition-all font-medium text-sm shadow-md hover:shadow-lg"
              >
                <Settings className="w-4 h-4" />
                方案推荐
              </button>
            </>
          )}
          
          {unreviewedAlerts.length > 0 && (
            <div className="relative">
              <AlertTriangle className="w-5 h-5 text-danger animate-pulse" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center font-medium">
                {unreviewedAlerts.length}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">任务状态流转</h3>
          <span className="text-sm text-slate-500">
            当前第 {currentStepIndex + 1} 步 / 共 5 步
          </span>
        </div>
        <div className="flex items-center">
          {statusSteps.map((step, index) => (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  index < currentStepIndex 
                    ? "bg-success text-white" 
                    : index === currentStepIndex 
                      ? "bg-primary text-white ring-4 ring-primary/20 shadow-lg" 
                      : "bg-slate-100 text-slate-400"
                )}>
                  {index < currentStepIndex ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span className={cn(
                  "mt-2 text-xs font-medium",
                  index <= currentStepIndex ? "text-slate-700" : "text-slate-400"
                )}>
                  {step.label}
                </span>
              </div>
              {index < statusSteps.length - 1 && (
                <div className={cn(
                  "flex-1 h-1 mx-3 rounded-full transition-all duration-500",
                  index < currentStepIndex ? "bg-success" : "bg-slate-100"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-card p-5">
        <h3 className="font-semibold text-slate-800 mb-4">病理影像信息</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center">
            <FileImage className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-800">
              {currentTask.imageName || '未上传病理影像'}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              {currentTask.imageName ? '用于模型构建已关联此影像数据' : '上传病理影像后将自动关联'}
            </p>
          </div>
          {currentTask.imageName && (
            <span className="px-3 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
              已绑定
            </span>
          )}
        </div>
      </div>
      
      {simData && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-card p-5">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
              <Activity className="w-4 h-4" />
              当前体积
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {simData.volumes[simulationDay]?.toFixed(2) || '-'}
              <span className="text-sm font-normal text-slate-400 ml-1">cm³</span>
            </p>
            <p className="text-xs text-success mt-1">
              较初始 {simData.volumes[0] ? ((simData.volumes[simulationDay] - simData.volumes[0]) / simData.volumes[0] * 100).toFixed(1) : 0}%
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-card p-5">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
              <AlertTriangle className="w-4 h-4" />
              坏死核心比例
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {(simData.necrosisRatios[simulationDay] * 100).toFixed(1)}
              <span className="text-sm font-normal text-slate-400 ml-1">%</span>
            </p>
            <p className="text-xs text-warning mt-1">基线阈值: 30%</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-card p-5">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
              <Clock className="w-4 h-4" />
              模拟进度
            </div>
            <p className="text-2xl font-bold text-slate-800">
              第 {simulationDay} 天
              <span className="text-sm font-normal text-slate-400 ml-1">/ {currentTask.simulationDays}天</span>
            </p>
            <p className="text-xs text-primary mt-1">
              {((simulationDay / currentTask.simulationDays) * 100).toFixed(0)}% 完成
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-card p-5">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
              <Layers className="w-4 h-4" />
              日增长率
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {simData.growthRates[simulationDay]?.toFixed(2) || '-'}
              <span className="text-sm font-normal text-slate-400 ml-1">%</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              基线: {currentTask.baselineGrowthRate.toFixed(2)}%
            </p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="border-b border-slate-100 px-4">
          <div className="flex gap-1">
            {[
              { key: 'overview', label: '总览' },
              { key: 'charts', label: '生长曲线' },
              { key: '3d', label: '三维形态' },
              { key: 'alerts', label: `预警 (${unreviewedAlerts.length})` },
              { key: 'treatment', label: '治疗方案' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  "px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px",
                  activeTab === tab.key
                    ? "text-primary border-primary"
                    : "text-slate-500 border-transparent hover:text-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-5">
          {activeTab === 'overview' && simData && (
            <div className="grid grid-cols-2 gap-5 animate-fade-in">
              <div>
                <h4 className="font-medium text-slate-800 mb-3">肿瘤体积变化</h4>
                <EChartsChart option={volumeChartOption} style={{ height: '300px' }} />
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-3">坏死核心比例</h4>
                <EChartsChart option={necrosisChartOption} style={{ height: '300px' }} />
              </div>
              
              <div className="col-span-2">
                <h4 className="font-medium text-slate-800 mb-3">
                  细胞密度热图 (第 {simulationDay} 天)
                </h4>
                <EChartsChart option={heatmapOption} style={{ height: '350px' }} />
              </div>
            </div>
          )}
          
          {activeTab === 'charts' && simData && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-medium text-slate-800 mb-3">肿瘤体积变化曲线</h4>
                <EChartsChart option={volumeChartOption} style={{ height: '350px' }} />
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-3">坏死核心比例变化</h4>
                <EChartsChart option={necrosisChartOption} style={{ height: '350px' }} />
              </div>
            </div>
          )}
          
          {activeTab === '3d' && (
            <div className="animate-fade-in">
              <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div 
                    className="w-64 h-64 rounded-full bg-gradient-to-br from-red-400 via-orange-400 to-yellow-400 opacity-80 blur-sm animate-pulse-slow"
                    style={{ 
                      transform: `scale(${0.5 + (simData?.volumes[simulationDay] || 12) / 50})`,
                      boxShadow: '0 0 60px rgba(255, 100, 50, 0.5)'
                    }}
                  />
                  <div 
                    className="absolute w-24 h-24 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 opacity-90"
                    style={{ 
                      transform: `scale(${0.3 + (simData?.necrosisRatios[simulationDay] || 0.05) * 2})`,
                    }}
                  />
                </div>
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-sm">
                  <p className="text-slate-500 text-xs">当前切片</p>
                  <p className="font-semibold text-slate-800">第 {simulationDay} 天 · 横截面</p>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors">
                    <RefreshCw className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-red-500" />
                    <span className="text-slate-600">高增殖区</span>
                    <div className="w-3 h-3 rounded-full bg-slate-600 ml-3" />
                    <span className="text-slate-600">坏死核心</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-slate-500 mt-4">
                三维体积渲染预览 · 可旋转查看不同角度 · 支持切片分析
              </p>
            </div>
          )}
          
          {activeTab === 'alerts' && (
            <div className="space-y-3 animate-fade-in">
              {currentTask.alerts.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">暂无预警记录</p>
                </div>
              ) : (
                currentTask.alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all",
                      alert.level === 'danger' 
                        ? "border-danger/20 bg-danger/5" 
                        : "border-warning/20 bg-warning/5"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={cn(
                          "w-5 h-5 flex-shrink-0 mt-0.5",
                          alert.level === 'danger' ? "text-danger" : "text-warning"
                        )} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-800">
                              {alert.type === 'volume_spike' ? '体积增长异常' : '坏死比例加剧'}
                            </h4>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium",
                              alert.level === 'danger' 
                                ? "bg-danger/20 text-danger" 
                                : "bg-warning/20 text-warning"
                            )}>
                              {alert.level === 'danger' ? '高危' : '预警'}
                            </span>
                            {alert.reviewed && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-success/20 text-success">
                                已复核
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                          <p className="text-xs text-slate-400 mt-2">
                            {new Date(alert.createdAt).toLocaleString('zh-CN')}
                            {alert.reviewer && ` · 复核人: ${alert.reviewer}`}
                          </p>
                          {alert.reviewResult && (
                            <p className="text-xs text-slate-500 mt-1">
                              复核结果: {alert.reviewResult === 'adjust_treatment' ? '调整治疗方案' : '继续观察'}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {!alert.reviewed && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedAlert(alert.id);
                              setShowReviewModal(true);
                            }}
                            className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
                          >
                            复核
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {activeTab === 'treatment' && (
            <div className="space-y-5 animate-fade-in">
              {currentTask.treatmentPlan ? (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-800">
                      当前治疗方案 (v{currentTask.treatmentPlan.version})
                    </h4>
                    <button
                      onClick={() => {
                        setChemoPlans(currentTask.treatmentPlan!.chemotherapy);
                        setRadioPlans(currentTask.treatmentPlan!.radiotherapy);
                        setTreatmentModalOpen(true);
                      }}
                      className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                    >
                      <Settings className="w-4 h-4" />
                      调整方案
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h5 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        化疗方案
                      </h5>
                      {currentTask.treatmentPlan.chemotherapy.length === 0 ? (
                        <p className="text-sm text-slate-400">暂无化疗方案</p>
                      ) : (
                        <div className="space-y-3">
                          {currentTask.treatmentPlan.chemotherapy.map((chemo, i) => (
                            <div key={i} className="bg-white rounded-lg p-3 text-sm">
                              <p className="font-medium text-slate-800">{chemo.drug}</p>
                              <p className="text-slate-500 text-xs mt-1">
                                {chemo.dose} {chemo.unit} · {chemo.frequency} · {chemo.cycles}周期
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h5 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-warning" />
                        放疗方案
                      </h5>
                      {currentTask.treatmentPlan.radiotherapy.length === 0 ? (
                        <p className="text-sm text-slate-400">暂无放疗方案</p>
                      ) : (
                        <div className="space-y-3">
                          {currentTask.treatmentPlan.radiotherapy.map((radio, i) => (
                            <div key={i} className="bg-white rounded-lg p-3 text-sm">
                              <p className="font-medium text-slate-800">
                                {radio.dose}Gy · {radio.fractions}次分割
                              </p>
                              <p className="text-slate-500 text-xs mt-1">
                                {radio.frequency} · 靶区: {radio.targetVolume}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {currentTask.treatmentPlan.adjustmentReason && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">调整原因：</span>
                        {currentTask.treatmentPlan.adjustmentReason}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-4">暂无治疗方案</p>
                  <button
                    onClick={() => setTreatmentModalOpen(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
                  >
                    添加治疗方案
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4 animate-slide-up">
            <h3 className="text-lg font-bold text-slate-800 mb-4">预警复核</h3>
            <p className="text-sm text-slate-600 mb-6">
              请确认是否需要调整治疗方案。选择"调整治疗"将进入方案编辑界面并重新进行模拟计算。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleReviewAlert('continue')}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                继续观察
              </button>
              <button
                onClick={() => handleReviewAlert('adjust_treatment')}
                className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                调整治疗
              </button>
            </div>
          </div>
        </div>
      )}
      
      {treatmentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 m-4 max-h-[80vh] overflow-y-auto animate-slide-up">
            <h3 className="text-lg font-bold text-slate-800 mb-5">调整治疗方案</h3>
            
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-700 text-sm">化疗方案</h4>
                  <button
                    onClick={addChemoPlan}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    + 添加
                  </button>
                </div>
                {chemoPlans.length === 0 ? (
                  <p className="text-sm text-slate-400 bg-slate-50 rounded-lg p-3">暂无化疗药物</p>
                ) : (
                  <div className="space-y-2">
                    {chemoPlans.map((plan, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{plan.drug}</span>
                          <button
                            onClick={() => setChemoPlans(chemoPlans.filter((_, idx) => idx !== i))}
                            className="text-danger text-xs"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-700 text-sm">放疗方案</h4>
                  <button
                    onClick={addRadioPlan}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    + 添加
                  </button>
                </div>
                {radioPlans.length === 0 ? (
                  <p className="text-sm text-slate-400 bg-slate-50 rounded-lg p-3">暂无放疗方案</p>
                ) : (
                  <div className="space-y-2">
                    {radioPlans.map((plan, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{plan.dose}Gy / {plan.fractions}次</span>
                          <button
                            onClick={() => setRadioPlans(radioPlans.filter((_, idx) => idx !== i))}
                            className="text-danger text-xs"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  调整原因
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="请说明调整治疗方案的原因..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setTreatmentModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAdjustTreatment}
                className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                确认并重模拟
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
