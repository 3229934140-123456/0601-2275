import type { CellParams, SimulationData, DensityMap, SurvivalPoint, TreatmentPlan } from '../../shared/types';

const GRID_SIZE = 50;
const INITIAL_VOLUME_BASE = 12.5;

function generateDensityMap(day: number, volume: number, necrosisRatio: number): DensityMap {
  const size = GRID_SIZE;
  const data: number[][] = [];
  const center = size / 2;
  const radiusFactor = Math.sqrt(volume / INITIAL_VOLUME_BASE) * (size * 0.3);
  
  let maxVal = 0;
  let minVal = 1;
  
  for (let i = 0; i < size; i++) {
    const row: number[] = [];
    for (let j = 0; j < size; j++) {
      const dist = Math.sqrt(Math.pow(i - center, 2) + Math.pow(j - center, 2));
      
      if (dist < radiusFactor * 0.3) {
        const val = 0.1 + necrosisRatio * 0.8 + (Math.random() - 0.5) * 0.1;
        row.push(Math.max(0, Math.min(1, val)));
      } else if (dist < radiusFactor) {
        const gradient = 1 - (dist - radiusFactor * 0.3) / (radiusFactor * 0.7);
        const noise = (Math.random() - 0.5) * 0.15;
        const val = Math.max(0.2, Math.min(0.95, gradient * 0.8 + 0.2 + noise));
        row.push(val);
      } else {
        const val = Math.max(0, 0.05 + (Math.random() - 0.5) * 0.08);
        row.push(val);
      }
      if (row[j] > maxVal) maxVal = row[j];
      if (row[j] < minVal) minVal = row[j];
    }
    data.push(row);
  }
  
  return { day, data, minValue: minVal, maxValue: maxVal };
}

function generateSurvivalCurve(days: number, finalVolume: number, hasTreatment: boolean): SurvivalPoint[] {
  const points: SurvivalPoint[] = [];
  const baseSurvival = hasTreatment ? 0.75 : 0.45;
  const volumeFactor = Math.min(1, 30 / Math.max(finalVolume, 10));
  
  for (let t = 0; t <= 60; t += 2) {
    const decay = Math.exp(-t * 0.015 * (1 - volumeFactor * 0.5));
    const survival = Math.max(0.05, baseSurvival * decay + (Math.random() - 0.5) * 0.03);
    points.push({ time: t, survivalRate: Math.min(1, Math.max(0, survival)) });
  }
  
  return points;
}

