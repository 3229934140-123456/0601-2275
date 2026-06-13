import { Router, Request, Response } from 'express';
import { getRecommendations, getTasks, createApprovalForTask } from '../services/store.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { cancerType, stage, taskId } = req.query;
  
  let type = cancerType as string | undefined;
  let st = stage as string | undefined;
  
  if (taskId) {
    const task = getTasks().find(t => t.id === taskId);
    if (task) {
      type = task.patient.cancerType;
      st = task.patient.stage;
    }
  }
  
  const recommendations = getRecommendations(type, st);
  res.json(recommendations);
});

router.post('/submit-approval', (req: Request, res: Response) => {
  const { taskId, drugs, score } = req.body;
  
  if (!taskId || !drugs || !drugs.length) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }
  
  const approval = createApprovalForTask(taskId, drugs, score || 0.8);
  res.status(201).json(approval);
});

export default router;
