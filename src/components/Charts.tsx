import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { FilamentData } from '../types';
import { calculateLinearRegression, normalizeMinMax } from '../utils/statistics';

interface ChartsProps {
  data: FilamentData[];
  chartType: 'scatter' | 'bar' | 'radar';
  xAxis?: string;
  yAxis?: string;
}

const Charts: React.FC<ChartsProps> = ({ data, chartType, xAxis, yAxis }) => {
  const numericColumns = React.useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(key => typeof data[0][key] === 'number');
  }, [data]);

  const scatterData = React.useMemo(() => {
    if (!xAxis || !yAxis || data.length === 0) return [];
    
    return data
      .filter(d => 
        typeof d[xAxis] === 'number' && 
        typeof d[yAxis] === 'number' &&
        !isNaN(d[xAxis] as number) && 
        !isNaN(d[yAxis] as number)
      )
      .map(d => ({
        x: d[xAxis] as number,
        y: d[yAxis] as number,
        brand: d.Brand,
        filamentType: d['Filament type'],
        name: `${d.Brand} ${d['Filament type']}`
      }));
  }, [data, xAxis, yAxis]);

  const barData = React.useMemo(() => {
    if (data.length === 0 || numericColumns.length === 0) return [];

    const groupedByBaseMaterial: { [key: string]: FilamentData[] } = {};

    data.forEach(d => {
      // Check multiple possible base material field names
      const baseMaterial = d.Base || d['Base Material'] || d['Material'];

      // Skip entries with undefined/null/empty Base values
      if (!baseMaterial || baseMaterial === '' || baseMaterial === 'undefined') {
        return; // Skip this entry entirely
      }

      if (!groupedByBaseMaterial[baseMaterial]) {
        groupedByBaseMaterial[baseMaterial] = [];
      }
      groupedByBaseMaterial[baseMaterial].push(d);
    });

    return Object.entries(groupedByBaseMaterial).map(([material, items]) => {
      const result: any = { material };
      
      numericColumns.slice(0, 5).forEach(column => {
        const values = items
          .map(item => item[column] as number)
          .filter(val => !isNaN(val));
        
        if (values.length > 0) {
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          result[column] = Number(mean.toFixed(2));
        }
      });
      
      return result;
    });
  }, [data, numericColumns]);

  const radarData = React.useMemo(() => {
    if (data.length === 0 || numericColumns.length < 3) return [];

    const topFilaments = data
      .slice()
      .sort((a, b) => {
        const aScore = (a['Tensile (kg)'] as number || 0) +
                      (a['Layer adhesion (kg)'] as number || 0);
        const bScore = (b['Tensile (kg)'] as number || 0) +
                      (b['Layer adhesion (kg)'] as number || 0);
        return bScore - aScore;
      })
      .slice(0, 3);

    const keyColumns = numericColumns.slice(0, 6);

    // Store filament info for tooltips
    const filamentInfo = topFilaments.map(f => ({
      name: `${f.Brand} ${f['Filament type']}`,
      brand: f.Brand,
      type: f['Filament type'],
      base: f.Base
    }));
    
        const chartData = keyColumns.map(column => {
      const result: any = {
        property: column.replace(/\s*\([^)]*\)/, ''),
        originalColumnName: column
      };

      const allValues = data
        .map(d => d[column] as number)
        .filter(val => !isNaN(val));

      const normalized = normalizeMinMax(allValues);

      topFilaments.forEach((filament, index) => {
        const value = filament[column] as number;
        const normalizedValue = allValues.includes(value)
          ? normalized[allValues.indexOf(value)]
          : 0;
        result[`filament${index + 1}`] = Number(normalizedValue.toFixed(1));
        // Store the actual value for tooltips
        result[`actual_filament${index + 1}`] = value;
      });

      return result;
    });

    return {
      data: chartData,
      filaments: filamentInfo
    };
  }, [data, numericColumns]);

  const regressionLine = React.useMemo(() => {
    if (scatterData.length < 2) return null;
    
    const xValues = scatterData.map(d => d.x);
    const yValues = scatterData.map(d => d.y);
    
    return calculateLinearRegression(xValues, yValues);
  }, [scatterData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-blue-600">{`${xAxis}: ${data.x}`}</p>
          <p className="text-sm text-green-600">{`${yAxis}: ${data.y}`}</p>
        </div>
      );
    }
    return null;
  };

  const RadarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && radarData?.filaments) {
      const data = payload[0].payload;
      const property = data.property;

      return (
        <div className="bg-white p-3 border rounded shadow-lg max-w-xs">
          <p className="font-semibold text-gray-900 mb-2">{property}</p>
          {payload.map((entry: any, index: number) => {
            const filamentIndex = entry.dataKey.replace('filament', '') - 1;
            const filament = radarData.filaments[filamentIndex];
            const actualValue = data[`actual_filament${filamentIndex + 1}`];
            const normalizedValue = entry.value;

            if (!filament) return null;

            return (
              <div key={index} className="mb-2">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium">{filament.name}</span>
                </div>
                <div className="ml-5 text-xs text-gray-600 space-y-1">
                  <div>Base material: <span className="font-medium">{filament.base || 'N/A'}</span></div>
                  <div>Actual value: <span className="font-medium">{actualValue?.toFixed(2) || 'N/A'}</span></div>
                  <div>Normalized score: <span className="font-medium">{normalizedValue}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No data available for visualization
      </div>
    );
  }

  switch (chartType) {
    case 'scatter':
      if (!xAxis || !yAxis || scatterData.length === 0) {
        return (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Please select X and Y axes for scatter plot
          </div>
        );
      }

      return (
        <div className="h-full">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">
              {yAxis} vs {xAxis}
            </h3>
            {regressionLine && (
              <p className="text-sm text-gray-600">
                R² = {regressionLine.rSquared.toFixed(4)} | 
                y = {regressionLine.slope.toFixed(3)}x + {regressionLine.intercept.toFixed(3)}
              </p>
            )}
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <ScatterChart data={scatterData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                name={xAxis} 
                type="number"
                domain={['dataMin', 'dataMax']}
              />
              <YAxis 
                dataKey="y" 
                name={yAxis} 
                type="number"
                domain={['dataMin', 'dataMax']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter dataKey="y" fill="#3B82F6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      );

    case 'bar':
      return (
        <div className="h-full">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Average Properties by Base Material</h3>
            <p className="text-sm text-gray-600">Showing filaments with valid base material data only</p>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="material" />
              <YAxis />
              <Tooltip />
              <Legend />
              {numericColumns.slice(0, 5).map((column, index) => (
                <Bar 
                  key={column}
                  dataKey={column} 
                  fill={`hsl(${index * 60}, 70%, 50%)`}
                  name={column.replace(/\s*\([^)]*\)/, '')}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      );

    case 'radar':
      if (!radarData || !radarData.data || radarData.data.length === 0) {
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <p>Not enough data for radar chart</p>
              <p className="text-sm">Need at least 3 filaments with numeric properties</p>
            </div>
          </div>
        );
      }

      return (
        <div className="h-full">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Top 3 Filaments Comparison</h3>
            <p className="text-sm text-gray-600">Normalized performance metrics (0-100 scale)</p>
            <div className="mt-2 space-y-1">
              {radarData.filaments.map((filament, index) => (
                <div key={index} className="flex items-center text-sm">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{
                      backgroundColor: ['#3B82F6', '#EF4444', '#10B981'][index]
                    }}
                  />
                  <span className="font-medium">{filament.name}</span>
                  <span className="ml-2 text-gray-500">({filament.base})</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <RadarChart data={radarData.data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="property" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Tooltip content={<RadarTooltip />} />
              {radarData.filaments.map((filament, index) => (
                <Radar
                  key={index}
                  name={filament.name}
                  dataKey={`filament${index + 1}`}
                  stroke={['#3B82F6', '#EF4444', '#10B981'][index]}
                  fill={['#3B82F6', '#EF4444', '#10B981'][index]}
                  fillOpacity={0.1}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      );

    default:
      return <div>Unknown chart type</div>;
  }
};

export default Charts;