export function runSimulation(
  cellParams: CellParams,
  initialVolume: number,
  days: number,
  treatmentPlan?: TreatmentPlan
): SimulationData {
  const timeline: number[] = [];
  const volumes: number[] = [];
  const necrosisRatios: number[] = [];
  const growthRates: number[] = [];
  const cellDensityMaps: DensityMap[] = [];
  
  let currentVolume = initialVolume;
  let currentNecrosis = 0.05;
  let prevVolume = initialVolume;
  
  const netGrowthRate = cellParams.proliferationRate - cellParams.apoptosisRate;
  const baselineRate = netGrowthRate * 0.02;
  
  let treatmentEffect = 0;
  if (treatmentPlan) {
    const chemoEffect = treatmentPlan.chemotherapy.reduce((sum, c) => sum + c.dose * 0.001, 0);
    const radioEffect = treatmentPlan.radiotherapy.reduce((sum, r) => sum + r.dose * 0.003, 0);
    treatmentEffect = chemoEffect + radioEffect;
  }
  
  for (let day = 0; day <= days; day++) {
    timeline.push(day);
    volumes.push(parseFloat(currentVolume.toFixed(3)));
    necrosisRatios.push(parseFloat(currentNecrosis.toFixed(4)));
    
    const growthRate = (currentVolume - prevVolume) / Math.max(prevVolume, 0.001) * 100;
    growthRates.push(parseFloat(growthRate.toFixed(4)));
    
    if (day % Math.max(1, Math.floor(days / 8)) === 0) {
      cellDensityMaps.push(generateDensityMap(day, currentVolume, currentNecrosis));
    }
    
    prevVolume = currentVolume;
    
    const nutrientFactor = Math.max(0.3, 1 - currentNecrosis * 0.8);
    const dailyGrowth = baselineRate * currentVolume * nutrientFactor * (1 + (Math.random() - 0.5) * 0.15);
    
    let adjustedGrowth = dailyGrowth;
    if (treatmentPlan && day > days * 0.2) {
      const treatmentPhase = Math.min(1, (day - days * 0.2) / (days * 0.3));
      adjustedGrowth = dailyGrowth * (1 - treatmentEffect * treatmentPhase);
      
      if (day > days * 0.35) {
        currentNecrosis = Math.min(0.8, currentNecrosis + treatmentEffect * 0.008 * (1 - currentNecrosis * 0.7));
      }
    }
    
    currentVolume = Math.max(1, currentVolume + adjustedGrowth);
    
    if (currentVolume > 30) {
      currentNecrosis = Math.min(0.9, currentNecrosis + 0.003 * (currentVolume / 50));
    } else if (currentVolume < 15 && currentNecrosis > 0.1) {
      currentNecrosis = Math.max(0.05, currentNecrosis - 0.001);
    }
    
    currentNecrosis += (Math.random() - 0.5) * 0.005;
    currentNecrosis = Math.max(0.02, Math.min(0.95, currentNecrosis));
  }
  
  const survivalCurve = generateSurvivalCurve(days, currentVolume, !!treatmentPlan);
  
  return {
    timeline,
    volumes,
    necrosisRatios,
    growthRates,
    cellDensityMaps,
    survivalCurve,
  };
}

export function stepSimulation(
  currentVolume: number,
  currentNecrosis: number,
  cellParams: CellParams,
  day: number,
  totalDays: number,
  treatmentPlan?: TreatmentPlan
): { volume: number; necrosis: number; growthRate: number } {
  const netGrowthRate = cellParams.proliferationRate - cellParams.apoptosisRate;
  const baselineRate = netGrowthRate * 0.02;
  
  let treatmentEffect = 0;
  if (treatmentPlan) {
    const chemoEffect = treatmentPlan.chemotherapy.reduce((sum, c) => sum + c.dose * 0.001, 0);
    const radioEffect = treatmentPlan.radiotherapy.reduce((sum, r) => sum + r.dose * 0.003, 0);
    treatmentEffect = chemoEffect + radioEffect;
  }
  
  const nutrientFactor = Math.max(0.3, 1 - currentNecrosis * 0.8);
  const dailyGrowth = baselineRate * currentVolume * nutrientFactor * (1 + (Math.random() - 0.5) * 0.2);
  
  let adjustedGrowth = dailyGrowth;
  let newNecrosis = currentNecrosis;
  
  if (treatmentPlan && day > totalDays * 0.2) {
    const treatmentPhase = Math.min(1, (day - totalDays * 0.2) / (totalDays * 0.3));
    adjustedGrowth = dailyGrowth * (1 - treatmentEffect * treatmentPhase);
    
    if (day > totalDays * 0.35) {
      newNecrosis = Math.min(0.8, currentNecrosis + treatmentEffect * 0.008 * (1 - currentNecrosis * 0.7));
    }
  }
  
  const newVolume = Math.max(1, currentVolume + adjustedGrowth);
  
  if (newVolume > 30) {
    newNecrosis = Math.min(0.9, newNecrosis + 0.003 * (newVolume / 50));
  }
  
  newNecrosis += (Math.random() - 0.5) * 0.005;
  newNecrosis = Math.max(0.02, Math.min(0.95, newNecrosis));
  
  const growthRate = (newVolume - currentVolume) / Math.max(currentVolume, 0.001) * 100;
  
  return {
    volume: parseFloat(newVolume.toFixed(3)),
    necrosis: parseFloat(newNecrosis.toFixed(4)),
    growthRate: parseFloat(growthRate.toFixed(4)),
  };
}
