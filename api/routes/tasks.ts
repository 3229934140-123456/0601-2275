import { Router, Request, Response } from 'express';
import { 
  getTasks, 
  getTaskById, 
  createTask, 
  updateTaskStatus,
  addAlert,
  reviewAlert,
  updateTreatmentPlan,
  getDashboardStats,
} from '../services/store.js';
import { runSimulation } from '../services/simulationEngine.js';
import type { SimulationTask, CreateTaskRequest, TreatmentPlan } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { status, search } = req.query;
  let tasks = getTasks();
  
  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }
  
  if (search) {
    const s = String(search).toLowerCase();
    tasks = tasks.filter(t => 
      t.patient.name.toLowerCase().includes(s) || 
      t.id.toLowerCase().includes(s) ||
      t.patient.cancerType.toLowerCase().includes(s)
    );
  }
  
  res.json(tasks);
});

router.get('/:id', (req: Request, res: Response) => {
  const task = getTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: '任务不存在' });
    return;
  }
  res.json(task);
});

router.post('/', (req: Request, res: Response) => {
  const { patient, cellParams, simulationDays, imageName } = req.body as CreateTaskRequest & { imageName?: string };
  
  if (!patient || !cellParams || !simulationDays) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }
  
  const task = createTask(patient, cellParams, simulationDays, imageName);
  res.status(201).json(task);
});

router.post('/:id/start', (req: Request, res: Response) => {
  const task = getTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: '任务不存在' });
    return;
  }
  
  if (task.status !== 'pending_verify') {
    res.status(400).json({ error: '任务状态不允许启动' });
    return;
  }
  
  const updatedTask = updateTaskStatus(req.params.id, 'model_building');
  res.json(updatedTask);
});

router.post('/:id/progress', (req: Request, res: Response) => {
  const task = getTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: '任务不存在' });
    return;
  }
  
  const { step } = req.body;
  
  if (step === 'model_done') {
    const updated = updateTaskStatus(req.params.id, 'growth_calculating');
    
    const simData = runSimulation(task.cellParams, task.initialVolume, task.simulationDays, task.treatmentPlan);
    
    if (updated) {
      updated.simulationData = simData;
      updated.currentVolume = simData.volumes[simData.volumes.length - 1];
      updated.necrosisRatio = simData.necrosisRatios[simData.necrosisRatios.length - 1];
    }
    
    const growthRate = simData.growthRates[simData.growthRates.length - 1];
    if (Math.abs(growthRate) > task.baselineGrowthRate * 1.2) {
      addAlert(req.params.id, {
        type: 'volume_spike',
        level: Math.abs(growthRate) > task.baselineGrowthRate * 1.5 ? 'danger' : 'warning',
        message: `肿瘤体积增长率${growthRate > 0 ? '上升' : '下降'}较快，当前增长率: ${growthRate.toFixed(2)}%/天，超出基线${task.baselineGrowthRate.toFixed(2)}%的1.2倍`,
      });
    }
    
    const maxNecrosis = Math.max(...simData.necrosisRatios);
    const necrosisThreshold = 0.3;
    if (maxNecrosis > necrosisThreshold) {
      const baselineNecrosis = 0.2;
      addAlert(req.params.id, {
        type: 'necrosis_worsen',
        level: maxNecrosis > 0.5 ? 'danger' : 'warning',
        message: `坏死核心比例持续上升，最高达 ${(maxNecrosis * 100).toFixed(1)}%，${maxNecrosis > 0.5 ? '已远超' : '已超过'}预警阈值 30%，需关注肿瘤内部微环境变化`,
      });
    }
    
    res.json(updated);
    return;
  }
  
  if (step === 'treatment_start') {
    const updated = updateTaskStatus(req.params.id, 'treatment_intervening');
    res.json(updated);
    return;
  }
  
  if (step === 'complete') {
    const updated = updateTaskStatus(req.params.id, 'completed');
    res.json(updated);
    return;
  }
  
  res.json(task);
});

router.post('/:id/review-alert', (req: Request, res: Response) => {
  const { alertId, result, reviewer } = req.body;
  
  if (!alertId || !result || !reviewer) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }
  
  const alert = reviewAlert(req.params.id, alertId, result, reviewer);
  if (!alert) {
    res.status(404).json({ error: '预警不存在' });
    return;
  }
  
  res.json(alert);
});

