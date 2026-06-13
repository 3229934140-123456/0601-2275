import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface EChartsProps {
  option: any;
  style?: React.CSSProperties;
  className?: string;
}

export default function EChartsChart({ option, style, className }: EChartsProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    chartInstance.current = echarts.init(chartRef.current);
    
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);
  
  useEffect(() => {
    if (chartInstance.current && option) {
      chartInstance.current.setOption(option, true);
    }
  }, [option]);
  
  return (
    <div ref={chartRef} style={style} className={className} />
  );
}
