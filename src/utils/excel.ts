import * as XLSX from 'xlsx';
import { FilamentData } from '../types';

// Security and validation utilities
const sanitizeString = (value: any): string => {
  if (typeof value !== 'string') return String(value || '');
  
  // Remove potentially harmful characters and scripts
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
};

const sanitizeNumber = (value: any): number => {
  if (typeof value === 'number' && isFinite(value)) {
    return Number(value.toFixed(10)); // Limit precision to prevent overflow
  }
  
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, ''); // Keep only digits, dots, and minus
    const parsed = parseFloat(cleaned);
    return isFinite(parsed) ? Number(parsed.toFixed(10)) : 0;
  }
  
  return 0;
};

const validateUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  const cleaned = sanitizeString(url);
  
  // Only allow HTTP/HTTPS URLs from trusted domains
  try {
    const urlObj = new URL(cleaned);
    const allowedProtocols = ['http:', 'https:'];
    const trustedDomains = ['youtube.com', 'youtu.be', 'www.youtube.com'];
    
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return '';
    }
    
    const hostname = urlObj.hostname.toLowerCase();
    if (!trustedDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
      return '';
    }
    
    return cleaned;
  } catch {
    return ''; // Invalid URL format
  }
};

const validateAndSanitizeRow = (row: any, headerRow: string[]): FilamentData | null => {
  const sanitizedRow: any = {};
  
  headerRow.forEach((header, colIndex) => {
    if (!header || row[colIndex] === undefined || row[colIndex] === null) return;
    
    const value = row[colIndex];
    const cleanHeader = sanitizeString(header);
    
    // Skip suspicious or empty values
    if (value === 'undefined' || value === '' || cleanHeader === '') return;
    
    // Handle different data types based on column name patterns
    if (cleanHeader.toLowerCase().includes('link') || cleanHeader.toLowerCase().includes('url')) {
      // Validate URLs
      const sanitizedUrl = validateUrl(String(value));
      if (sanitizedUrl) {
        sanitizedRow[cleanHeader] = sanitizedUrl;
      }
    } else if (typeof value === 'number' || !isNaN(Number(String(value).trim()))) {
      // Handle numeric values
      sanitizedRow[cleanHeader] = sanitizeNumber(value);
    } else {
      // Handle string values
      const sanitizedString = sanitizeString(value);
      if (sanitizedString && sanitizedString.length <= 1000) { // Limit string length
        sanitizedRow[cleanHeader] = sanitizedString;
      }
    }
  });
  
  // Ensure required fields are present
  if (!sanitizedRow.Brand || !sanitizedRow['Filament type']) {
    return null; // Invalid row
  }
  
  return sanitizedRow as FilamentData;
};

export const parseExcelFile = async (file: File): Promise<FilamentData[]> => {
  // Validate file size (50MB limit)
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 50MB limit');
  }
  
  // Validate file type
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload an Excel file (.xlsx or .xls)');
  }
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
          .map((row) => validateAndSanitizeRow(row, headerRow))
          .filter((row): row is FilamentData => row !== null); // Only keep valid rows
        
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
  
  // Limit number of rows to prevent memory issues
  const MAX_ROWS = 10000;
  if (data.length > MAX_ROWS) {
    errors.push(`Too many rows: ${data.length}. Maximum allowed: ${MAX_ROWS}`);
    return errors;
  }
  
  // Check that we have basic columns - using actual column names from Excel
  const firstRow = data[0];
  const availableColumns = Object.keys(firstRow);
  
  // Validate column names
  const suspiciousColumns = availableColumns.filter(col =>
    col.includes('<') || col.includes('>') || col.includes('script') || col.length > 100
  );
  
  if (suspiciousColumns.length > 0) {
    errors.push(`Suspicious column names detected: ${suspiciousColumns.join(', ')}`);
  }
  
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
  
  // Validate data integrity - check for reasonable ranges
  const dataIssues: string[] = [];
  data.slice(0, 100).forEach((row, index) => { // Check first 100 rows for performance
    Object.entries(row).forEach(([key, value]) => {
      if (typeof value === 'number') {
        // Check for unreasonable numeric values
        if (!isFinite(value) || Math.abs(value) > 1e10) {
          dataIssues.push(`Row ${index + 1}, ${key}: unreasonable value ${value}`);
        }
      } else if (typeof value === 'string') {
        // Check for suspiciously long strings
        if (value.length > 500) {
          dataIssues.push(`Row ${index + 1}, ${key}: string too long (${value.length} chars)`);
        }
      }
    });
  });
  
  if (dataIssues.length > 0 && dataIssues.length <= 5) {
    errors.push(`Data quality issues: ${dataIssues.slice(0, 5).join('; ')}`);
  } else if (dataIssues.length > 5) {
    errors.push(`Multiple data quality issues detected (${dataIssues.length} issues)`);
  }
  
  console.log('Validation - Available columns:', availableColumns);
  console.log('Validation - Numeric columns found:', numericColumns);
  console.log('Validation - Rows processed:', data.length);
  
  return errors;
};