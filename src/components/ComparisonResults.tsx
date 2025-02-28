import React, { useState } from 'react';
import { ComparisonResult, Employee } from '../types';
import { Download, Filter, Brain, PieChart, BarChart3, Users, Cpu, AlertTriangle, CheckCircle2, FileBarChart, Table, BarChart, ChevronDown, ChevronUp } from 'lucide-react';
import { exportToExcel } from '../utils/excelUtils';
import { useTheme } from '../context/ThemeContext';

interface ComparisonResultsProps {
  results: ComparisonResult | null;
}

const ComparisonResults: React.FC<ComparisonResultsProps> = ({ results }) => {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'missing' | 'modified'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'graph'>('table');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!results) return null;

  const handleExport = () => {
    if (results) {
      exportToExcel(results);
    }
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  // Render a single employee row
  const renderEmployeeRow = (employee: Employee, type: 'new' | 'missing' | 'modified', differences?: any, index?: number) => {
    const rowClass = 
      type === 'new' 
        ? darkMode 
          ? 'bg-green-900/30 border-l-4 border-green-600' 
          : 'bg-green-50 border-l-4 border-green-500' 
        : type === 'missing' 
          ? darkMode 
            ? 'bg-red-900/30 border-l-4 border-red-600' 
            : 'bg-red-50 border-l-4 border-red-500' 
          : darkMode 
            ? 'bg-yellow-900/30 border-l-4 border-yellow-600' 
            : 'bg-yellow-50 border-l-4 border-yellow-500';

    // Create a unique key using employee data and index
    const uniqueKey = `${type}-${employee.firstName}-${employee.lastName}-${employee.dob}-${index || 0}`;

    // For modified employees, we'll render the data with inline changes
    const renderCellWithChanges = (field: keyof Employee) => {
      if (type !== 'modified' || !differences || !differences[field]) {
        return employee[field];
      }

      return (
        <div className="flex items-center space-x-2">
          <span className={`${darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'} line-through px-1`}>
            {differences[field].census}
          </span>
          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>→</span>
          <span className={`${darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'} px-1 font-medium`}>
            {differences[field].enrollment}
          </span>
        </div>
      );
    };

    return (
      <tr key={uniqueKey} className={`${rowClass}`}>
        <td className="px-4 py-2">{renderCellWithChanges('firstName')}</td>
        <td className="px-4 py-2">{renderCellWithChanges('lastName')}</td>
        <td className="px-4 py-2">{renderCellWithChanges('dob')}</td>
        <td className="px-4 py-2">{renderCellWithChanges('gender')}</td>
        <td className="px-4 py-2">{renderCellWithChanges('relationship')}</td>
        <td className="px-4 py-2">{renderCellWithChanges('enrollmentTier')}</td>
        <td className="px-4 py-2">
          {type === 'new' && <span className={`${darkMode ? 'text-green-400' : 'text-green-600'} font-medium`}>New</span>}
          {type === 'missing' && <span className={`${darkMode ? 'text-red-400' : 'text-red-600'} font-medium`}>Missing</span>}
          {type === 'modified' && <span className={`${darkMode ? 'text-yellow-400' : 'text-yellow-600'} font-medium`}>Modified</span>}
        </td>
      </tr>
    );
  };

  // Render bar chart for record distribution
  const renderBarChart = () => {
    const categories = [
      { name: 'New', count: results.newEmployees.length, color: darkMode ? 'bg-green-500' : 'bg-green-500' },
      { name: 'Missing', count: results.missingEmployees.length, color: darkMode ? 'bg-red-500' : 'bg-red-500' },
      { name: 'Modified', count: results.modifiedEmployees.length, color: darkMode ? 'bg-yellow-500' : 'bg-yellow-500' }
    ];
    
    const maxCount = Math.max(...categories.map(c => c.count));
    
    return (
      <div className="mb-6 px-4">
        <div className="flex flex-col space-y-6">
          {categories.map(category => (
            <div key={category.name} className="flex flex-col">
              <div className="flex justify-between mb-1">
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {category.name}
                </span>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {category.count}
                </span>
              </div>
              <div className="relative h-8 w-full bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full ${category.color} rounded-md transition-all duration-1000 ease-out`}
                  style={{ width: `${maxCount > 0 ? (category.count / maxCount) * 100 : 0}%` }}
                >
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {maxCount > 0 ? ((category.count / maxCount) * 100).toFixed(1) + '%' : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render graphical view
  const renderGraphicalView = () => {
    const totalRecords = results.newEmployees.length + results.missingEmployees.length + results.modifiedEmployees.length;
    
    // Calculate percentages for the charts
    const newPercentage = (results.newEmployees.length / totalRecords) * 100;
    const missingPercentage = (results.missingEmployees.length / totalRecords) * 100;
    const modifiedPercentage = (results.modifiedEmployees.length / totalRecords) * 100;
    
    return (
      <div className="space-y-8">
        {/* Chart Visualization */}
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Record Distribution
            </h3>
          </div>
          
          {renderBarChart()}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <div>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  New: {results.newEmployees.length}
                </span>
                <span className={`ml-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ({newPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <div>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Missing: {results.missingEmployees.length}
                </span>
                <span className={`ml-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ({missingPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
              <div>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Modified: {results.modifiedEmployees.length}
                </span>
                <span className={`ml-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ({modifiedPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bar Chart for Modifications by Field */}
        {results.modifiedEmployees.length > 0 && (
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
            <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Modifications by Field
            </h3>
            
            {(() => {
              // Count modifications by field
              const fieldCounts: Record<string, number> = {};
              
              results.modifiedEmployees.forEach(item => {
                Object.keys(item.differences).forEach(field => {
                  fieldCounts[field] = (fieldCounts[field] || 0) + 1;
                });
              });
              
              // Sort fields by count
              const sortedFields = Object.entries(fieldCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([field, count]) => ({ field, count }));
              
              const maxCount = Math.max(...Object.values(fieldCounts));
              
              return (
                <div className="space-y-3">
                  {sortedFields.map(({ field, count }) => (
                    <div key={field} className="flex items-center">
                      <div className="w-32 text-sm truncate mr-2">
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </div>
                      <div className="flex-1">
                        <div className="relative h-8 w-full">
                          <div 
                            className={`absolute top-0 left-0 h-full ${darkMode ? 'bg-yellow-600/50' : 'bg-yellow-200'} rounded`}
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          ></div>
                          <div className="absolute top-0 left-0 h-full w-full flex items-center px-2">
                            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {count} {count === 1 ? 'change' : 'changes'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
        
        {/* Collapsible Record Sections */}
        {results.newEmployees.length > 0 && (
          <div className={`rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow overflow-hidden`}>
            <div 
              className={`p-4 flex justify-between items-center cursor-pointer ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}
              onClick={() => toggleSection('new')}
            >
              <div className="flex items-center">
                <CheckCircle2 className={`h-5 w-5 mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  New Records ({results.newEmployees.length})
                </h3>
              </div>
              {expandedSection === 'new' ? (
                <ChevronUp className={`h-5 w-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              ) : (
                <ChevronDown className={`h-5 w-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              )}
            </div>
            
            {expandedSection === 'new' && (
              <div className="overflow-x-auto">
                <table className={`min-w-full ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border`}>
                  <thead>
                    <tr className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <th className="px-4 py-2 text-left">First Name</th>
                      <th className="px-4 py-2 text-left">Last Name</th>
                      <th className="px-4 py-2 text-left">DOB</th>
                      <th className="px-4 py-2 text-left">Gender</th>
                      <th className="px-4 py-2 text-left">Relationship</th>
                      <th className="px-4 py-2 text-left">Enrollment Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.newEmployees.map((employee, index) => (
                      <tr key={index} className={`${darkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                        <td className="px-4 py-2">{employee.firstName}</td>
                        <td className="px-4 py-2">{employee.lastName}</td>
                        <td className="px-4 py-2">{employee.dob}</td>
                        <td className="px-4 py-2">{employee.gender}</td>
                        <td className="px-4 py-2">{employee.relationship}</td>
                        <td className="px-4 py-2">{employee.enrollmentTier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {results.missingEmployees.length > 0 && (
          <div className={`rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow overflow-hidden`}>
            <div 
              className={`p-4 flex justify-between items-center cursor-pointer ${darkMode ? 'bg-red-900/30' : 'bg-red-50'}`}
              onClick={() => toggleSection('missing')}
            >
              <div className="flex items-center">
                <AlertTriangle className={`h-5 w-5 mr-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Missing Records ({results.missingEmployees.length})
                </h3>
              </div>
              {expandedSection === 'missing' ? (
                <ChevronUp className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
              ) : (
                <ChevronDown className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
              )}
            </div>
            
            {expandedSection === 'missing' && (
              <div className="overflow-x-auto">
                <table className={`min-w-full ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border`}>
                  <thead>
                    <tr className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <th className="px-4 py-2 text-left">First Name</th>
                      <th className="px-4 py-2 text-left">Last Name</th>
                      <th className="px-4 py-2 text-left">DOB</th>
                      <th className="px-4 py-2 text-left">Gender</th>
                      <th className="px-4 py-2 text-left">Relationship</th>
                      <th className="px-4 py-2 text-left">Enrollment Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.missingEmployees.map((employee, index) => (
                      <tr key={index} className={`${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
                        <td className="px-4 py-2">{employee.firstName}</td>
                        <td className="px-4 py-2">{employee.lastName}</td>
                        <td className="px-4 py-2">{employee.dob}</td>
                        <td className="px-4 py-2">{employee.gender}</td>
                        <td className="px-4 py-2">{employee.relationship}</td>
                        <td className="px-4 py-2">{employee.enrollmentTier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {results.modifiedEmployees.length > 0 && (
          <div className={`rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow overflow-hidden`}>
            <div 
              className={`p-4 flex justify-between items-center cursor-pointer ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}
              onClick={() => toggleSection('modified')}
            >
              <div className="flex items-center">
                <BarChart3 className={`h-5 w-5 mr-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Modified Records ({results.modifiedEmployees.length})
                </h3>
              </div>
              {expandedSection === 'modified' ? (
                <ChevronUp className={`h-5 w-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              ) : (
                <ChevronDown className={`h-5 w-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              )}
            </div>
            
            {expandedSection === 'modified' && (
              <div className="overflow-x-auto">
                <table className={`min-w-full ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border`}>
                  <thead>
                    <tr className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <th className="px-4 py-2 text-left">First Name</th>
                      <th className="px-4 py-2 text-left">Last Name</th>
                      <th className="px-4 py-2 text-left">Changes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.modifiedEmployees.map((item, index) => (
                      <tr key={index} className={`${darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
                        <td className="px-4 py-2">{item.enrollmentRecord.firstName}</td>
                        <td className="px-4 py-2">{item.enrollmentRecord.lastName}</td>
                        <td className="px-4 py-2">
                          <div className="space-y-1">
                            {Object.entries(item.differences).map(([field, values]) => (
                              <div key={field} className="flex items-center text-sm">
                                <span className="font-medium mr-1">{field}:</span>
                                <span className={`${darkMode ? 'text-red-300' : 'text-red-600'} line-through mr-1`}>
                                  {values.census}
                                </span>
                                <span className="mx-1">→</span>
                                <span className={`${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                                  {values.enrollment}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render table view
  const renderTableView = () => {
    return (
      <div className="overflow-x-auto">
        <table className={`min-w-full ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border`}>
          <thead>
            <tr className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <th className="px-4 py-2 text-left">First Name</th>
              <th className="px-4 py-2 text-left">Last Name</th>
              <th className="px-4 py-2 text-left">DOB</th>
              <th className="px-4 py-2 text-left">Gender</th>
              <th className="px-4 py-2 text-left">Relationship</th>
              <th className="px-4 py-2 text-left">Enrollment Tier</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'all' || activeTab === 'new') &&
              results.newEmployees.map((employee, index) => 
                renderEmployeeRow(employee, 'new', undefined, index)
              )}
            
            {(activeTab === 'all' || activeTab === 'missing') &&
              results.missingEmployees.map((employee, index) => 
                renderEmployeeRow(employee, 'missing', undefined, index)
              )}
            
            {(activeTab === 'all' || activeTab === 'modified') &&
              results.modifiedEmployees.map((item, index) => 
                renderEmployeeRow(item.enrollmentRecord, 'modified', item.differences, index)
              )}
            
            {((activeTab === 'all' && 
               results.newEmployees.length === 0 && 
               results.missingEmployees.length === 0 && 
               results.modifiedEmployees.length === 0) ||
              (activeTab === 'new' && results.newEmployees.length === 0) ||
              (activeTab === 'missing' && results.missingEmployees.length === 0) ||
              (activeTab === 'modified' && results.modifiedEmployees.length === 0)) && (
              <tr>
                <td colSpan={7} className={`px-4 py-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`mt-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center">
          <div className="mr-3 relative">
            <Cpu className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h2 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400 font-bold text-2xl">
              AI Analysis Results
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Variance detection complete with {results.variationPercentage.toFixed(2)}% total variation
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className={`flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 text-white px-4 py-2 rounded-md transition-colors`}
          >
            <FileBarChart size={18} />
            <span>Export Analysis</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} p-4 rounded-lg flex items-center`}>
            <div className="mr-3 p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
              <PieChart className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Variance Rate</h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{results.variationPercentage.toFixed(2)}%</p>
            </div>
          </div>
          <div className={`${darkMode ? 'bg-green-900/30' : 'bg-green-50'} p-4 rounded-lg flex items-center`}>
            <div className="mr-3 p-2 rounded-full bg-green-100 dark:bg-green-900/50">
              <CheckCircle2 className={`h-6 w-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <h3 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>New Records</h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{results.newEmployees.length}</p>
            </div>
          </div>
          <div className={`${darkMode ? 'bg-red-900/30' : 'bg-red-50'} p-4 rounded-lg flex items-center`}>
            <div className="mr-3 p-2 rounded-full bg-red-100 dark:bg-red-900/50">
              <AlertTriangle className={`h-6 w-6 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
            </div>
            <div>
              <h3 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Missing Records</h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{results.missingEmployees.length}</p>
            </div>
          </div>
          <div className={`${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'} p-4 rounded-lg flex items-center`}>
            <div className="mr-3 p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/50">
              <BarChart3 className={`h-6 w-6 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
            </div>
            <div>
              <h3 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Modified Records</h3>
              <p className={`text-2xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{results.modifiedEmployees.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Filter size={18} className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className="font-medium">Filter Results:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-md ${
                activeTab === 'all' 
                  ? darkMode 
                    ? 'bg-gray-600 font-medium' 
                    : 'bg-gray-200 font-medium' 
                  : darkMode 
                    ? 'bg-gray-700' 
                    : 'bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-3 py-1 rounded-md ${
                activeTab === 'new' 
                  ? darkMode 
                    ? 'bg-green-800 font-medium' 
                    : 'bg-green-200 font-medium' 
                  : darkMode 
                    ? 'bg-green-900/30' 
                    : 'bg-green-50'
              }`}
            >
              New
            </button>
            <button
              onClick={() => setActiveTab('missing')}
              className={`px-3 py-1 rounded-md ${
                activeTab === 'missing' 
                  ? darkMode 
                    ? 'bg-red-800 font-medium' 
                    : 'bg-red-200 font-medium' 
                  : darkMode 
                    ? 'bg-red-900/30' 
                    : 'bg-red-50'
              }`}
            >
              Missing
            </button>
            <button
              onClick={() => setActiveTab('modified')}
              className={`px-3 py-1 rounded-md ${
                activeTab === 'modified' 
                  ? darkMode 
                    ? 'bg-yellow-800 font-medium' 
                    : 'bg-yellow-200 font-medium' 
                  : darkMode 
                    ? 'bg-yellow-900/30' 
                    : 'bg-yellow-50'
              }`}
            >
              Modified
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="font-medium">View Mode:</span>
          <div className="flex rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 flex items-center ${
                viewMode === 'table'
                  ? darkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Table size={16} className="mr-1" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1 flex items-center ${
                viewMode === 'graph'
                  ? darkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-200 text-gray-700'
              }`}
            >
              <BarChart size={16} className="mr-1" />
              <span>Graph</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'table' ? renderTableView() : renderGraphicalView()}
      
      <div className={`mt-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
        <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI Detection Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 ${darkMode ? 'bg-green-900/30 border-l-4 border-green-600' : 'bg-green-50 border-l-4 border-green-500'}`}></div>
            <span>New records (in Enrollment but not in Census)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 ${darkMode ? 'bg-red-900/30 border-l-4 border-red-600' : 'bg-red-50 border-l-4 border-red-500'}`}></div>
            <span>Missing records (in Census but not in Enrollment)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 ${darkMode ? 'bg-yellow-900/30 border-l-4 border-yellow-600' : 'bg-yellow-50 border-l-4 border-yellow-500'}`}></div>
            <span>Modified records with detected changes</span>
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-center space-x-2 mt-2">
            <span className={`${darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'} line-through px-1`}>Old value</span>
            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>→</span>
            <span className={`${darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'} px-1`}>New value</span>
            <span className="ml-2">Shows the exact changes for modified records</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonResults;