// Statistical utility functions for data analysis

export const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
  const n = x.length;
  if (n !== y.length || n < 2) return 0;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
};

export const calculateLinearRegression = (x: number[], y: number[]): { slope: number; intercept: number; rSquared: number } => {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 };
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const correlation = calculatePearsonCorrelation(x, y);
  const rSquared = correlation * correlation;
  
  return { slope, intercept, rSquared };
};

export const calculateStatistics = (values: number[]) => {
  if (values.length === 0) return null;
  
  const sorted = [...values].sort((a, b) => a - b);
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  const q1Index = Math.floor(n * 0.25);
  const medianIndex = Math.floor(n * 0.5);
  const q3Index = Math.floor(n * 0.75);
  
  return {
    mean,
    median: sorted[medianIndex],
    stdDev,
    q1: sorted[q1Index],
    q3: sorted[q3Index],
    min: sorted[0],
    max: sorted[n - 1],
    count: n
  };
};

export const normalizeMinMax = (values: number[]): number[] => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  if (range === 0) return values.map(() => 0);
  
  return values.map(val => ((val - min) / range) * 100);
};

export const normalizeZScore = (values: number[]): number[] => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return values.map(() => 0);
  
  return values.map(val => (val - mean) / stdDev);
};

export const detectOutliers = (values: number[]): boolean[] => {
  const stats = calculateStatistics(values);
  if (!stats) return values.map(() => false);
  
  const iqr = stats.q3 - stats.q1;
  const lowerFence = stats.q1 - 1.5 * iqr;
  const upperFence = stats.q3 + 1.5 * iqr;
  
  return values.map(val => val < lowerFence || val > upperFence);
};