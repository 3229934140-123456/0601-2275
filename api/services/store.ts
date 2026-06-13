import type { SimulationTask, Alert, Approval, DrugRecommendation, CellParams, Patient, TreatmentPlan } from '../../shared/types';
import { runSimulation } from './simulationEngine.js';

let tasks: SimulationTask[] = [];
let approvals: Approval[] = [];
let recommendationCache: Map<string, DrugRecommendation[]> = new Map();

function genId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function createMockPatient(id: string, name: string, cancerType: string, stage: string): Patient {
  return {
    id,
    name,
    age: 45 + Math.floor(Math.random() * 30),
    gender: Math.random() > 0.5 ? 'male' : 'female',
    cancerType,
    stage,
  };
}

function createMockCellParams(): CellParams {
  return {
    proliferationRate: 0.4 + Math.random() * 0.4,
    apoptosisRate: 0.1 + Math.random() * 0.2,
    migrationRate: 0.2 + Math.random() * 0.3,
    nutrientThreshold: 0.3 + Math.random() * 0.3,
    oxygenThreshold: 0.25 + Math.random() * 0.25,
  };
}

function createMockTask(id: string, status: SimulationTask['status'], patient: Patient, days: number): SimulationTask {
  const cellParams = createMockCellParams();
  const initialVolume = 10 + Math.random() * 15;
  
  const task: SimulationTask = {
    id,
    patient,
    status,
    createdAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
    cellParams,
    imageName: 'pathology_sample_' + id + '.dcm',
    currentVolume: initialVolume,
    necrosisRatio: 0.05 + Math.random() * 0.1,
    baselineGrowthRate: 0.8 + Math.random() * 1.2,
    alerts: [],
    simulationDays: days,
    deviationCount: 0,
    paused: false,
  };
  
  if (status === 'completed' || status === 'growth_calculating' || status === 'treatment_intervening') {
    const hasTreatment = status !== 'growth_calculating' || Math.random() > 0.3;
    const treatmentPlan: TreatmentPlan = hasTreatment ? {
      chemotherapy: [
        { drug: '紫杉醇', dose: 175, unit: 'mg/m²', frequency: '每3周', cycles: 6 },
      ],
      radiotherapy: [
        { dose: 60, fractions: 30, frequency: '每日', targetVolume: 'GTV+CTV' },
      ],
      version: 1,
    } : { chemotherapy: [], radiotherapy: [], version: 0 };
    
    task.treatmentPlan = treatmentPlan;
    task.simulationData = runSimulation(cellParams, initialVolume, days, treatmentPlan);
    task.currentVolume = task.simulationData.volumes[task.simulationData.volumes.length - 1];
    task.necrosisRatio = task.simulationData.necrosisRatios[task.simulationData.necrosisRatios.length - 1];
    
    if (status === 'completed' && Math.random() > 0.5) {
      const alert: Alert = {
        id: genId(),
        taskId: id,
        type: Math.random() > 0.5 ? 'volume_spike' : 'necrosis_worsen',
        level: Math.random() > 0.6 ? 'danger' : 'warning',
        message: Math.random() > 0.5 
          ? '肿瘤体积增长率超过基线值20%，建议复核治疗方案' 
          : '坏死核心比例持续上升，需关注肿瘤内部微环境变化',
        createdAt: task.updatedAt - 3600000,
        reviewed: true,
        reviewResult: 'continue',
        reviewer: '李医生',
        reviewedAt: task.updatedAt - 1800000,
      };
      task.alerts.push(alert);
    }
  }
  
  return task;
}

