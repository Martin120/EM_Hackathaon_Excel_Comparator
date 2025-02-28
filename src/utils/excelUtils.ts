import * as XLSX from 'xlsx-js-style';
import { Employee, ComparisonResult } from '../types';

// Map Excel column names to our standardized property names
const columnMapping: { [key: string]: string } = {
  // First Name mappings
  'First Name': 'firstName',
  'FirstName': 'firstName',
  'first name': 'firstName',
  'firstname': 'firstName',
  'first_name': 'firstName',
  'First': 'firstName',
  'FIRST NAME': 'firstName',
  'FIRSTNAME': 'firstName',
  'First name': 'firstName',
  
  // Last Name mappings
  'Last Name': 'lastName',
  'LastName': 'lastName',
  'last name': 'lastName',
  'lastname': 'lastName',
  'last_name': 'lastName',
  'Last': 'lastName',
  'LAST NAME': 'lastName',
  'LASTNAME': 'lastName',
  'Last name': 'lastName',
  
  // DOB mappings
  'Date of Birth': 'dob',
  'DateOfBirth': 'dob',
  'DOB': 'dob',
  'dob': 'dob',
  'date_of_birth': 'dob',
  'Birth Date': 'dob',
  'birthdate': 'dob',
  'Birth': 'dob',
  'Date': 'dob',
  'DATE OF BIRTH': 'dob',
  'BIRTH DATE': 'dob',
  'Date of birth': 'dob',
  
  // Gender mappings
  'Gender': 'gender',
  'gender': 'gender',
  'sex': 'gender',
  'Sex': 'gender',
  'GENDER': 'gender',
  'SEX': 'gender',
  
  // Relationship mappings
  'Relationship': 'relationship',
  'relationship': 'relationship',
  'relation': 'relationship',
  'Relation': 'relationship',
  'RelationshipType': 'relationship',
  'Relationship Type': 'relationship',
  'Type': 'relationship',
  'RELATIONSHIP': 'relationship',
  'RELATION': 'relationship',
  'Relationship type': 'relationship',
  'Rel': 'relationship',
  'REL': 'relationship',
  'Rel Type': 'relationship',
  'Rel Status': 'relationship',
  'Status': 'relationship',
  'Member Type': 'relationship',
  'MemberType': 'relationship',
  'Member': 'relationship',
  'Subscriber': 'relationship',
  'Spouse': 'relationship',
  'Child': 'relationship',
  'Dependent': 'relationship',
  
  // Enrollment Tier mappings
  'Enrollment Tier': 'enrollmentTier',
  'EnrollmentTier': 'enrollmentTier',
  'Tier': 'enrollmentTier',
  'tier': 'enrollmentTier',
  'enrollment tier': 'enrollmentTier',
  'enrollment_tier': 'enrollmentTier',
  'Plan': 'enrollmentTier',
  'plan': 'enrollmentTier',
  'Coverage': 'enrollmentTier',
  'coverage': 'enrollmentTier',
  'Level': 'enrollmentTier',
  'level': 'enrollmentTier',
  'ENROLLMENT TIER': 'enrollmentTier',
  'TIER': 'enrollmentTier',
  'PLAN': 'enrollmentTier',
  'Plan Type': 'enrollmentTier',
  'PlanType': 'enrollmentTier',
  'Coverage Type': 'enrollmentTier',
  'CoverageType': 'enrollmentTier',
  'Benefit': 'enrollmentTier',
  'Benefit Plan': 'enrollmentTier',
  'BenefitPlan': 'enrollmentTier',
  'Medical Plan': 'enrollmentTier',
  'MedicalPlan': 'enrollmentTier',
  'Insurance': 'enrollmentTier',
  'Insurance Plan': 'enrollmentTier'
};

// Keys to use for comparison
const comparisonKeys = ['firstName', 'lastName', 'dob', 'gender', 'relationship', 'enrollmentTier'];

// Debug function to log the structure of the Excel file
const debugExcelStructure = (worksheet: XLSX.WorkSheet): void => {
  console.log('Excel Structure:');
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  
  // Get header row
  const headers: string[] = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = worksheet[XLSX.utils.encode_cell({r: range.s.r, c: C})];
    headers.push(cell ? String(cell.v) : '');
  }
  
  console.log('Headers:', headers);
  
  // Log first data row as sample
  if (range.e.r > range.s.r) {
    const firstRow = {} as Record<string, unknown>;
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const header = headers[C - range.s.c] || `Column${C}`;
      const cell = worksheet[XLSX.utils.encode_cell({r: range.s.r + 1, c: C})];
      firstRow[header] = cell ? cell.v : '';
    }
    console.log('First Row Sample:', firstRow);
  }
};

// Near the top of the file, add:
interface HeadersMap {
  [key: string]: any;
}

