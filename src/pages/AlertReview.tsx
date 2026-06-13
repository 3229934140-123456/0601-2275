import { useState, useEffect } from 'react';
import { AlertTriangle, Check, X, Filter, User, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../store/taskStore';
import type { Alert as AlertType } from '@shared/types';
import { cn } from '../lib/utils';

interface AlertWithPatient extends AlertType {
  patientName?: string;
  cancerType?: string;
}

export default function AlertReview() {
  const navigate = useNavigate();
  const { alerts, fetchAlerts, reviewAlert, loading } = useTaskStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [levelFilter, setLevelFilter] = useState<'all' | 'warning' | 'danger'>('all');
  
  useEffect(() => {
    loadAlerts();
  }, [filter, levelFilter]);
  
  const loadAlerts = () => {
    const reviewed = filter === 'all' ? undefined : filter === 'reviewed';
    const level = levelFilter === 'all' ? undefined : levelFilter;
    fetchAlerts({ reviewed, level });
  };
  
  const handleReview = (alert: AlertWithPatient, result: 'adjust_treatment' | 'continue') => {
    reviewAlert(alert.taskId, alert.id, result, '李医生');
  };
  
  const filteredAlerts = alerts as AlertWithPatient[];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">预警复核中心</h2>
          <p className="text-sm text-slate-500 mt-1">
            {filteredAlerts.filter(a => !a.reviewed).length} 条预警待处理
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex gap-2">
            {[
              { value: 'pending', label: '待复核' },
              { value: 'reviewed', label: '已复核' },
              { value: 'all', label: '全部' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as typeof filter)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  filter === f.value
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          
          <div className="w-px h-6 bg-slate-200 mx-2" />
          
          <div className="flex gap-2">
            {[
              { value: 'all', label: '全部级别' },
              { value: 'warning', label: '预警' },
              { value: 'danger', label: '高危' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setLevelFilter(f.value as typeof levelFilter)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  levelFilter === f.value
                    ? "bg-warning/20 text-warning"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-card p-5 animate-pulse">
              <div className="h-5 w-48 bg-slate-200 rounded mb-3" />
              <div className="h-4 w-full bg-slate-100 rounded mb-2" />
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-card">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">暂无预警记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div 
              key={alert.id}
              className={cn(
                "bg-white rounded-xl shadow-card p-5 transition-all hover:shadow-card-hover",
                alert.level === 'danger' ? "border-l-4 border-danger" : "border-l-4 border-warning"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className={cn(
                      "w-5 h-5",
                      alert.level === 'danger' ? "text-danger" : "text-warning"
                    )} />
                    <h4 className="font-semibold text-slate-800">
                      {alert.type === 'volume_spike' ? '肿瘤体积增长率异常' : '坏死核心比例加剧'}
                    </h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      alert.level === 'danger' 
                        ? "bg-danger/10 text-danger" 
                        : "bg-warning/10 text-warning"
                    )}>
                      {alert.level === 'danger' ? '高危' : '预警'}
                    </span>
                    {alert.reviewed && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                        已复核
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-3">{alert.message}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {alert.patientName || '未知患者'}
                    </span>
                    <span>{alert.cancerType}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(alert.createdAt).toLocaleString('zh-CN')}
                    </span>
                    {alert.reviewer && (
                      <span>复核人: {alert.reviewer}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {!alert.reviewed ? (
                    <>
                      <button
                        onClick={() => handleReview(alert, 'continue')}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        继续观察
                      </button>
                      <button
                        onClick={() => handleReview(alert, 'adjust_treatment')}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        调整方案
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => navigate(`/tasks/${alert.taskId}`)}
                      className="flex items-center gap-1 text-primary text-xs font-medium hover:underline"
                    >
                      查看任务
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              
              {alert.reviewResult && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    复核结果: 
                    <span className="font-medium text-slate-700 ml-1">
                      {alert.reviewResult === 'adjust_treatment' ? '调整治疗方案' : '继续观察'}
                    </span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