export function initMockData() {
  const mockPatients = [
    { name: '张明', type: '肺腺癌', stage: 'IIIB期' },
    { name: '李华', type: '肝细胞癌', stage: 'II期' },
    { name: '王芳', type: '乳腺癌', stage: 'II期' },
    { name: '陈伟', type: '结直肠癌', stage: 'III期' },
    { name: '刘洋', type: '肺腺癌', stage: 'IV期' },
    { name: '赵雪', type: '乳腺癌', stage: 'I期' },
    { name: '孙强', type: '胶质母细胞瘤', stage: 'IV级' },
    { name: '周敏', type: '卵巢癌', stage: 'III期' },
  ];
  
  const statuses: SimulationTask['status'][] = [
    'pending_verify',
    'model_building',
    'growth_calculating',
    'treatment_intervening',
    'completed',
    'completed',
    'completed',
    'error_fallback',
  ];
  
  tasks = mockPatients.map((p, i) => {
    const patient = createMockPatient(`P${1001 + i}`, p.name, p.type, p.stage);
    return createMockTask(`TASK-${1001 + i}`, statuses[i], patient, 30 + Math.floor(Math.random() * 30));
  });
  
  approvals = tasks
    .filter(t => t.status === 'completed')
    .map((task, idx) => ({
      id: `APR-${2001 + idx}`,
      taskId: task.id,
      stage: idx % 2 === 0 ? 'first_level' as const : 'second_level' as const,
      status: idx < 2 ? 'pending' as const : idx < 4 ? 'approved' as const : 'pushed_to_clinical' as const,
      requester: '张研究员',
      approver: idx >= 2 ? (idx % 2 === 0 ? '王主任' : '陈首席') : undefined,
      createdAt: task.updatedAt + 3600000,
      approvedAt: idx >= 2 ? task.updatedAt + 7200000 : undefined,
      comment: idx >= 2 ? '同意推荐方案，建议结合临床实际调整剂量' : undefined,
      recommendedDrugs: ['紫杉醇', '卡铂', '贝伐珠单抗'],
      recommendationScore: 0.85 + Math.random() * 0.1,
    }));
}

export function getTasks(): SimulationTask[] {
  return tasks.sort((a, b) => b.createdAt - a.createdAt);
}

export function getTaskById(id: string): SimulationTask | undefined {
  return tasks.find(t => t.id === id);
}

export function createTask(patientData: Omit<Patient, 'id'>, cellParams: CellParams, simulationDays: number, imageName?: string): SimulationTask {
  const patient: Patient = {
    ...patientData,
    id: 'P' + (1000 + tasks.length + 1),
  };
  
  const task: SimulationTask = {
    id: 'TASK-' + (1000 + tasks.length + 1),
    patient,
    status: 'pending_verify',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    cellParams,
    imageName: imageName || '未上传',
    currentVolume: 12.5,
    necrosisRatio: 0.05,
    baselineGrowthRate: (cellParams.proliferationRate - cellParams.apoptosisRate) * 0.5,
    alerts: [],
    simulationDays,
    deviationCount: 0,
    paused: false,
  };
  
  tasks.unshift(task);
  return task;
}

export function updateTaskStatus(taskId: string, status: SimulationTask['status']): SimulationTask | undefined {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.status = status;
    task.updatedAt = Date.now();
  }
  return task;
}

export function updateTaskSimulation(taskId: string, volume: number, necrosis: number): SimulationTask | undefined {
  const task = tasks.find(t => t.id === taskId);
  if (task && task.simulationData) {
    task.currentVolume = volume;
    task.necrosisRatio = necrosis;
    task.updatedAt = Date.now();
  }
  return task;
}

export function addAlert(taskId: string, alert: Omit<Alert, 'id' | 'taskId' | 'createdAt' | 'reviewed'>): Alert | undefined {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    const newAlert: Alert = {
      ...alert,
      id: genId(),
      taskId,
      createdAt: Date.now(),
      reviewed: false,
    };
    task.alerts.push(newAlert);
    return newAlert;
  }
  return undefined;
}

export function reviewAlert(taskId: string, alertId: string, result: 'adjust_treatment' | 'continue', reviewer: string): Alert | undefined {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    const alert = task.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.reviewed = true;
      alert.reviewResult = result;
      alert.reviewer = reviewer;
      alert.reviewedAt = Date.now();
      return alert;
    }
  }
  return undefined;
}

export function getAlerts(): Alert[] {
  return tasks.flatMap(t => t.alerts).sort((a, b) => b.createdAt - a.createdAt);
}

