export interface Employee {
  id?: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  relationship: string;
  enrollmentTier: string;
  [key: string]: any;
}

export interface ComparisonResult {
  newEmployees: Employee[];
  missingEmployees: Employee[];
  modifiedEmployees: {
    censusRecord: Employee;
    enrollmentRecord: Employee;
    differences: {
      [key: string]: {
        census: any;
        enrollment: any;
      };
    };
  }[];
  variationPercentage: number;
}

export type FileType = 'census' | 'enrollment';