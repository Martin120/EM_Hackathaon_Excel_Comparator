import React, { useState } from 'react';
import { FileSpreadsheet, BarChart3, AlertCircle, Info, HelpCircle, Brain, Cpu, Database } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ComparisonResults from './components/ComparisonResults';
import ThemeToggle from './components/ThemeToggle';
import { parseExcelFile, compareEmployees } from './utils/excelUtils';
import { ComparisonResult, Employee, FileType } from './types';
import { useTheme } from './context/ThemeContext';

function App() {
  const { darkMode } = useTheme();
  const [censusFile, setCensusFile] = useState<File | null>(null);
  const [enrollmentFile, setEnrollmentFile] = useState<File | null>(null);
  const [censusData, setCensusData] = useState<Employee[] | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<Employee[] | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const handleFileUpload = async (file: File, fileType: FileType) => {
    try {
      setError(null);
      setDebugInfo(`Processing ${fileType} file: ${file.name}`);
      
      if (fileType === 'census') {
        setCensusFile(file);
        const data = await parseExcelFile(file);
        setCensusData(data);
        setDebugInfo(prev => `${prev}\nParsed ${data.length} records from census file`);
        
        // Show sample data
        if (data.length > 0) {
          setDebugInfo(prev => `${prev}\n\nSample census record:\n${JSON.stringify(data[0], null, 2)}`);
        }
      } else {
        setEnrollmentFile(file);
        const data = await parseExcelFile(file);
        setEnrollmentData(data);
        setDebugInfo(prev => `${prev}\nParsed ${data.length} records from enrollment file`);
        
        // Show sample data
        if (data.length > 0) {
          setDebugInfo(prev => `${prev}\n\nSample enrollment record:\n${JSON.stringify(data[0], null, 2)}`);
        }
      }
    } catch (err) {
      setError(`Error parsing ${fileType} file: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCompare = async () => {
    if (!censusData || !enrollmentData) {
      setError('Please upload both Census and Enrollment files');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDebugInfo(`Starting comparison: ${censusData.length} census records vs ${enrollmentData.length} enrollment records`);

    try {
      // Perform comparison
      const results = compareEmployees(censusData, enrollmentData);
      setComparisonResults(results);
      setDebugInfo(prev => `${prev}\nComparison complete: ${results.newEmployees.length} new, ${results.missingEmployees.length} missing, ${results.modifiedEmployees.length} modified`);
    } catch (err) {
      setError(`Error comparing files: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetComparison = () => {
    setCensusFile(null);
    setEnrollmentFile(null);
    setCensusData(null);
    setEnrollmentData(null);
    setComparisonResults(null);
    setError(null);
    setDebugInfo(null);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-200`}>
      <header className={`${darkMode ? 'bg-gray-800 shadow-gray-700/20' : 'bg-white shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <Cpu className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <h1 className={`ml-2 text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} hidden sm:block`}>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                  AI-Driven Census & Enrollment Variance Explorer
                </span>
              </h1>
              <h1 className={`ml-2 text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} sm:hidden`}>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                  AI Variance Explorer
                </span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button 
                onClick={() => setShowHelp(!showHelp)}
                className={`flex items-center ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
              >
                <HelpCircle className="h-5 w-5 mr-1" />
                <span>Help</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {showHelp && (
          <div className={`mb-6 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-lg shadow-md p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>Help & Troubleshooting</h2>
              <button 
                onClick={() => setShowHelp(false)}
                className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
              >
                Close
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'} mb-2`}>Excel File Requirements</h3>
                <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                  <li>Files must be in .xlsx or .xls format</li>
                  <li>First row should contain column headers</li>
                  <li>Files should contain employee data with matching columns</li>
                </ul>
              </div>
              
              <div>
                <h3 className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'} mb-2`}>Common Issues</h3>
                <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                  <li><span className="font-medium">No results showing:</span> Check that your files have matching data formats</li>
                  <li><span className="font-medium">Zero differences:</span> The tool might not be recognizing matching records between files</li>
                  <li><span className="font-medium">Parsing errors:</span> Your Excel file might have an unusual structure</li>
                </ul>
              </div>
              
              <div>
                <h3 className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'} mb-2`}>Tips for Better Results</h3>
                <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                  <li>Ensure both files have consistent column names</li>
                  <li>Make sure date formats are consistent between files</li>
                  <li>Check the debug information panel for insights</li>
                  <li>Try simplifying your Excel files (remove formatting, extra columns)</li>
                  <li>Ensure employee identifiers (name, DOB) are consistent between files</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {!comparisonResults ? (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
            <div className="flex items-center mb-6">
              <div className="mr-4 relative">
                <Brain className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h2 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400 font-bold text-2xl">
                  Intelligent Variance Analysis
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Our AI engine analyzes census and enrollment data to identify discrepancies with precision
                </p>
              </div>
            </div>

            {error && (
              <div className={`mb-6 ${darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-500'} border-l-4 p-4`}>
                <div className="flex items-center">
                  <AlertCircle className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-500'} mr-2`} />
                  <p className={`${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
                </div>
              </div>
            )}

            {debugInfo && (
              <div className={`mb-6 ${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-500'} border-l-4 p-4`}>
                <div className="flex items-start">
                  <Info className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'} mr-2 mt-1`} />
                  <div>
                    <p className={`${darkMode ? 'text-blue-300' : 'text-blue-700'} font-medium mb-1`}>Debug Information</p>
                    <pre className={`text-xs whitespace-pre-wrap ${darkMode ? 'text-blue-200 bg-blue-900/50' : 'text-blue-800 bg-blue-100'} p-2 rounded overflow-auto max-h-60 font-mono`}>
                      {debugInfo}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="flex items-center mb-2">
                  <Database className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Source Data</h3>
                </div>
                <FileUpload
                  fileType="census"
                  onFileUploaded={(file) => handleFileUpload(file, 'census')}
                  isUploaded={!!censusFile}
                />
              </div>
              <div>
                <div className="flex items-center mb-2">
                  <Database className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Target Data</h3>
                </div>
                <FileUpload
                  fileType="enrollment"
                  onFileUploaded={(file) => handleFileUpload(file, 'enrollment')}
                  isUploaded={!!enrollmentFile}
                />
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={handleCompare}
                disabled={!censusFile || !enrollmentFile || isLoading}
                className={`px-6 py-3 rounded-md text-white font-medium flex items-center
                  ${
                    !censusFile || !enrollmentFile || isLoading
                      ? `${darkMode ? 'bg-gray-600' : 'bg-gray-400'} cursor-not-allowed`
                      : `bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500`
                  }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Data...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-5 w-5" />
                    Run AI Analysis
                  </>
                )}
              </button>
            </div>

            <div className="mt-10">
              <div className="flex items-center mb-4">
                <BarChart3 className={`mr-2 h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>How Our AI Works</h3>
              </div>
              <div className={`${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} p-4 rounded-lg`}>
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Data Ingestion:</span>
                    <span>Upload your Census (source) and Enrollment (target) files for AI processing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Intelligent Matching:</span>
                    <span>Our algorithm identifies matching records even with inconsistent formatting</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Variance Detection:</span>
                    <span>Advanced pattern recognition identifies new, missing, and modified records</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Change Visualization:</span>
                    <span>Results are presented with intuitive color-coding and detailed change tracking</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Exportable Insights:</span>
                    <span>Download comprehensive analysis in Excel format for further review</span>
                  </li>
                </ol>
              </div>
            </div>

            <div className="mt-8 border-t pt-6 border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <FileSpreadsheet className={`mr-2 h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Data Format Requirements</h3>
              </div>
              <div className={`${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'} p-4 rounded-lg`}>
                <p className="mb-3 text-sm">Your Excel files should include these columns (our AI handles variations in naming):</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>First Name / FirstName</li>
                    <li>Last Name / LastName</li>
                    <li>Date of Birth / DOB</li>
                  </ul>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Gender</li>
                    <li>Relationship</li>
                    <li>Enrollment Tier / Tier / Plan</li>
                  </ul>
                </div>
                <p className={`mt-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Note: The first row of your Excel file should contain the column headers.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <button
                onClick={resetComparison}
                className={`px-4 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-md transition-colors`}
              >
                ← Back to File Upload
              </button>
            </div>
            <ComparisonResults results={comparisonResults} />
          </>
        )}
      </main>

      <footer className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t mt-12`}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
            AI-Driven Census & Enrollment Variance Explorer © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;