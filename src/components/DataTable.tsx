import React, { useState, useMemo } from 'react';
import { FilamentData } from '../types';

interface DataTableProps {
  data: FilamentData[];
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      
      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        } else {
          return null;
        }
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }

    if (sortConfig.direction === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const formatValue = (value: any, key: string) => {
    if (typeof value === 'number') {
      if (key.includes('Temperature') || key.includes('Price')) {
        return value.toFixed(1);
      }
      return value.toFixed(2);
    }
    return String(value);
  };

  if (data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No data to display
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 min-w-0">
        <div className="h-full w-full min-w-0 overflow-x-auto overflow-y-auto">
          <table
            className="min-w-max divide-y divide-gray-200"
            style={{ minWidth: `${columns.length * 150}px` }}
          >
        <thead className="bg-gray-50">
          <tr>
            {columns.map(column => (
              <th
                key={column}
                onClick={() => handleSort(column)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
              >
                <div className="flex items-center space-x-1">
                  <span>{column}</span>
                  {getSortIcon(column)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map(column => (
                <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatValue(row[column], column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default DataTable;