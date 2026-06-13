export type TaskStatus = 
  | 'pending_verify' 
  | 'model_building' 
  | 'growth_calculating' 
  | 'treatment_intervening' 
  | 'completed' 
  | 'error_fallback';

export type AlertType = 'volume_spike' | 'necrosis_worsen';
export type AlertLevel = 'warning' | 'danger';
export type ReviewResult = 'adjust_treatment' | 'continue' | null;
export type ApprovalStage = 'first_level' | 'second_level';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'pushed_to_clinical';
export type Gender = 'male' | 'female';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  cancerType: string;
  stage: string;
}

export interface CellParams {
  proliferationRate: number;
  apoptosisRate: number;
  migrationRate: number;
  nutrientThreshold: number;
  oxygenThreshold: number;
}

export interface Alert {
  id: string;
  taskId: string;
  type: AlertType;
  level: AlertLevel;
  message: string;
  createdAt: number;
  reviewed: boolean;
  reviewResult?: ReviewResult;
  reviewer?: string;
  reviewedAt?: number;
}

export interface ChemoPlan {
  drug: string;
  dose: number;
  unit: string;
  frequency: string;
  cycles: number;
}

export interface RadioPlan {
  dose: number;
  fractions: number;
  frequency: string;
  targetVolume: string;
}

export interface TreatmentPlan {
  chemotherapy: ChemoPlan[];
  radiotherapy: RadioPlan[];
  adjustedAt?: number;
  adjustmentReason?: string;
  version: number;
}

export interface DensityMap {
  day: number;
  data: number[][];
  minValue: number;
  maxValue: number;
}

export interface SurvivalPoint {
  time: number;
  survivalRate: number;
}

export interface SimulationData {
  timeline: number[];
  volumes: number[];
  necrosisRatios: number[];
  cellDensityMaps: DensityMap[];
  survivalCurve: SurvivalPoint[];
  growthRates: number[];
}

export interface SimulationTask {
  id: string;
  patient: Patient;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  cellParams: CellParams;
  imageUrl?: string;
  imageName?: string;
  currentVolume: number;
  necrosisRatio: number;
  baselineGrowthRate: number;
  alerts: Alert[];
  treatmentPlan?: TreatmentPlan;
  simulationData?: SimulationData;
  simulationDays: number;
  deviationCount: number;
  paused: boolean;
}

export interface CreateTaskRequest {
  patient: Omit<Patient, 'id'>;
  cellParams: CellParams;
  simulationDays: number;
}

export interface Approval {
  id: string;
  taskId: string;
  stage: ApprovalStage;
  status: ApprovalStatus;
  requester: string;
  approver?: string;
  createdAt: number;
  approvedAt?: number;
  comment?: string;
  recommendedDrugs: string[];
  recommendationScore: number;
}

export interface DrugRecommendation {
  id: string;
  drugs: string[];
  score: number;
  rationale: string;
  similarCases: number;
  avgSurvivalImprovement: number;
  cancerType: string;
  stage: string;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  avgResponseTime: number;
  convergenceCount: number;
  activeSimulations: number;
  alertsToday: number;
  approvalsPending: number;
  dailyTrend: { date: string; completed: number; created: number }[];
  cancerTypeDistribution: { type: string; count: number }[];
  stageDistribution: { stage: string; count: number }[];
}

export interface ReportData {
  taskId: string;
  patient: Patient;
  summary: {
    initialVolume: number;
    finalVolume: number;
    volumeChange: number;
    maxNecrosisRatio: number;
    simulationDays: number;
  };
  simulationData: SimulationData;
  treatmentPlan?: TreatmentPlan;
  generatedAt: number;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending_verify: '待校验',
  model_building: '模型构建',
  growth_calculating: '生长计算',
  treatment_intervening: '治疗干预',
  completed: '已完成',
  error_fallback: '异常回退',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending_verify: 'bg-amber-100 text-amber-700 border-amber-200',
  model_building: 'bg-blue-100 text-blue-700 border-blue-200',
  growth_calculating: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  treatment_intervening: 'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  error_fallback: 'bg-red-100 text-red-700 border-red-200',
};