// Try multiple methods to parse Excel file
export const parseExcelFile = (file: File): Promise<Employee[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Assume first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Debug the Excel structure
        debugExcelStructure(worksheet);
        
        // Try multiple parsing methods
        let employees: Employee[] = [];
        
        // Method 1: Parse with headers (standard method)
        try {
          employees = parseWithHeaders(worksheet);
          console.log("Method 1 (Headers) parsed", employees.length, "employees");
          
          if (employees.length > 0 && isValidEmployeeData(employees)) {
            console.log("Using Method 1 results");
            
            // Check if relationship and enrollmentTier are missing
            const missingRelationship = employees.every(emp => !emp.relationship);
            const missingEnrollmentTier = employees.every(emp => !emp.enrollmentTier);
            
            if (missingRelationship || missingEnrollmentTier) {
              console.log("Missing relationship or enrollmentTier, trying to infer from other columns");
              employees = inferMissingColumns(worksheet, employees);
            }
            
            resolve(employees);
            return;
          }
        } catch (err) {
          console.warn("Method 1 failed:", err);
        }
        
        // Method 2: Parse with automatic header detection
        try {
          employees = parseWithAutoHeaders(worksheet);
          console.log("Method 2 (Auto Headers) parsed", employees.length, "employees");
          
          if (employees.length > 0 && isValidEmployeeData(employees)) {
            console.log("Using Method 2 results");
            
            // Check if relationship and enrollmentTier are missing
            const missingRelationship = employees.every(emp => !emp.relationship);
            const missingEnrollmentTier = employees.every(emp => !emp.enrollmentTier);
            
            if (missingRelationship || missingEnrollmentTier) {
              console.log("Missing relationship or enrollmentTier, trying to infer from other columns");
              employees = inferMissingColumns(worksheet, employees);
            }
            
            resolve(employees);
            return;
          }
        } catch (err) {
          console.warn("Method 2 failed:", err);
        }
        
        // Method 3: Parse raw data and guess columns
        try {
          employees = parseRawData(worksheet);
          console.log("Method 3 (Raw Data) parsed", employees.length, "employees");
          
          if (employees.length > 0 && isValidEmployeeData(employees)) {
            console.log("Using Method 3 results");
            
            // Check if relationship and enrollmentTier are missing
            const missingRelationship = employees.every(emp => !emp.relationship);
            const missingEnrollmentTier = employees.every(emp => !emp.enrollmentTier);
            
            if (missingRelationship || missingEnrollmentTier) {
              console.log("Missing relationship or enrollmentTier, trying to infer from other columns");
              employees = inferMissingColumns(worksheet, employees);
            }
            
            resolve(employees);
            return;
          }
        } catch (err) {
          console.warn("Method 3 failed:", err);
        }
        
        // Method 4: Try to parse with fuzzy column matching
        try {
          employees = parseWithFuzzyMatching(worksheet);
          console.log("Method 4 (Fuzzy Matching) parsed", employees.length, "employees");
          
          if (employees.length > 0) {
            console.log("Using Method 4 results");
            
            // Check if relationship and enrollmentTier are missing
            const missingRelationship = employees.every(emp => !emp.relationship);
            const missingEnrollmentTier = employees.every(emp => !emp.enrollmentTier);
            
            if (missingRelationship || missingEnrollmentTier) {
              console.log("Missing relationship or enrollmentTier, trying to infer from other columns");
              employees = inferMissingColumns(worksheet, employees);
            }
            
            resolve(employees);
            return;
          }
        } catch (err) {
          console.warn("Method 4 failed:", err);
        }
        
        // Method 5: Direct column access
        try {
          employees = parseWithDirectColumnAccess(worksheet);
          console.log("Method 5 (Direct Column Access) parsed", employees.length, "employees");
          
          if (employees.length > 0) {
            console.log("Using Method 5 results");
            resolve(employees);
            return;
          }
        } catch (err) {
          console.warn("Method 5 failed:", err);
        }
        
        // If we got here, we have employees but they might not be perfect
        if (employees.length > 0) {
          console.log("Using best available results with", employees.length, "employees");
          resolve(employees);
          return;
        }
        
        reject(new Error("Could not parse Excel file with any method"));
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// Parse with direct column access - a more aggressive approach for difficult files
function parseWithDirectColumnAccess(worksheet: XLSX.WorkSheet): Employee[] {
  // Get the range of the worksheet
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  
  // Extract headers
  const headers: string[] = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = worksheet[XLSX.utils.encode_cell({r: range.s.r, c: C})];
    headers.push(cell ? String(cell.v).trim() : '');
  }
  
  console.log("Direct access headers:", headers);
  
  // Find column indices for required fields
  const findColumnIndex = (possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => 
        h.toLowerCase() === name.toLowerCase() || 
        h.toLowerCase().includes(name.toLowerCase())
      );
      if (index !== -1) return index;
    }
    return -1;
  };
  
  const firstNameIdx = findColumnIndex(['first name', 'firstname', 'first', 'given name']);
  const lastNameIdx = findColumnIndex(['last name', 'lastname', 'last', 'surname', 'family name']);
  const dobIdx = findColumnIndex(['date of birth', 'dob', 'birth date', 'birthdate', 'birth']);
  const genderIdx = findColumnIndex(['gender', 'sex']);
  const relationshipIdx = findColumnIndex(['relationship', 'relation', 'rel', 'member type', 'type', 'status']);
  const enrollmentTierIdx = findColumnIndex(['enrollment tier', 'tier', 'plan', 'coverage', 'level', 'benefit']);
  
  console.log("Column indices:", {
    firstNameIdx,
    lastNameIdx,
    dobIdx,
    genderIdx,
    relationshipIdx,
    enrollmentTierIdx
  });
  
  // If we can't find essential columns, return empty array
  if (firstNameIdx === -1 || lastNameIdx === -1) {
    console.warn("Could not find essential columns (first name, last name)");
    return [];
  }
  
  // Extract data rows
  const employees: Employee[] = [];
  
  for (let R = range.s.r + 1; R <= range.e.r; R++) {
    // Skip empty rows
    const firstCell = worksheet[XLSX.utils.encode_cell({r: R, c: range.s.c})];
    if (!firstCell || !firstCell.v) continue;
    
    const getCellValue = (colIdx: number): string => {
      if (colIdx === -1) return '';
      const cell = worksheet[XLSX.utils.encode_cell({r: R, c: colIdx})];
      return cell ? String(cell.v).trim() : '';
    };
    
    const employee: Employee = {
      id: `${R - range.s.r - 1}`,
      firstName: getCellValue(firstNameIdx),
      lastName: getCellValue(lastNameIdx),
      dob: getCellValue(dobIdx),
      gender: getCellValue(genderIdx),
      relationship: getCellValue(relationshipIdx),
      enrollmentTier: getCellValue(enrollmentTierIdx)
    };
    
    // Only add if we have at least first and last name
    if (employee.firstName && employee.lastName) {
      employees.push(employee);
    }
  }
  
  return employees;
}

