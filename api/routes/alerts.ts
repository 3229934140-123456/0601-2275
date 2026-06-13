import { Router, Request, Response } from 'express';
import { getAlerts, getTaskById } from '../services/store.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { reviewed, level, taskId } = req.query;
  let alerts = getAlerts();
  
  if (reviewed !== undefined) {
    const isReviewed = reviewed === 'true';
    alerts = alerts.filter(a => a.reviewed === isReviewed);
  }
  
  if (level) {
    alerts = alerts.filter(a => a.level === level);
  }
  
  if (taskId) {
    alerts = alerts.filter(a => a.taskId === taskId);
  }
  
  const alertsWithTask = alerts.map(alert => {
    const task = getTaskById(alert.taskId);
    return {
      ...alert,
      patientName: task?.patient.name,
      cancerType: task?.patient.cancerType,
    };
  });
  
  res.json(alertsWithTask);
});

export default router;