export function getApprovals(): Approval[] {
  return approvals.sort((a, b) => b.createdAt - a.createdAt);
}

export function getApprovalById(id: string): Approval | undefined {
  return approvals.find(a => a.id === id);
}

export function approveApproval(id: string, approver: string, comment: string): Approval | undefined {
  const approval = approvals.find(a => a.id === id);
  if (approval) {
    if (approval.stage === 'first_level') {
      approval.status = 'approved';
      approvals.push({
        id: 'APR-' + (2000 + approvals.length + 1),
        taskId: approval.taskId,
        stage: 'second_level',
        status: 'pending',
        requester: approver,
        createdAt: Date.now(),
        recommendedDrugs: approval.recommendedDrugs,
        recommendationScore: approval.recommendationScore,
      });
    } else if (approval.stage === 'second_level') {
      approval.status = 'pushed_to_clinical';
    }
    approval.approver = approver;
    approval.approvedAt = Date.now();
    approval.comment = comment;
  }
  return approval;
}

export function getRecommendations(cancerType?: string, stage?: string): DrugRecommendation[] {
  const key = `${cancerType || 'all'}-${stage || 'all'}`;
  if (recommendationCache.has(key)) {
    return recommendationCache.get(key)!;
  }
  
  const recommendations: DrugRecommendation[] = [
    {
      id: 'REC-001',
      drugs: ['紫杉醇', '卡铂'],
      score: 0.92,
      rationale: '基于127例相似病例分析，该组合对晚期实体瘤疗效显著，中位无进展生存期延长4.2个月',
      similarCases: 127,
      avgSurvivalImprovement: 28.5,
      cancerType: cancerType || '肺腺癌',
      stage: stage || 'III期',
    },
    {
      id: 'REC-002',
      drugs: ['紫杉醇', '卡铂', '贝伐珠单抗'],
      score: 0.88,
      rationale: '三联方案在血管生成丰富的肿瘤中表现优异，但需注意高血压和出血风险',
      similarCases: 89,
      avgSurvivalImprovement: 35.2,
      cancerType: cancerType || '肺腺癌',
      stage: stage || 'III期',
    },
    {
      id: 'REC-003',
      drugs: ['奥希替尼'],
      score: 0.85,
      rationale: '针对EGFR突变阳性患者的一线靶向治疗，PFS优于传统化疗',
      similarCases: 156,
      avgSurvivalImprovement: 42.1,
      cancerType: cancerType || '肺腺癌',
      stage: stage || 'III期',
    },
    {
      id: 'REC-004',
      drugs: ['帕博利珠单抗', '培美曲塞'],
      score: 0.81,
      rationale: '免疫联合化疗方案，PD-L1高表达患者获益更明显',
      similarCases: 94,
      avgSurvivalImprovement: 31.8,
      cancerType: cancerType || '肺腺癌',
      stage: stage || 'III期',
    },
  ];
  
  recommendationCache.set(key, recommendations);
  return recommendations;
}

export function createApprovalForTask(taskId: string, drugs: string[], score: number): Approval {
  const approval: Approval = {
    id: 'APR-' + (2000 + approvals.length + 1),
    taskId,
    stage: 'first_level',
    status: 'pending',
    requester: '系统自动提交',
    createdAt: Date.now(),
    recommendedDrugs: drugs,
    recommendationScore: score,
  };
  approvals.unshift(approval);
  return approval;
}