// Try to infer missing relationship and enrollmentTier from other columns
function inferMissingColumns(worksheet: XLSX.WorkSheet, employees: Employee[]): Employee[] {
  // Get all column headers
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  const headers: string[] = [];
  
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = worksheet[XLSX.utils.encode_cell({r: range.s.r, c: C})];
    headers.push(cell ? String(cell.v) : '');
  }
  
  console.log("Trying to infer from headers:", headers);
  
  // Check if there are any columns that might contain relationship or enrollment tier info
  const potentialRelationshipCols: string[] = [];
  const potentialEnrollmentTierCols: string[] = [];
  
  headers.forEach(header => {
    const headerLower = header.toLowerCase();
    
    // Check for potential relationship columns
    if (
      headerLower.includes('rel') || 
      headerLower.includes('type') || 
      headerLower.includes('member') || 
      headerLower.includes('status') ||
      headerLower.includes('subscriber') ||
      headerLower.includes('spouse') ||
      headerLower.includes('child') ||
      headerLower.includes('dependent')
    ) {
      potentialRelationshipCols.push(header);
    }
    
    // Check for potential enrollment tier columns
    if (
      headerLower.includes('plan') || 
      headerLower.includes('tier') || 
      headerLower.includes('coverage') || 
      headerLower.includes('level') || 
      headerLower.includes('benefit') || 
      headerLower.includes('insurance') || 
      headerLower.includes('medical')
    ) {
      potentialEnrollmentTierCols.push(header);
    }
  });
  
  console.log("Potential relationship columns:", potentialRelationshipCols);
  console.log("Potential enrollment tier columns:", potentialEnrollmentTierCols);
  
  // If we found potential columns, try to extract data from them
  if (potentialRelationshipCols.length > 0 || potentialEnrollmentTierCols.length > 0) {
    // Convert worksheet to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    
    // Map employees by index for easy lookup
    const employeeMap = new Map<number, Employee>();
    employees.forEach((emp, index) => {
      employeeMap.set(index, emp);
    });
    
    // Update employees with inferred data
    jsonData.forEach((row: any, index) => {
      const employee = employeeMap.get(index);
      if (!employee) return;
      
      // Try to infer relationship
      if (!employee.relationship && potentialRelationshipCols.length > 0) {
        for (const col of potentialRelationshipCols) {
          if (row[col] && String(row[col]).trim()) {
            employee.relationship = String(row[col]).trim();
            console.log(`Inferred relationship for employee ${index}: ${employee.relationship} from column ${col}`);
            break;
          }
        }
      }
      
      // Try to infer enrollment tier
      if (!employee.enrollmentTier && potentialEnrollmentTierCols.length > 0) {
        for (const col of potentialEnrollmentTierCols) {
          if (row[col] && String(row[col]).trim()) {
            employee.enrollmentTier = String(row[col]).trim();
            console.log(`Inferred enrollment tier for employee ${index}: ${employee.enrollmentTier} from column ${col}`);
            break;
          }
        }
      }
    });
  }
  
  // If still missing, try to extract from the raw data
  if (employees.some(emp => !emp.relationship || !emp.enrollmentTier)) {
    console.log("Still missing some relationship or enrollmentTier values, trying raw data extraction");
    
    // Get all data from the worksheet
    const data: any[][] = [];
    for (let R = range.s.r; R <= range.e.r; R++) {
      const row: any[] = [];
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = worksheet[XLSX.utils.encode_cell({r: R, c: C})];
        row.push(cell ? cell.v : null);
      }
      data.push(row);
    }
    
    // Check each row for relationship and enrollment tier values
    for (let i = 1; i < data.length; i++) { // Skip header row
      const employee = employees[i - 1];
      if (!employee) continue;
      
      // Look for relationship values
      if (!employee.relationship) {
        for (let j = 0; j < data[i].length; j++) {
          const value = data[i][j];
          if (!value) continue;
          
          const strValue = String(value).trim().toLowerCase();
          if (
            strValue === 'subscriber' || 
            strValue === 'spouse' || 
            strValue === 'child' || 
            strValue === 'dependent' ||
            strValue === 'employee' ||
            strValue === 'self'
          ) {
            employee.relationship = String(value).trim();
            console.log(`Found relationship for employee ${i-1}: ${employee.relationship} from raw data`);
            break;
          }
        }
      }
      
      // Look for enrollment tier values
      if (!employee.enrollmentTier) {
        for (let j = 0; j < data[i].length; j++) {
          const value = data[i][j];
          if (!value) continue;
          
          const strValue = String(value).trim().toLowerCase();
          if (
            strValue.includes('employee') || 
            strValue.includes('family') || 
            strValue.includes('single') || 
            strValue.includes('spouse') ||
            strValue.includes('child') ||
            strValue.includes('tier')
          ) {
            employee.enrollmentTier = String(value).trim();
            console.log(`Found enrollment tier for employee ${i-1}: ${employee.enrollmentTier} from raw data`);
            break;
          }
        }
      }
    }
  }
  
  // If still missing, set default values
  employees.forEach(emp => {
    if (!emp.relationship) {
      emp.relationship = 'Unknown';
    }
    if (!emp.enrollmentTier) {
      emp.enrollmentTier = 'Unknown';
    }
  });
  
  return employees;
}

