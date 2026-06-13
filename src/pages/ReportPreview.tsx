import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EChartsChart from '../components/EChartsChart';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Activity,
  AlertTriangle,
  Calendar,
  User,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import type { ReportData } from '@shared/types';

export default function ReportPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchReport, exportData } = useTaskStore();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportStage, setExportStage] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<string>('json');
  
  useEffect(() => {
    if (id) {
      loadReport();
    }
  }, [id]);
  
  const loadReport = async () => {
    setLoading(true);
    const data = await fetchReport(id!);
    setReport(data);
    setLoading(false);
  };
  
  const handleExport = () => {
    if (id) {
      exportData(id, exportFormat, exportStage === 'all' ? undefined : exportStage);
    }
  };
  
  const generatePDF = () => {
    alert('PDF报告生成中，这是模拟功能');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!report) {
    return (
      <div className="text-center py-16">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">报告数据加载失败</p>
      </div>
    );
  }
  
  const volumeChartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: report.simulationData.timeline, name: '天数' },
    yAxis: { type: 'value', name: '体积 (cm³)' },
    series: [{
      data: report.simulationData.volumes,
      type: 'line',
      smooth: true,
      lineStyle: { color: '#0B3D91', width: 2 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(11, 61, 145, 0.3)' },
            { offset: 1, color: 'rgba(11, 61, 145, 0.02)' },
          ],
        },
      },
      itemStyle: { color: '#0B3D91' },
    }],
  };
  
  const necrosisChartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: report.simulationData.timeline, name: '天数' },
    yAxis: { type: 'value', name: '坏死比例 (%)' },
    series: [{
      data: report.simulationData.necrosisRatios.map(v => (v * 100).toFixed(1)),
      type: 'line',
      smooth: true,
      lineStyle: { color: '#FF9500', width: 2 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(255, 149, 0, 0.3)' },
            { offset: 1, color: 'rgba(255, 149, 0, 0.02)' },
          ],
        },
      },
      itemStyle: { color: '#FF9500' },
    }],
  };
  
  const survivalChartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: report.simulationData.survivalCurve.map(p => p.time), name: '月' },
    yAxis: { type: 'value', name: '生存率 (%)', max: 100 },
    series: [{
      data: report.simulationData.survivalCurve.map(p => (p.survivalRate * 100).toFixed(1)),
      type: 'line',
      smooth: true,
      step: 'end',
      lineStyle: { color: '#34C759', width: 3 },
      itemStyle: { color: '#34C759' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(52, 199, 89, 0.2)' },
            { offset: 1, color: 'rgba(52, 199, 89, 0.02)' },
          ],
        },
      },
    }],
  };
  
  const heatmapData = report.simulationData.cellDensityMaps?.[
    Math.floor(report.simulationData.cellDensityMaps.length / 2)
  ];
  
  const heatmapOption = heatmapData ? {
    tooltip: { formatter: (params: any) => `细胞密度: ${(params.value[2] * 100).toFixed(1)}%` },
    grid: { left: '10%', right: '10%', top: '5%', bottom: '15%' },
    xAxis: { type: 'category', data: heatmapData.data[0]?.map((_, i) => i), show: false },
    yAxis: { type: 'category', data: heatmapData.data.map((_, i) => i), show: false },
    visualMap: {
      min: 0, max: 1, calculable: true, orient: 'horizontal',
      left: 'center', bottom: '0%',
      inRange: { color: ['#e0f7fa', '#00acc1', '#006064', '#b71c1c'] },
    },
    series: [{
      name: '细胞密度', type: 'heatmap',
      data: heatmapData.data.flatMap((row, i) => row.map((val, j) => [j, i, val])),
      label: { show: false },
    }],
  } : {};
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">模拟报告</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {report.patient.name} · {report.patient.cancerType} · {report.patient.stage}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-all font-medium text-sm"
          >
            <FileText className="w-4 h-4" />
            生成PDF
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-light text-white rounded-lg transition-all font-medium text-sm shadow-md hover:shadow-lg"
          >
            <Download className="w-4 h-4" />
            导出数据
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-1">肿瘤生长模拟报告</h3>
          <p className="text-sm text-slate-500">
            生成时间：{new Date(report.generatedAt).toLocaleString('zh-CN')}
          </p>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4">
            <div className="flex items-center gap-2 text-primary/70 text-sm mb-2">
              <Activity className="w-4 h-4" />
              初始体积
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {report.summary.initialVolume.toFixed(2)}
              <span className="text-sm font-normal text-slate-400 ml-1">cm³</span>
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-warning/10 to-warning/5 rounded-xl p-4">
            <div className="flex items-center gap-2 text-warning/70 text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              最终体积
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {report.summary.finalVolume.toFixed(2)}
              <span className="text-sm font-normal text-slate-400 ml-1">cm³</span>
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-danger/10 to-danger/5 rounded-xl p-4">
            <div className="flex items-center gap-2 text-danger/70 text-sm mb-2">
              <AlertTriangle className="w-4 h-4" />
              体积变化
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {report.summary.volumeChange > 0 ? '+' : ''}{report.summary.volumeChange.toFixed(2)}
              <span className="text-sm font-normal text-slate-400 ml-1">cm³</span>
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-xl p-4">
            <div className="flex items-center gap-2 text-success/70 text-sm mb-2">
              <Calendar className="w-4 h-4" />
              模拟周期
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {report.summary.simulationDays}
              <span className="text-sm font-normal text-slate-400 ml-1">天</span>
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h4 className="font-medium text-slate-800 mb-3">肿瘤体积变化曲线</h4>
            <EChartsChart option={volumeChartOption} style={{ height: '280px' }} />
          </div>
          <div>
            <h4 className="font-medium text-slate-800 mb-3">坏死核心比例变化</h4>
            <EChartsChart option={necrosisChartOption} style={{ height: '280px' }} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h4 className="font-medium text-slate-800 mb-3">细胞密度热图（中期）</h4>
            <EChartsChart option={heatmapOption} style={{ height: '300px' }} />
          </div>
          <div>
            <h4 className="font-medium text-slate-800 mb-3">预测生存曲线</h4>
            <EChartsChart option={survivalChartOption} style={{ height: '300px' }} />
          </div>
        </div>
        
        {report.treatmentPlan && (
          <div className="border-t border-slate-100 pt-6">
            <h4 className="font-medium text-slate-800 mb-4">治疗方案</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-slate-700 mb-2">化疗方案</h5>
                {report.treatmentPlan.chemotherapy.map((chemo, i) => (
                  <div key={i} className="text-sm text-slate-600">
                    {chemo.drug} - {chemo.dose}{chemo.unit}，{chemo.frequency}，共{chemo.cycles}周期
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-slate-700 mb-2">放疗方案</h5>
                {report.treatmentPlan.radiotherapy.map((radio, i) => (
                  <div key={i} className="text-sm text-slate-600">
                    {radio.dose}Gy / {radio.fractions}次，{radio.frequency}，靶区：{radio.targetVolume}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-xl shadow-card p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">数据导出</h3>
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">导出分期</label>
            <select
              value={exportStage}
              onChange={(e) => setExportStage(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">全周期</option>
              <option value="early">早期</option>
              <option value="middle">中期</option>
              <option value="late">晚期</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">导出格式</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            导出全场生长数据
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          <Layers className="w-3 h-3 inline mr-1" />
          全场数据包含体积、坏死比例、细胞密度分布等完整模拟结果
        </p>
      </div>
    </div>
  );
}