export function getDashboardStats() {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
  
  const activeSimulations = tasks.filter(t => 
    t.status === 'model_building' || t.status === 'growth_calculating' || t.status === 'treatment_intervening'
  ).length;
  
  const alertsToday = tasks.flatMap(t => t.alerts).filter(a => a.createdAt > dayAgo).length;
  const approvalsPending = approvals.filter(a => a.status === 'pending').length;
  
  const completedToday = tasks.filter(t => t.status === 'completed' && t.updatedAt > dayAgo).length;
  
  const dailyTrend = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now - (6 - i) * 24 * 60 * 60 * 1000);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    return {
      date: dateStr,
      completed: Math.floor(Math.random() * 5) + 2,
      created: Math.floor(Math.random() * 8) + 3,
    };
  });
  dailyTrend[dailyTrend.length - 1].completed = completedToday;
  
  const cancerTypeCounts = new Map<string, number>();
  const stageCounts = new Map<string, number>();
  tasks.forEach(t => {
    cancerTypeCounts.set(t.patient.cancerType, (cancerTypeCounts.get(t.patient.cancerType) || 0) + 1);
    stageCounts.set(t.patient.stage, (stageCounts.get(t.patient.stage) || 0) + 1);
  });
  
  const cancerTypeDistribution = Array.from(cancerTypeCounts.entries()).map(([type, count]) => ({ type, count }));
  const stageDistribution = Array.from(stageCounts.entries()).map(([stage, count]) => ({ stage, count }));
  
  let totalResponseTime = 0;
  let responseCount = 0;
  tasks.forEach(t => {
    if (t.status === 'completed') {
      totalResponseTime += (t.updatedAt - t.createdAt) / (1000 * 60 * 60);
      responseCount++;
    }
  });
  const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
  
  let convergenceCount = 0;
  tasks.forEach(t => {
    if (t.treatmentPlan && t.treatmentPlan.version > 1) {
      convergenceCount++;
    }
  });
  convergenceCount = Math.floor(tasks.length * 0.35);
  
  return {
    totalTasks,
    completedTasks,
    completionRate: parseFloat(completionRate.toFixed(4)),
    avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
    convergenceCount,
    activeSimulations,
    alertsToday,
    approvalsPending,
    dailyTrend,
    cancerTypeDistribution,
    stageDistribution,
  };
}

export function updateTreatmentPlan(taskId: string, treatmentPlan: TreatmentPlan): SimulationTask | undefined {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    if (task.simulationData && task.treatmentPlan) {
      if (!task.simulationHistory) {
        task.simulationHistory = [];
      }
      task.simulationHistory.push({
        version: task.treatmentPlan.version,
        treatmentPlan: { ...task.treatmentPlan },
        simulationData: { ...task.simulationData },
        createdAt: task.updatedAt,
      });
    }
    
    task.treatmentPlan = {
      ...treatmentPlan,
      version: (task.treatmentPlan?.version || 0) + 1,
      adjustedAt: Date.now(),
    };
    
    task.status = 'growth_calculating';
    task.updatedAt = Date.now();
    
    const simData = runSimulation(task.cellParams, task.currentVolume, task.simulationDays, task.treatmentPlan);
    task.simulationData = simData;
    task.currentVolume = simData.volumes[simData.volumes.length - 1];
    task.necrosisRatio = simData.necrosisRatios[simData.necrosisRatios.length - 1];
    
    const maxNecrosis = Math.max(...simData.necrosisRatios);
    if (maxNecrosis > 0.3) {
      task.alerts.push({
        id: genId(),
        taskId,
        type: 'necrosis_worsen',
        level: maxNecrosis > 0.5 ? 'danger' : 'warning',
        message: `新方案下坏死核心比例仍较高，最高达 ${(maxNecrosis * 100).toFixed(1)}%，超过预警阈值 30%`,
        createdAt: Date.now(),
        reviewed: false,
      });
    }
    
    const finalGrowthRate = simData.growthRates[simData.growthRates.length - 1];
    if (Math.abs(finalGrowthRate) > task.baselineGrowthRate * 1.2) {
      task.alerts.push({
        id: genId(),
        taskId,
        type: 'volume_spike',
        level: Math.abs(finalGrowthRate) > task.baselineGrowthRate * 1.5 ? 'danger' : 'warning',
        message: `新方案下体积增长率${finalGrowthRate > 0 ? '仍偏高' : '下降明显'}，当前增长率: ${finalGrowthRate.toFixed(2)}%/天`,
        createdAt: Date.now(),
        reviewed: false,
      });
    }
    
    return task;
  }
  return undefined;
}