// Parse with standard headers
function parseWithHeaders(worksheet: XLSX.WorkSheet): Employee[] {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
  const employees: Employee[] = jsonData.map((row: any, index) => {
    const employee: Employee = {
      id: `${index}`,
      firstName: '',
      lastName: '',
      dob: '',
      gender: '',
      relationship: '',
      enrollmentTier: ''
    };
    
    Object.keys(row as HeadersMap).forEach(key => {
      const mappedKey = columnMapping[key] || key.toLowerCase().replace(/\s+/g, '');
      if (row[key] !== undefined && row[key] !== null) {
        (employee as any)[mappedKey] = String(row[key]).trim();
      }
    });
    
    return employee;
  });
  
  return employees;
}

// Parse with automatic header detection
function parseWithAutoHeaders(worksheet: XLSX.WorkSheet): Employee[] {
  // Convert to JSON with header: 'A' to get raw data with column letters
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A', raw: false });
  
  // Get headers from the first row
  const headers = jsonData[0] || {} as Record<string, unknown>;
  const headerMap: Record<string, string> = {};
  
  // Map Excel column headers to our property names
  Object.keys(headers as Record<string, unknown>).forEach(key => {
    const headerValue = String((headers as Record<string, unknown>)[key]).trim();
    const mappedKey = columnMapping[headerValue] || headerValue.toLowerCase().replace(/\s+/g, '');
    headerMap[key] = mappedKey;
  });
  
  console.log('Header Mapping:', headerMap);
  
  // Skip the header row and map to our Employee interface
  const employees: Employee[] = jsonData.slice(1).map((row: any, index) => {
    const employee: Employee = {
      id: `${index}`,
      firstName: '',
      lastName: '',
      dob: '',
      gender: '',
      relationship: '',
      enrollmentTier: ''
    };
    
    // Map each column to our standardized property names using the header map
    Object.keys(row).forEach(key => {
      const mappedKey = headerMap[key];
      if (mappedKey && row[key] !== undefined && row[key] !== null) {
        employee[mappedKey] = String(row[key]).trim();
      }
    });
    
    return employee;
  });
  
  return employees;
}

