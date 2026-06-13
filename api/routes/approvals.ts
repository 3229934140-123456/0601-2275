import { Router, Request, Response } from 'express';
import { getApprovals, getApprovalById, approveApproval, getTaskById } from '../services/store.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { status, stage } = req.query;
  let approvals = getApprovals();
  
  if (status) {
    approvals = approvals.filter(a => a.status === status);
  }
  
  if (stage) {
    approvals = approvals.filter(a => a.stage === stage);
  }
  
  const approvalsWithTask = approvals.map(approval => {
    const task = getTaskById(approval.taskId);
    return {
      ...approval,
      patientName: task?.patient.name,
      cancerType: task?.patient.cancerType,
      patientStage: task?.patient.stage,
    };
  });
  
  res.json(approvalsWithTask);
});

router.get('/:id', (req: Request, res: Response) => {
  const approval = getApprovalById(req.params.id);
  if (!approval) {
    res.status(404).json({ error: '审批不存在' });
    return;
  }
  
  const task = getTaskById(approval.taskId);
  res.json({
    ...approval,
    task,
  });
});

router.post('/:id/approve', (req: Request, res: Response) => {
  const { approver, comment } = req.body;
  
  if (!approver) {
    res.status(400).json({ error: '缺少审批人信息' });
    return;
  }
  
  const approval = approveApproval(req.params.id, approver, comment || '');
  if (!approval) {
    res.status(404).json({ error: '审批不存在' });
    return;
  }
  
  res.json(approval);
});

router.post('/:id/reject', (req: Request, res: Response) => {
  const approval = getApprovalById(req.params.id);
  if (!approval) {
    res.status(404).json({ error: '审批不存在' });
    return;
  }
  
  approval.status = 'rejected';
  approval.approver = req.body.rejector || '未知';
  approval.approvedAt = Date.now();
  approval.comment = req.body.comment || '';
  
  res.json(approval);
});

export default router;
