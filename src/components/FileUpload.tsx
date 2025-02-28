import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileType } from '../types';
import { FileUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface FileUploadProps {
  fileType: FileType;
  onFileUploaded: (file: File) => void;
  isUploaded: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ fileType, onFileUploaded, isUploaded }) => {
  const { darkMode } = useTheme();
  
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileUploaded(acceptedFiles[0]);
      }
    },
    [onFileUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const title = fileType === 'census' ? 'Census File (Base)' : 'Enrollment File';

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${isDragActive 
          ? darkMode 
            ? 'border-blue-400 bg-blue-900/30' 
            : 'border-blue-500 bg-blue-50' 
          : darkMode 
            ? 'border-gray-600' 
            : 'border-gray-300'}
        ${isUploaded 
          ? darkMode 
            ? 'bg-green-900/30 border-green-600' 
            : 'bg-green-50 border-green-500' 
          : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-2">
        <FileUp className={`w-12 h-12 ${isUploaded 
          ? darkMode 
            ? 'text-green-400' 
            : 'text-green-500' 
          : darkMode 
            ? 'text-gray-500' 
            : 'text-gray-400'}`} />
        <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
        {isUploaded ? (
          <p className={`${darkMode ? 'text-green-400' : 'text-green-600'}`}>File uploaded successfully</p>
        ) : (
          <>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
              Drag & drop an Excel file here, or click to select
            </p>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Supports .xlsx and .xls files</p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;