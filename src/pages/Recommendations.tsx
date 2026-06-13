import { useState, useEffect } from 'react';
import { Brain, Star, TrendingUp, Users, Check, Send, ChevronRight, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../store/taskStore';
import type { DrugRecommendation } from '@shared/types';
import { cn } from '../lib/utils';

export default function Recommendations() {
  const navigate = useNavigate();
  const { recommendations, fetchRecommendations, submitForApproval, loading } = useTaskStore();
  const [selectedRec, setSelectedRec] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  useEffect(() => {
    fetchRecommendations();
  }, []);
  
  const handleSubmitApproval = async (rec: DrugRecommendation) => {
    if (!selectedTaskId) {
      alert('请先选择一个任务');
      return;
    }
    await submitForApproval(selectedTaskId, rec.drugs, rec.score);
    setSelectedRec(rec.id);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };
  
  const renderStars = (score: number) => {
    const stars = Math.round(score * 5);
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={cn(
          "w-4 h-4",
          i < stars ? "text-warning fill-warning" : "text-slate-200"
        )}
      />
    ));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">推荐中心</h2>
          <p className="text-sm text-slate-500 mt-1">
            基于历史模拟数据的智能药物组合推荐
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">关联任务：</span>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">选择关联任务...</option>
              <option value="TASK-1001">TASK-1001 - 张明 (肺腺癌 IIIB期)</option>
              <option value="TASK-1002">TASK-1002 - 李华 (肝细胞癌 II期)</option>
              <option value="TASK-1003">TASK-1003 - 王芳 (乳腺癌 II期)</option>
            </select>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-card p-5 animate-pulse">
                  <div className="h-6 w-48 bg-slate-200 rounded mb-3" />
                  <div className="h-4 w-full bg-slate-100 rounded mb-2" />
                  <div className="h-4 w-3/4 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div 
                  key={rec.id}
                  className={cn(
                    "bg-white rounded-xl shadow-card p-5 transition-all",
                    selectedRec === rec.id ? "ring-2 ring-primary shadow-card-hover" : "hover:shadow-card-hover"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 text-lg">
                            {rec.drugs.join(' + ')}
                          </h4>
                          <div className="flex items-center gap-1 mt-1">
                            {renderStars(rec.score)}
                            <span className="text-sm text-slate-500 ml-2">
                              推荐评分 {(rec.score * 100).toFixed(0)}分
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                        {rec.rationale}
                      </p>
                      
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="text-sm text-slate-600">
                            相似病例 <span className="font-semibold">{rec.similarCases}</span> 例
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-success" />
                          <span className="text-sm text-slate-600">
                            生存期提升 <span className="font-semibold text-success">+{rec.avgSurvivalImprovement.toFixed(1)}%</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleSubmitApproval(rec)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-light text-white rounded-lg transition-all text-sm font-medium shadow-md hover:shadow-lg"
                      >
                        <Send className="w-4 h-4" />
                        提交审批
                      </button>
                      <button
                        onClick={() => navigate(`/tasks/${selectedTaskId || 'TASK-1001'}`)}
                        className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-primary transition-colors"
                      >
                        查看详情
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {showSuccess && selectedRec === rec.id && (
                    <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2 animate-fade-in">
                      <Check className="w-4 h-4 text-success" />
                      <span className="text-sm text-success font-medium">
                        已提交审批，请在审批中心查看进度
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-slate-800">推荐算法说明</h3>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                <p>基于1000+历史模拟病例的特征匹配</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                <p>综合评估疗效、安全性、费用等多维因素</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                <p>持续学习专家复核结果，迭代优化模型</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-5 text-white">
            <h3 className="font-semibold mb-2">本月推荐统计</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">128</p>
                <p className="text-sm text-white/70">推荐方案</p>
              </div>
              <div>
                <p className="text-2xl font-bold">87%</p>
                <p className="text-sm text-white/70">采纳率</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-card p-5">
            <h3 className="font-semibold text-slate-800 mb-3">常见药物组合</h3>
            <div className="space-y-2">
              {['紫杉醇+卡铂', '奥希替尼', '帕博利珠单抗+培美曲塞', '贝伐珠单抗+化疗'].map((drug, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-600">{drug}</span>
                  <span className="text-xs text-slate-400">
                    {Math.floor(Math.random() * 50 + 20)} 例应用
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