// Parse raw data and guess columns
function parseRawData(worksheet: XLSX.WorkSheet): Employee[] {
  // Convert to JSON with header: 'A' to get raw data with column letters
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A', raw: false });
  
  // Skip potential header row
  const dataRows = jsonData.slice(1);
  
  // Guess which columns contain which data
  const columnGuesses: Record<string, string> = {};
  
  // Helper function to check if a value looks like a name
  const isLikelyName = (value: string): boolean => {
    return /^[A-Za-z\s\-']+$/.test(value) && value.length > 1 && value.length < 30;
  };
  
  // Helper function to check if a value looks like a date
  const isLikelyDate = (value: string): boolean => {
    return /\d/.test(value) && (/\//.test(value) || /-/.test(value) || /\./.test(value));
  };
  
  // Helper function to check if a value looks like gender
  const isLikelyGender = (value: string): boolean => {
    const normalized = value.toLowerCase().trim();
    return ['m', 'f', 'male', 'female', 'man', 'woman'].includes(normalized);
  };
  
  // Helper function to check if a value looks like relationship
  const isLikelyRelationship = (value: string): boolean => {
    const normalized = value.toLowerCase().trim();
    return ['employee', 'spouse', 'dependent', 'child', 'self', 'partner', 'family', 'subscriber'].includes(normalized);
  };
  
  // Helper function to check if a value looks like enrollment tier
  const isLikelyEnrollmentTier = (value: string): boolean => {
    const normalized = value.toLowerCase().trim();
    return ['single', 'family', 'employee only', 'employee + spouse', 'employee + child', 'employee + children', 'full family', 'employee+family'].includes(normalized);
  };
  
  // Analyze all rows to guess columns
  for (let rowIndex = 0; rowIndex < Math.min(dataRows.length, 5); rowIndex++) {
    const row = dataRows[rowIndex];
    
    // Try to identify columns
    Object.keys(row as Record<string, unknown>).forEach(col => {
      const value = String((row as Record<string, unknown>)[col] || '').trim();
      
      // Skip empty values
      if (!value) return;
      
      // Check for patterns
      if (!columnGuesses.firstName && isLikelyName(value)) {
        columnGuesses.firstName = col;
      } else if (!columnGuesses.lastName && isLikelyName(value) && columnGuesses.firstName) {
        columnGuesses.lastName = col;
      } else if (!columnGuesses.dob && isLikelyDate(value)) {
        columnGuesses.dob = col;
      } else if (!columnGuesses.gender && isLikelyGender(value)) {
        columnGuesses.gender = col;
      } else if (!columnGuesses.relationship && isLikelyRelationship(value)) {
        columnGuesses.relationship = col;
      } else if (!columnGuesses.enrollmentTier && isLikelyEnrollmentTier(value)) {
        columnGuesses.enrollmentTier = col;
      }
    });
    
    // If we found all columns, break
    if (
      columnGuesses.firstName && 
      columnGuesses.lastName && 
      columnGuesses.dob && 
      columnGuesses.gender && 
      columnGuesses.relationship && 
      columnGuesses.enrollmentTier
    ) {
      break;
    }
  }
  
  console.log('Column guesses:', columnGuesses);
  
  // Map data using guessed columns
  const employees: Employee[] = dataRows.map((row: any, index) => {
    const employee: Employee = {
      id: `${index}`,
      firstName: columnGuesses.firstName ? String(row[columnGuesses.firstName] || '').trim() : '',
      lastName: columnGuesses.lastName ? String(row[columnGuesses.lastName] || '').trim() : '',
      dob: columnGuesses.dob ? String(row[columnGuesses.dob] || '').trim() : '',
      gender: columnGuesses.gender ? String(row[columnGuesses.gender] || '').trim() : '',
      relationship: columnGuesses.relationship ? String(row[columnGuesses.relationship] || '').trim() : '',
      enrollmentTier: columnGuesses.enrollmentTier ? String(row[columnGuesses.enrollmentTier] || '').trim() : ''
    };
    
    return employee;
  });
  
  return employees;
}

// Parse with fuzzy column matching
function parseWithFuzzyMatching(worksheet: XLSX.WorkSheet): Employee[] {
  // Convert to JSON with headers
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
  
  // Get all column headers
  const headers = Object.keys(jsonData[0] || {});
  
  // Fuzzy match headers to our expected columns
  const headerMap: Record<string, string> = {};
  
  // Function to calculate similarity between two strings
  const similarity = (s1: string, s2: string): number => {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    
    // Exact match
    if (s1 === s2) return 1.0;
    
    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    // Partial match (check if words match)
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    
    for (const w1 of words1) {
      for (const w2 of words2) {
        if (w1 === w2 && w1.length > 2) return 0.7;
      }
    }
    
    // Check for common substrings
    for (let i = 0; i < s1.length - 2; i++) {
      const substr = s1.substring(i, i + 3);
      if (s2.includes(substr)) return 0.5;
    }
    
    return 0;
  };
  
  // Map of expected column names to their standardized property names
  const expectedColumns: Record<string, string[]> = {
    'firstName': ['first name', 'firstname', 'first'],
    'lastName': ['last name', 'lastname', 'last'],
    'dob': ['date of birth', 'birth date', 'birthdate', 'birth', 'date'],
    'gender': ['gender', 'sex'],
    'relationship': ['relationship', 'relation', 'type', 'member type', 'status', 'subscriber', 'spouse', 'child', 'dependent'],
    'enrollmentTier': ['enrollment tier', 'tier', 'plan', 'coverage', 'level', 'benefit', 'insurance']
  };
  
  // For each header, find the best match among our expected columns
  headers.forEach(header => {
    let bestMatch = '';
    let bestScore = 0;
    
    Object.entries(expectedColumns).forEach(([column, aliases]) => {
      for (const alias of aliases) {
        const score = similarity(header, alias);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = column;
        }
      }
    });
    
    // Only use matches with a decent score
    if (bestScore >= 0.5) {
      headerMap[header] = bestMatch;
    }
  });
  
  console.log('Fuzzy Header Mapping:', headerMap);
  
  // Map to our Employee interface
  const employees: Employee[] = jsonData.map((row: any, index) => {
    const employee: Employee = {
      id: `${index}`,
      firstName: '',
      lastName: '',
      dob: '',
      gender: '',
      relationship: '',
      enrollmentTier: ''
    };
    
    // Map each column to our standardized property names using the fuzzy header map
    Object.keys(row).forEach(key => {
      const mappedKey = headerMap[key];
      if (mappedKey && row[key] !== undefined && row[key] !== null) {
        employee[mappedKey] = String(row[key]).trim();
      }
    });
    
    return employee;
  });
  
  return employees;
}

// Check if the parsed data is valid
function isValidEmployeeData(employees: Employee[]): boolean {
  if (employees.length === 0) return false;
  
  // Check if at least 70% of employees have first name and last name
  const validCount = employees.filter(emp => 
    emp.firstName && emp.firstName.length > 0 && 
    emp.lastName && emp.lastName.length > 0
  ).length;
  
  return (validCount / employees.length) >= 0.7;
}

// Check if two dates might be the same but formatted differently
function isDateSimilar(date1: string, date2: string): boolean {
  if (date1 === date2) return true;
  
  // Try to extract numbers from the dates
  const nums1 = date1.match(/\d+/g);
  const nums2 = date2.match(/\d+/g);
  
  if (!nums1 || !nums2 || nums1.length !== nums2.length) return false;
  
  // Check if the same numbers appear in both dates (might be in different order)
  const sortedNums1 = [...nums1].sort();
  const sortedNums2 = [...nums2].sort();
  
  return sortedNums1.every((num, i) => num === sortedNums2[i]);
}

export const compareEmployees = (
  censusEmployees: Employee[],
  enrollmentEmployees: Employee[]
): ComparisonResult => {
  console.log(`Comparing ${censusEmployees.length} census employees with ${enrollmentEmployees.length} enrollment employees`);
  
  // Create lookup maps for faster comparison
  const censusMap = new Map<string, Employee>();
  censusEmployees.forEach(employee => {
    const key = generateEmployeeKey(employee);
    if (key) censusMap.set(key, employee);
  });
  
  const enrollmentMap = new Map<string, Employee>();
  enrollmentEmployees.forEach(employee => {
    const key = generateEmployeeKey(employee);
    if (key) enrollmentMap.set(key, employee);
  });
  
  console.log(`Generated ${censusMap.size} census keys and ${enrollmentMap.size} enrollment keys`);
  
  // Track which census records have been processed
  const processedCensusKeys = new Set<string>();
  
  // Find new employees (in enrollment but not in census)
  const newEmployees: Employee[] = [];
  // Find modified employees
  const modifiedEmployees: ComparisonResult['modifiedEmployees'] = [];
  
  // First pass: Look for exact matches and modifications
  enrollmentEmployees.forEach(enrollmentEmployee => {
    const key = generateEmployeeKey(enrollmentEmployee);
    if (!key) return; // Skip if no valid key can be generated
    
    if (censusMap.has(key)) {
      // Found an exact match - check for modifications
      const censusEmployee = censusMap.get(key)!;
      const differences: { [key: string]: { census: any; enrollment: any } } = {};
      
      comparisonKeys.forEach(attr => {
        const censusValue = (censusEmployee[attr] || '').toString().trim().toLowerCase();
        const enrollmentValue = (enrollmentEmployee[attr] || '').toString().trim().toLowerCase();
        
        if (censusValue !== enrollmentValue && censusValue && enrollmentValue) {
          differences[attr] = {
            census: censusEmployee[attr],
            enrollment: enrollmentEmployee[attr]
          };
        }
      });
      
      if (Object.keys(differences).length > 0) {
        console.log(`Modified employee found with exact key match: ${key} with ${Object.keys(differences).length} differences`);
        modifiedEmployees.push({
          censusRecord: censusEmployee,
          enrollmentRecord: enrollmentEmployee,
          differences
        });
      }
      
      // Mark this census record as processed
      processedCensusKeys.add(key);
    }
  });
  
  // Second pass: Look for name matches with different DOB (likely modifications)
  enrollmentEmployees.forEach(enrollmentEmployee => {
    const fullKey = generateEmployeeKey(enrollmentEmployee);
    if (!fullKey) return; // Skip if no valid key can be generated
    
    // Skip if we already found this as an exact match
    if (censusMap.has(fullKey) && processedCensusKeys.has(fullKey)) {
      return;
    }
    
    // Try matching just by name
    const nameKey = generateNameOnlyKey(enrollmentEmployee);
    if (!nameKey) return;
    
    // Look for a census record with the same name
    let foundMatch = false;
    
    for (const [censusKey, censusEmployee] of censusMap.entries()) {
      // Skip if this census record has already been processed
      if (processedCensusKeys.has(censusKey)) continue;
      
      const censusNameKey = generateNameOnlyKey(censusEmployee);
      if (censusNameKey === nameKey) {
        // Found a name match - this is likely a modification with DOB change
        const differences: { [key: string]: { census: any; enrollment: any } } = {};
        
        comparisonKeys.forEach(attr => {
          const censusValue = (censusEmployee[attr] || '').toString().trim().toLowerCase();
          const enrollmentValue = (enrollmentEmployee[attr] || '').toString().trim().toLowerCase();
          
          if (attr === 'dob') {
            // Special handling for DOB - check if they might be the same date in different formats
            if (censusValue !== enrollmentValue && !isDateSimilar(censusValue, enrollmentValue)) {
              differences[attr] = {
                census: censusEmployee[attr],
                enrollment: enrollmentEmployee[attr]
              };
            }
          } else if (censusValue !== enrollmentValue && censusValue && enrollmentValue) {
            differences[attr] = {
              census: censusEmployee[attr],
              enrollment: enrollmentEmployee[attr]
            };
          }
        });
        
        if (Object.keys(differences).length > 0) {
          console.log(`Modified employee found with name-only match: ${nameKey} with ${Object.keys(differences).length} differences`);
          modifiedEmployees.push({
            censusRecord: censusEmployee,
            enrollmentRecord: enrollmentEmployee,
            differences
          });
          
          // Mark this census record as processed
          processedCensusKeys.add(censusKey);
          foundMatch = true;
          break;
        }
      }
    }
    
    // If no match was found, this is a new employee
    if (!foundMatch) {
      console.log(`New employee found: ${fullKey}`);
      newEmployees.push(enrollmentEmployee);
    }
  });
  
  // Find missing employees (in census but not in enrollment or already processed as modified)
  const missingEmployees: Employee[] = [];
  censusEmployees.forEach(censusEmployee => {
    const key = generateEmployeeKey(censusEmployee);
    if (!key) return; // Skip if no valid key can be generated
    
    // If this census record hasn't been processed yet, it's missing
    if (!processedCensusKeys.has(key)) {
      console.log(`Missing employee found: ${key}`);
      missingEmployees.push(censusEmployee);
    }
  });
  
  // Calculate variation percentage
  const totalEmployees = censusEmployees.length || 1; // Avoid division by zero
  const totalDifferences = newEmployees.length + missingEmployees.length + modifiedEmployees.length;
  const variationPercentage = (totalDifferences / totalEmployees) * 100;
  
  console.log(`Comparison results: ${newEmployees.length} new, ${missingEmployees.length} missing, ${modifiedEmployees.length} modified`);
  
  return {
    newEmployees,
    missingEmployees,
    modifiedEmployees,
    variationPercentage
  };
};

// Generate a unique key for an employee based on name and DOB
function generateEmployeeKey(employee: Employee): string | null {
  // Make sure we have valid values to create the key
  const firstName = (employee.firstName || '').toLowerCase().trim();
  const lastName = (employee.lastName || '').toLowerCase().trim();
  const dob = (employee.dob || '').trim();
  
  // Skip if any key component is missing
  if (!firstName || !lastName || !dob) {
    console.warn('Incomplete employee data for key generation:', { firstName, lastName, dob });
    return null;
  }
  
  return `${firstName}_${lastName}_${dob}`;
}

// Generate a key based only on name (for finding modified records)
function generateNameOnlyKey(employee: Employee): string | null {
  // Make sure we have valid values to create the key
  const firstName = (employee.firstName || '').toLowerCase().trim();
  const lastName = (employee.lastName || '').toLowerCase().trim();
  
  // Skip if any key component is missing
  if (!firstName || !lastName) {
    console.warn('Incomplete employee data for name key generation:', { firstName, lastName });
    return null;
  }
  
  return `${firstName}_${lastName}`;
}

export const exportToExcel = (results: ComparisonResult): void => {
  const wb = XLSX.utils.book_new();
  
  const headers = [
    'First Name',
    'Last Name',
    'DOB',
    'Gender',
    'Relationship',
    'Enrollment Tier',
    'Status'
  ];

  const data = [headers];

  // Add new employees
  results.newEmployees.forEach(emp => {
    data.push([
      emp.firstName,
      emp.lastName,
      emp.dob,
      emp.gender,
      emp.relationship,
      emp.enrollmentTier,
      'New'
    ]);
  });

  // Add missing employees
  results.missingEmployees.forEach(emp => {
    data.push([
      emp.firstName,
      emp.lastName,
      emp.dob,
      emp.gender,
      emp.relationship,
      emp.enrollmentTier,
      'Missing'
    ]);
  });

  // Add modified employees (with both new and old values)
  results.modifiedEmployees.forEach(item => {
    // Add row with new values
    data.push([
      item.enrollmentRecord.firstName,
      item.enrollmentRecord.lastName,
      item.enrollmentRecord.dob,
      item.enrollmentRecord.gender,
      item.enrollmentRecord.relationship,
      item.enrollmentRecord.enrollmentTier,
      'Modified (New)'
    ]);

    // Add row with old values
    const oldValues = { ...item.enrollmentRecord };
    Object.keys(item.differences).forEach(field => {
      oldValues[field] = item.differences[field].census;
    });

    data.push([
      oldValues.firstName,
      oldValues.lastName,
      oldValues.dob,
      oldValues.gender,
      oldValues.relationship,
      oldValues.enrollmentTier,
      'Modified (Old)'
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Define border style
  const borderStyle = {
    style: 'thin',
    color: { rgb: '000000' }
  };

  // Define common border object
  const commonBorder = {
    top: borderStyle,
    bottom: borderStyle,
    left: borderStyle,
    right: borderStyle
  };

  // Apply styles to rows and add borders
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const status = i === 0 ? 'header' : row[6]; // Status column or header
    
    for (let j = 0; j < headers.length; j++) {
      const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
      if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
      
      // Initialize style with borders
      ws[cellRef].s = {
        border: commonBorder
      };

      // Apply specific styles based on status
      if (i === 0) { // Header row
        ws[cellRef].s.fill = {
          patternType: 'solid',
          fgColor: { rgb: 'F5F5F5' }  // Light gray background
        };
        ws[cellRef].s.font = {
          bold: true
        };
      } else if (status.startsWith('Modified')) {
        const modifiedIndex = Math.floor((i - 1 - results.newEmployees.length - results.missingEmployees.length) / 2);
        const modifiedRecord = results.modifiedEmployees[modifiedIndex];
        
        // Base yellow background for all cells including status
        ws[cellRef].s.fill = {
          patternType: 'solid',
          fgColor: { rgb: 'FFFDE7' }  // Light yellow background
        };
        
        // For non-status columns, check if modified
        if (j < headers.length - 1) {
          const fieldMap: { [key: number]: string } = {
            0: 'firstName',
            1: 'lastName',
            2: 'dob',
            3: 'gender',
            4: 'relationship',
            5: 'enrollmentTier'
          };
          const field = fieldMap[j];
          
          if (modifiedRecord?.differences[field]) {
            ws[cellRef].s.fill = {
              patternType: 'solid',
              fgColor: { rgb: 'FFF3E0' }  // Orange background
            };
            ws[cellRef].s.font = {
              color: { rgb: 'CC5500' }  // Orange text
            };
          }
        }
      } else if (status === 'New') {
        ws[cellRef].s.fill = {
          patternType: 'solid',
          fgColor: { rgb: 'E6F4EA' }  // Light green
        };
      } else if (status === 'Missing') {
        ws[cellRef].s.fill = {
          patternType: 'solid',
          fgColor: { rgb: 'FFEBEE' }  // Light red
        };
      }
    }
  }

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 12 }, // DOB
    { wch: 10 }, // Gender
    { wch: 15 }, // Relationship
    { wch: 15 }, // Enrollment Tier
    { wch: 15 }  // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Variance Analysis');
  const fileName = `variance_analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// Add this interface near the top of the file
interface WorksheetCell {
  v: string | number;
  t: string;
  s?: CellStyle;
}

// Add the cell type to the worksheet indexing
interface ExtendedWorksheet extends XLSX.WorkSheet {
  [key: string]: WorksheetCell | any;
}

// Update the function signature to use ExtendedWorksheet
export function applyRowStyle(worksheet: ExtendedWorksheet, rowIndex: number, style: CellStyle) {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: C });
    applyCellStyle(worksheet, cellRef, style);
  }
}

function applyCellStyle(worksheet: ExtendedWorksheet, cell: string, style: CellStyle) {
  if (!worksheet['!cols']) worksheet['!cols'] = [];
  if (!worksheet['!rows']) worksheet['!rows'] = [];
  
  if (!worksheet[cell]) {
    worksheet[cell] = { v: '', t: 's' };
  }
  
  worksheet[cell].s = style;
}

// Add near the other interfaces
interface CellStyle {
  fill?: {
    fgColor?: { rgb: string };
    patternType?: string;
  };
}