router.post('/:id/adjust-treatment', (req: Request, res: Response) => {
  const { treatmentPlan, reason } = req.body as { treatmentPlan: TreatmentPlan; reason: string };
  
  if (!treatmentPlan) {
    res.status(400).json({ error: '缺少治疗方案' });
    return;
  }
  
  const task = updateTreatmentPlan(req.params.id, treatmentPlan);
  if (!task) {
    res.status(404).json({ error: '任务不存在' });
    return;
  }
  
  if (task.treatmentPlan) {
    task.treatmentPlan.adjustmentReason = reason;
  }
  
  res.json(task);
});

router.get('/:id/report', (req: Request, res: Response) => {
  const task = getTaskById(req.params.id);
  if (!task || !task.simulationData) {
    res.status(404).json({ error: '任务或模拟数据不存在' });
    return;
  }
  
  const volumes = task.simulationData.volumes;
  const report = {
    taskId: task.id,
    patient: task.patient,
    imageName: task.imageName,
    summary: {
      initialVolume: volumes[0],
      finalVolume: volumes[volumes.length - 1],
      volumeChange: volumes[volumes.length - 1] - volumes[0],
      maxNecrosisRatio: Math.max(...task.simulationData.necrosisRatios),
      simulationDays: task.simulationDays,
    },
    simulationData: task.simulationData,
    treatmentPlan: task.treatmentPlan,
    simulationHistory: task.simulationHistory || [],
    generatedAt: Date.now(),
  };
  
  res.json(report);
});

router.get('/:id/export', (req: Request, res: Response) => {
  const task = getTaskById(req.params.id);
  if (!task || !task.simulationData) {
    res.status(404).json({ error: '任务或模拟数据不存在' });
    return;
  }
  
  const { format = 'json', stage, treatmentVersion } = req.query;
  
  let simData = task.simulationData;
  let currentTreatmentPlan = task.treatmentPlan;
  
  if (treatmentVersion && task.simulationHistory) {
    const version = parseInt(String(treatmentVersion));
    const historyItem = task.simulationHistory.find(h => h.version === version);
    if (historyItem) {
      simData = historyItem.simulationData;
      currentTreatmentPlan = historyItem.treatmentPlan;
    }
  }
  
  let data: unknown = simData;
  
  if (stage) {
    const stageDays: Record<string, [number, number]> = {
      'early': [0, Math.floor(task.simulationDays * 0.33)],
      'middle': [Math.floor(task.simulationDays * 0.33), Math.floor(task.simulationDays * 0.66)],
      'late': [Math.floor(task.simulationDays * 0.66), task.simulationDays],
    };
    
    const range = stageDays[String(stage)];
    if (range) {
      const [start, end] = range;
      const sim = simData;
      data = {
        timeline: sim.timeline.filter(t => t >= start && t <= end),
        volumes: sim.volumes.slice(start, end + 1),
        necrosisRatios: sim.necrosisRatios.slice(start, end + 1),
        growthRates: sim.growthRates.slice(start, end + 1),
        cellDensityMaps: sim.cellDensityMaps.filter(m => m.day >= start && m.day <= end),
      };
    }
  }
  
  const versionLabel = treatmentVersion ? `_v${treatmentVersion}` : '';
  const stageLabel = stage ? `_${stage}` : '';
  const fileNameBase = `${task.patient.name}_${task.id}${versionLabel}${stageLabel}`;
  
  if (format === 'csv') {
    const sim = data as typeof simData;
    const csvHeader = 'day,volume_cm3,necrosis_ratio,growth_rate_pct\n';
    const csvRows = sim.timeline.map((day, i) => 
      `${day},${sim.volumes[i]},${sim.necrosisRatios[i]},${sim.growthRates[i]}`
    ).join('\n');
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileNameBase}_growth_data.csv"`);
    res.send(csvHeader + csvRows);
    return;
  }
  
  res.setHeader('Content-Disposition', `attachment; filename="${fileNameBase}_growth_data.json"`);
  res.json({
    taskId: task.id,
    patient: { name: task.patient.name, cancerType: task.patient.cancerType, stage: task.patient.stage },
    stage: stage || 'all',
    treatmentVersion: treatmentVersion || 'latest',
    treatmentPlan: currentTreatmentPlan ? {
      version: currentTreatmentPlan.version,
      chemotherapy: currentTreatmentPlan.chemotherapy.map(c => ({ drug: c.drug, dose: c.dose })),
      radiotherapy: currentTreatmentPlan.radiotherapy.map(r => ({ dose: r.dose, fractions: r.fractions })),
    } : null,
    data,
    exportedAt: Date.now(),
  });
});

router.get('/stats/dashboard', (_req: Request, res: Response) => {
  const stats = getDashboardStats();
  res.json(stats);
});

export default router;
