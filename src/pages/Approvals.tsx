import { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Check, 
  X, 
  Clock, 
  User,
  FileText,
  Filter,
  ChevronRight,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { cn } from '../lib/utils';
import type { Approval } from '@shared/types';

interface ApprovalWithPatient extends Approval {
  patientName?: string;
  cancerType?: string;
  patientStage?: string;
}

export default function Approvals() {
  const { approvals, fetchApprovals, approveApproval, loading } = useTaskStore();
  const [stageFilter, setStageFilter] = useState<'all' | 'first_level' | 'second_level'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'pushed_to_clinical'>('all');
  const [comment, setComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
  
  useEffect(() => {
    loadApprovals();
  }, [stageFilter, statusFilter]);
  
  const loadApprovals = () => {
    const stage = stageFilter === 'all' ? undefined : stageFilter;
    const status = statusFilter === 'all' ? undefined : statusFilter;
    fetchApprovals({ stage, status });
  };
  
  const handleApprove = () => {
    if (!selectedApproval) return;
    approveApproval(selectedApproval, '王主任', comment);
    setShowCommentModal(false);
    setComment('');
    setSelectedApproval(null);
  };
  
  const openApproveModal = (id: string) => {
    setSelectedApproval(id);
    setShowCommentModal(true);
  };
  
  const filteredApprovals = approvals as ApprovalWithPatient[];
  
  const getStatusLabel = (status: Approval['status']) => {
    const labels: Record<Approval['status'], string> = {
      pending: '待审批',
      approved: '已通过',
      rejected: '已拒绝',
      pushed_to_clinical: '已推送临床',
    };
    return labels[status];
  };
  
  const getStatusColor = (status: Approval['status']) => {
    const colors: Record<Approval['status'], string> = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      pushed_to_clinical: 'bg-blue-100 text-blue-700',
    };
    return colors[status];
  };
  
  const getStageLabel = (stage: Approval['stage']) => {
    return stage === 'first_level' ? '一级审批' : '二级审批';
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">审批中心</h2>
          <p className="text-sm text-slate-500 mt-1">
            两级审批 · 推荐方案审核 · 临床系统推送
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {filteredApprovals.filter(a => a.status === 'pending').length}
              </p>
              <p className="text-xs text-slate-500">待审批</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {filteredApprovals.filter(a => a.stage === 'first_level').length}
              </p>
              <p className="text-xs text-slate-500">一级审批</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {filteredApprovals.filter(a => a.stage === 'second_level').length}
              </p>
              <p className="text-xs text-slate-500">二级审批</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {filteredApprovals.filter(a => a.status === 'pushed_to_clinical').length}
              </p>
              <p className="text-xs text-slate-500">已推送临床</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">审批阶段：</span>
          <div className="flex gap-2">
            {[
              { value: 'all', label: '全部' },
              { value: 'first_level', label: '一级审批' },
              { value: 'second_level', label: '二级审批' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStageFilter(f.value as typeof stageFilter)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  stageFilter === f.value
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          
          <div className="w-px h-6 bg-slate-200 mx-2" />
          
          <span className="text-sm text-slate-600">状态：</span>
          <div className="flex gap-2">
            {[
              { value: 'all', label: '全部' },
              { value: 'pending', label: '待审批' },
              { value: 'approved', label: '已通过' },
              { value: 'pushed_to_clinical', label: '已推送' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value as typeof statusFilter)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  statusFilter === f.value
                    ? "bg-success/20 text-success"
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
              <div className="h-6 w-48 bg-slate-200 rounded mb-3" />
              <div className="h-4 w-full bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-card">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">暂无审批记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApprovals.map((approval) => (
            <div 
              key={approval.id}
              className="bg-white rounded-xl shadow-card p-5 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-slate-800">
                      {approval.patientName || '未知患者'} · {approval.patientStage}
                    </h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      getStatusColor(approval.status)
                    )}>
                      {getStatusLabel(approval.status)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {getStageLabel(approval.stage)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-500 mb-3">
                    {approval.cancerType} · 推荐药物：
                    <span className="text-slate-700 font-medium ml-1">
                      {approval.recommendedDrugs.join(' + ')}
                    </span>
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      申请人: {approval.requester}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(approval.createdAt).toLocaleString('zh-CN')}
                    </span>
                    {approval.approver && (
                      <span>审批人: {approval.approver}</span>
                    )}
                    <span>
                      评分: <span className="font-medium text-primary">{(approval.recommendationScore * 100).toFixed(0)}分</span>
                    </span>
                  </div>
                  
                  {approval.comment && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">审批意见：</p>
                      <p className="text-sm text-slate-700">{approval.comment}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  {approval.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => openApproveModal(approval.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        通过
                      </button>
                      <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                        <X className="w-4 h-4" />
                        拒绝
                      </button>
                    </>
                  ) : (
                    <button className="flex items-center gap-1 text-primary text-sm font-medium hover:underline">
                      查看详情
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {approval.status === 'pushed_to_clinical' && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">已成功推送至临床决策系统</span>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">查看推送记录</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4 animate-slide-up">
            <h3 className="text-lg font-bold text-slate-800 mb-4">审批通过</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                审批意见
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="请输入审批意见（选填）..."
                rows={4}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCommentModal(false); setComment(''); }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                确认通过
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
