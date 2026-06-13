import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  User, 
  FileImage,
  Microscope,
  X,
  Check,
} from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { cn } from '../lib/utils';
import type { Gender, CellParams } from '@shared/types';

const defaultCellParams: CellParams = {
  proliferationRate: 0.65,
  apoptosisRate: 0.18,
  migrationRate: 0.35,
  nutrientThreshold: 0.45,
  oxygenThreshold: 0.35,
};

const cancerTypes = [
  '肺腺癌',
  '肺鳞癌',
  '小细胞肺癌',
  '乳腺癌',
  '肝细胞癌',
  '结直肠癌',
  '胃癌',
  '卵巢癌',
  '胶质母细胞瘤',
  '前列腺癌',
];

const stages = ['I期', 'II期', 'III期', 'IIIB期', 'IV期', 'IV级'];

export default function NewTask() {
  const navigate = useNavigate();
  const { createTask, loading } = useTaskStore();
  const [step, setStep] = useState(1);
  const [patientForm, setPatientForm] = useState({
    name: '',
    age: 55,
    gender: 'male' as Gender,
    cancerType: '肺腺癌',
    stage: 'III期',
  });
  const [cellParams, setCellParams] = useState<CellParams>(defaultCellParams);
  const [simulationDays, setSimulationDays] = useState(45);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
    }
  };
  
  const handleSubmit = async () => {
    try {
      const task = await createTask({
        patient: patientForm,
        cellParams,
        simulationDays,
        imageName: uploadedFile || undefined,
      });
      navigate(`/tasks/${task.id}`);
    } catch (e) {
      console.error(e);
    }
  };
  
  const canProceed = () => {
    if (step === 1) {
      return patientForm.name.trim() && patientForm.age > 0 && patientForm.cancerType && patientForm.stage;
    }
    if (step === 2) {
      return cellParams.proliferationRate > 0;
    }
    return true;
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">返回任务列表</span>
      </button>
      
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">新建模拟任务</h2>
              <p className="text-sm text-slate-500 mt-1">填写患者信息、上传病理影像并配置细胞参数</p>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    s < step ? "bg-success text-white" :
                    s === step ? "bg-primary text-white shadow-md" :
                    "bg-slate-100 text-slate-400"
                  )}>
                    {s < step ? <Check className="w-4 h-4" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={cn(
                      "w-16 h-0.5 mx-1 transition-all",
                      s < step ? "bg-success" : "bg-slate-200"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setStep(1)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                step === 1 ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <User className="w-4 h-4" />
              患者信息
            </button>
            <button
              onClick={() => canProceed() && setStep(2)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                step === 2 ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <FileImage className="w-4 h-4" />
              影像与参数
            </button>
            <button
              onClick={() => canProceed() && setStep(3)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                step === 3 ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Microscope className="w-4 h-4" />
              模拟配置
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">基本信息</h3>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    患者姓名 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={patientForm.name}
                    onChange={(e) => setPatientForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="请输入患者姓名"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    年龄 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    value={patientForm.age}
                    onChange={(e) => setPatientForm(p => ({ ...p, age: Number(e.target.value) }))}
                    min={0}
                    max={120}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    性别 <span className="text-danger">*</span>
                  </label>
                  <div className="flex gap-3">
                    {['male', 'female'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setPatientForm(p => ({ ...p, gender: g as Gender }))}
                        className={cn(
                          "flex-1 py-2.5 border rounded-lg text-sm font-medium transition-all",
                          patientForm.gender === g
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {g === 'male' ? '男' : '女'}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    癌症类型 <span className="text-danger">*</span>
                  </label>
                  <select
                    value={patientForm.cancerType}
                    onChange={(e) => setPatientForm(p => ({ ...p, cancerType: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                  >
                    {cancerTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    分期 <span className="text-danger">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {stages.map((s) => (
                      <button
                        key={s}
                        onClick={() => setPatientForm(p => ({ ...p, stage: s }))}
                        className={cn(
                          "px-4 py-2 border rounded-lg text-sm font-medium transition-all",
                          patientForm.stage === s
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">病理影像上传</h3>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="image-upload"
                    accept=".dcm,.png,.jpg,.jpeg,.tiff"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {uploadedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                          <Check className="w-6 h-6 text-success" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-slate-800">{uploadedFile}</p>
                          <p className="text-sm text-slate-500">点击更换文件</p>
                        </div>
                        <button
                          onClick={(e) => { e.preventDefault(); setUploadedFile(null); }}
                          className="ml-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-700 font-medium mb-1">点击或拖拽上传病理影像</p>
                        <p className="text-sm text-slate-400">支持 DICOM、PNG、JPEG、TIFF 格式</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">细胞参数配置</h3>
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { key: 'proliferationRate', label: '增殖速率', min: 0, max: 1, step: 0.01, unit: '' },
                    { key: 'apoptosisRate', label: '凋亡速率', min: 0, max: 1, step: 0.01, unit: '' },
                    { key: 'migrationRate', label: '迁移速率', min: 0, max: 1, step: 0.01, unit: '' },
                    { key: 'nutrientThreshold', label: '营养阈值', min: 0, max: 1, step: 0.01, unit: '' },
                    { key: 'oxygenThreshold', label: '氧合阈值', min: 0, max: 1, step: 0.01, unit: '' },
                  ].map(({ key, label, min, max, step }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700">{label}</label>
                        <span className="text-sm font-semibold text-primary">
                          {(cellParams[key as keyof CellParams] as number).toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={cellParams[key as keyof CellParams] as number}
                        onChange={(e) => setCellParams(c => ({ ...c, [key]: parseFloat(e.target.value) }))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">提示：</span>
                    细胞参数直接影响肿瘤生长模拟结果。建议根据病理报告和文献数据进行设置。
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">模拟配置</h3>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    模拟天数
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={7}
                      max={180}
                      value={simulationDays}
                      onChange={(e) => setSimulationDays(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="text-lg font-bold text-primary w-16 text-right">
                      {simulationDays}天
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-5">
                <h4 className="font-medium text-slate-800 mb-4">任务信息确认</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">患者姓名：</span>
                    <span className="font-medium text-slate-800">{patientForm.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">年龄/性别：</span>
                    <span className="font-medium text-slate-800">
                      {patientForm.age}岁 / {patientForm.gender === 'male' ? '男' : '女'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">癌症类型：</span>
                    <span className="font-medium text-slate-800">{patientForm.cancerType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">分期：</span>
                    <span className="font-medium text-slate-800">{patientForm.stage}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">病理影像：</span>
                    <span className="font-medium text-slate-800">{uploadedFile || '未上传'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">模拟周期：</span>
                    <span className="font-medium text-slate-800">{simulationDays}天</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-sm text-amber-700">
                  <span className="font-medium">注意：</span>
                  提交后系统将自动进入待校验状态，校验通过后开始模型构建和生长计算。
                  完整模拟过程可能需要数分钟时间，请耐心等待。
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
              step === 1
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-600 hover:bg-slate-200"
            )}
          >
            上一步
          </button>
          
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={cn(
                "px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
                canProceed()
                  ? "bg-primary text-white hover:bg-primary-light shadow-md hover:shadow-lg"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              下一步
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-primary hover:bg-primary-light text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  提交任务
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
