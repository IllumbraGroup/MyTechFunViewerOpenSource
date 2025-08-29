import * as XLSX from 'xlsx';
import { FilamentData } from '../types';

export const parseExcelFile = async (file: File): Promise<FilamentData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Try to find the main "Filaments" sheet first, otherwise use first sheet
        const sheetName = workbook.SheetNames.find(name => 
          name.toLowerCase().includes('filament') && !name.toLowerCase().includes('flexible')
        ) || workbook.SheetNames[0];
        
        const worksheet = workbook.Sheets[sheetName];
        
        // Get raw data as array of arrays to handle complex headers
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (rawData.length < 3) {
          throw new Error('Not enough data rows in Excel file');
        }
        
        // Find the header row (should be row 1, 0-indexed)
        const headerRow = rawData[1];
        if (!headerRow || headerRow.length === 0) {
          throw new Error('No header row found');
        }


        
        // Process data starting from row 2 (0-indexed)
        const dataRows = rawData.slice(2);
        
        const filamentData: FilamentData[] = dataRows
          .filter(row => {
            // Filter out empty rows
            if (!row || row.length === 0) return false;

            // Filter out rows that look like metadata or headers
            const rowText = row.join(' ').toLowerCase();
            if (rowText.includes('new rows') ||
                rowText.includes('orange bg') ||
                rowText.includes('metadata') ||
                rowText.includes('header') ||
                rowText.includes('note:') ||
                rowText.includes('comment')) {
              return false;
            }

            // Filter out rows with too many undefined/null values
            const definedValues = row.filter(cell => cell !== undefined && cell !== null && cell !== '');
            if (definedValues.length < 2) return false; // Need at least 2 meaningful values

            // Ensure Brand column (index 1) exists and is not undefined
            return row[1] && String(row[1]).trim() !== '' && String(row[1]).toLowerCase() !== 'undefined';
          })
          .map((row) => {
            const processedRow: any = {};
            
            headerRow.forEach((header, colIndex) => {
              if (header && row[colIndex] !== undefined && row[colIndex] !== null) {
                const value = row[colIndex];
                const cleanHeader = String(header).trim();

                // Skip cells that are "undefined" strings or empty strings
                if (value === 'undefined' || value === '') {
                  return;
                }

                if (typeof value === 'number') {
                  processedRow[cleanHeader] = value;
                } else if (typeof value === 'string') {
                  const trimmedValue = value.trim();
                  // Skip "undefined" strings and empty values
                  if (trimmedValue === '' || trimmedValue.toLowerCase() === 'undefined') {
                    return;
                  }
                  // Try to convert numeric strings to numbers
                  if (!isNaN(Number(trimmedValue)) && trimmedValue !== '') {
                    processedRow[cleanHeader] = Number(trimmedValue);
                  } else {
                    processedRow[cleanHeader] = trimmedValue;
                  }
                } else {
                  processedRow[cleanHeader] = value;
                }
              }
            });
            
            return processedRow as FilamentData;
          })
          .filter(row => row.Brand); // Only keep rows with Brand data
        
        console.log('Raw data rows:', rawData.length);
        console.log('Data rows after filtering:', dataRows.length);
        console.log('Parsed filament data:', filamentData.length, 'rows');

        // Log any rows that were filtered out for debugging
        const filteredOutCount = dataRows.length - filamentData.length;
        if (filteredOutCount > 0) {
          console.log(`Filtered out ${filteredOutCount} rows during processing`);
        }

        if (filamentData.length > 0) {
          console.log('Sample columns:', Object.keys(filamentData[0]));
          console.log('First row:', filamentData[0]);
          console.log('Last row:', filamentData[filamentData.length - 1]);
        }
        
        resolve(filamentData);
      } catch (error) {
        console.error('Excel parsing error:', error);
        reject(new Error(`Failed to parse Excel file: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export const validateExcelData = (data: FilamentData[]): string[] => {
  const errors: string[] = [];
  
  if (data.length === 0) {
    errors.push('No data found in the Excel file');
    return errors;
  }
  
  // Check that we have basic columns - using actual column names from Excel
  const firstRow = data[0];
  const availableColumns = Object.keys(firstRow);
  
  // Required columns that should exist (using actual Excel column names)
  const requiredColumns = ['Brand', 'Filament type'];
  
  requiredColumns.forEach(column => {
    if (!(column in firstRow)) {
      errors.push(`Missing required column: ${column}`);
    }
  });
  
  // Check that we have some numeric data columns
  const numericColumns = availableColumns.filter(col => 
    typeof firstRow[col] === 'number' && 
    (col.includes('Tensile') || col.includes('Layer') || col.includes('IZOD'))
  );
  
  if (numericColumns.length === 0) {
    errors.push('No numeric measurement columns found');
  }
  
  console.log('Validation - Available columns:', availableColumns);
  console.log('Validation - Numeric columns found:', numericColumns);
  
  return errors;
};