import { create } from 'zustand';
import type { SimulationTask, Alert, Approval, DrugRecommendation, DashboardStats, ReportData } from '@shared/types';

interface TaskStore {
  tasks: SimulationTask[];
  currentTask: SimulationTask | null;
  alerts: Alert[];
  approvals: Approval[];
  recommendations: DrugRecommendation[];
  dashboardStats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  
  fetchTasks: (filters?: { status?: string; search?: string }) => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  createTask: (data: unknown) => Promise<SimulationTask>;
  startTask: (id: string) => Promise<void>;
  advanceTask: (id: string, step: string) => Promise<void>;
  reviewAlert: (taskId: string, alertId: string, result: 'adjust_treatment' | 'continue', reviewer: string) => Promise<void>;
  adjustTreatment: (taskId: string, treatmentPlan: unknown, reason: string) => Promise<void>;
  
  fetchAlerts: (filters?: { reviewed?: boolean; level?: string }) => Promise<void>;
  
  fetchApprovals: (filters?: { status?: string; stage?: string }) => Promise<void>;
  approveApproval: (id: string, approver: string, comment: string) => Promise<void>;
  
  fetchRecommendations: (filters?: { cancerType?: string; stage?: string; taskId?: string }) => Promise<void>;
  submitForApproval: (taskId: string, drugs: string[], score: number) => Promise<void>;
  
  fetchDashboardStats: () => Promise<void>;
  
  fetchReport: (taskId: string) => Promise<ReportData | null>;
  exportData: (taskId: string, format: string, stage?: string) => Promise<void>;
  
  setCurrentTask: (task: SimulationTask | null) => void;
}

const API_BASE = '/api';

async function apiCall<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || '请求失败');
  }
  
  return res.json();
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  currentTask: null,
  alerts: [],
  approvals: [],
  recommendations: [],
  dashboardStats: null,
  loading: false,
  error: null,
  
  fetchTasks: async (filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiCall<SimulationTask[]>(`/tasks${query}`);
      set({ tasks: data });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchTask: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await apiCall<SimulationTask>(`/tasks/${id}`);
      set({ currentTask: data });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  createTask: async (data) => {
    set({ loading: true, error: null });
    try {
      const task = await apiCall<SimulationTask>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      set(state => ({ tasks: [task, ...state.tasks] }));
      return task;
    } finally {
      set({ loading: false });
    }
  },
  
  startTask: async (id) => {
    set({ loading: true, error: null });
    try {
      const updated = await apiCall<SimulationTask>(`/tasks/${id}/start`, {
        method: 'POST',
      });
      set(state => ({
        currentTask: updated,
        tasks: state.tasks.map(t => t.id === id ? updated : t),
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  advanceTask: async (id, step) => {
    try {
      const updated = await apiCall<SimulationTask>(`/tasks/${id}/progress`, {
        method: 'POST',
        body: JSON.stringify({ step }),
      });
      set(state => ({
        currentTask: updated,
        tasks: state.tasks.map(t => t.id === id ? updated : t),
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
  
  reviewAlert: async (taskId, alertId, result, reviewer) => {
    try {
      const alert = await apiCall<Alert>(`/tasks/${taskId}/review-alert`, {
        method: 'POST',
        body: JSON.stringify({ alertId, result, reviewer }),
      });
      
      set(state => {
        const currentTask = state.currentTask;
        if (currentTask && currentTask.id === taskId) {
          const updatedTask = {
            ...currentTask,
            alerts: currentTask.alerts.map(a => a.id === alertId ? alert : a),
          };
          return {
            currentTask: updatedTask,
            tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
          };
        }
        return state;
      });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
  
  adjustTreatment: async (taskId, treatmentPlan, reason) => {
    set({ loading: true, error: null });
    try {
      const updated = await apiCall<SimulationTask>(`/tasks/${taskId}/adjust-treatment`, {
        method: 'POST',
        body: JSON.stringify({ treatmentPlan, reason }),
      });
      set(state => ({
        currentTask: updated,
        tasks: state.tasks.map(t => t.id === taskId ? updated : t),
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchAlerts: async (filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.reviewed !== undefined) params.set('reviewed', String(filters.reviewed));
      if (filters?.level) params.set('level', filters.level);
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiCall<Alert[]>(`/alerts${query}`);
      set({ alerts: data });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchApprovals: async (filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.stage) params.set('stage', filters.stage);
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiCall<Approval[]>(`/approvals${query}`);
      set({ approvals: data });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  approveApproval: async (id, approver, comment) => {
    try {
      const updated = await apiCall<Approval>(`/approvals/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approver, comment }),
      });
      set(state => ({
        approvals: state.approvals.map(a => a.id === id ? updated : a),
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
  
  fetchRecommendations: async (filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.cancerType) params.set('cancerType', filters.cancerType);
      if (filters?.stage) params.set('stage', filters.stage);
      if (filters?.taskId) params.set('taskId', filters.taskId);
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiCall<DrugRecommendation[]>(`/recommendations${query}`);
      set({ recommendations: data });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  submitForApproval: async (taskId, drugs, score) => {
    try {
      const approval = await apiCall<Approval>('/recommendations/submit-approval', {
        method: 'POST',
        body: JSON.stringify({ taskId, drugs, score }),
      });
      set(state => ({
        approvals: [approval, ...state.approvals],
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
  
  fetchDashboardStats: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiCall<DashboardStats>('/tasks/stats/dashboard');
      set({ dashboardStats: data });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchReport: async (taskId) => {
    try {
      return await apiCall<ReportData>(`/tasks/${taskId}/report`);
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },
  
  exportData: async (taskId, format, stage) => {
    try {
      const params = new URLSearchParams();
      params.set('format', format);
      if (stage) params.set('stage', stage);
      
      const res = await fetch(`${API_BASE}/tasks/${taskId}/export?${params.toString()}`);
      if (!res.ok) throw new Error('导出失败');
      
      if (format === 'csv') {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${taskId}_growth_data.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${taskId}_growth_data.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
  
  setCurrentTask: (task) => set({ currentTask: task }),
}));
