import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Download, 
  Calendar,
  User,
  ChevronRight,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { cn } from '../lib/utils';

export default function Reports() {
  const navigate = useNavigate();
  const { tasks, fetchTasks, exportData } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    fetchTasks({ status: 'completed' });
  }, []);
  
  const completedTasks = tasks.filter(t => t.status === 'completed');
  
  const handleExport = (taskId: string, format: string) => {
    exportData(taskId, format);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">报告中心</h2>
          <p className="text-sm text-slate-500 mt-1">
            共 {completedTasks.length} 份已完成模拟报告
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索患者姓名、任务ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>
      
      {completedTasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-card">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">暂无已完成的报告</p>
        </div>
      ) : (
        <div className="space-y-3">
          {completedTasks.map((task) => (
            <div 
              key={task.id}
              className="bg-white rounded-xl shadow-card p-5 hover:shadow-card-hover transition-all cursor-pointer"
              onClick={() => navigate(`/reports/${task.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">
                      {task.patient.name} - 肿瘤生长模拟报告
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {task.patient.cancerType} {task.patient.stage}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(task.updatedAt).toLocaleDateString('zh-CN')}
                      </span>
                      <span>模拟周期: {task.simulationDays}天</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleExport(task.id, 'json'); }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    JSON
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleExport(task.id, 'csv'); }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    CSV
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/reports/${task.id}`); }}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-light transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    查看报告
                  </button>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
