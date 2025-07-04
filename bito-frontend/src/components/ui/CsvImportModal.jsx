import React, { useState, useCallback } from 'react';
import csvImportService from '../../services/csvImportService';
import { useHabits } from '../../contexts/HabitContext';

const { importCsvData, validateCsvStructure, executeImportWithBackend } = csvImportService;

const CsvImportModal = ({ isOpen, onClose, onImport }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [importStep, setImportStep] = useState('select'); // select, validate, preview, importing, complete
  const [validation, setValidation] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Get HabitContext for backend integration
  const habitContext = useHabits();

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setImportStep('select');
      setValidation(null);
      setImportPreview(null);
      setImportResult(null);
      setError(null);
    }
  }, [isOpen]);

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setImportStep('validate');

    try {
      const text = await selectedFile.text();
      const validationResult = await validateCsvStructure(text);
      setValidation(validationResult);      if (validationResult.isValid) {
        setImportStep('preview');
        // Generate preview
        const importData = await importCsvData(text);
        // Store the full import data for preview and later use
        setImportPreview(importData);
      } else {
        setImportStep('select');
        setError(`Validation failed: ${validationResult.errors.join(', ')}`);
      }
    } catch (err) {
      setError(`Failed to process file: ${err.message}`);
      setImportStep('select');
    }
  }, []);

  // Handle drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileChange = useCallback((e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);  // Execute import with backend integration
  const executeImport = useCallback(async () => {
    if (!importPreview) return;

    setImportStep('importing');
    try {
      console.log('🚀 Starting CSV import to backend...');
      
      // Use the new backend integration
      const results = await executeImportWithBackend(importPreview, habitContext);
      
      setImportResult(results);
      setImportStep('complete');
      
      // Call parent callback if provided
      if (onImport) {
        onImport(results);
      }
      
      console.log('✅ CSV Import completed successfully:', results);    } catch (err) {
      console.error('❌ CSV Import failed:', err);
      setError(`Import failed: ${err.message}`);
      setImportStep('preview');
    }
  }, [importPreview, habitContext, onImport]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[var(--color-surface-primary)] rounded-xl shadow-xl border border-[var(--color-border-primary)] max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-zoom-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-dmSerif gradient-text">Import Habit Data from CSV</h2>
            <button
              onClick={onClose}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] p-1 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              ×
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-[var(--color-danger-surface)] border border-[var(--color-danger-border)] rounded-lg">
              <p className="text-[var(--color-danger-text)] text-sm font-outfit">{error}</p>
            </div>
          )}

          {/* Step 1: File Selection */}
          {importStep === 'select' && (
            <div>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="text-4xl">📄</div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Choose a CSV file or drag it here
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Upload your habit tracking data in CSV format
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <label
                    htmlFor="csv-file-input"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer transition-colors"
                  >
                    Select File
                  </label>
                </div>
              </div>
              
              <div className="mt-6 text-sm text-gray-600">
                <h3 className="font-medium mb-2">Expected CSV Format:</h3>
                <ul className="space-y-1 text-xs">
                  <li>• Must include "Day" column with dates</li>
                  <li>• Habit columns with "Yes"/"No" values</li>
                  <li>• Supported habits: pushups, bible study, 7hrs of sleep, substack, learning, work, 7k steps/day, etc.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Validation */}
          {importStep === 'validate' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Validating CSV file...</p>
            </div>
          )}          {/* Step 3: Preview */}
          {importStep === 'preview' && importPreview && (
            <div>
              <h3 className="text-lg font-medium mb-4">Import Preview</h3>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {importPreview.stats?.validRows || 0}
                  </div>
                  <div className="text-sm text-blue-700">Valid Days</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {importPreview.habits?.length || 0}
                  </div>
                  <div className="text-sm text-green-700">Habits</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {importPreview.entries?.length || 0}
                  </div>
                  <div className="text-sm text-purple-700">Completions</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {importPreview.stats?.dateRange?.totalDays || 0}
                  </div>
                  <div className="text-sm text-orange-700">Days Tracked</div>
                </div>
              </div>
              
              {/* Date Range */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Date Range</h4>
                <p className="text-sm text-gray-600">
                  {importPreview.stats?.dateRange?.start 
                    ? `${importPreview.stats.dateRange.start} to ${importPreview.stats.dateRange.end}`
                    : 'No valid dates found'
                  }
                </p>
              </div>

              {/* Habits to be imported */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Habits to Import</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(importPreview.habits || []).map((habit, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span className="text-lg">{habit.icon}</span>
                      <span>{habit.name}</span>
                      <div 
                        className="w-3 h-3 rounded-full ml-2" 
                        style={{ backgroundColor: habit.color }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Errors/Warnings */}
              {(importPreview.errors?.length || 0) > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-700 mb-2">Issues Found</h4>
                  <div className="max-h-32 overflow-y-auto bg-red-50 p-3 rounded-md">
                    {(importPreview.errors || []).map((error, index) => (
                      <p key={index} className="text-sm text-red-600">{error}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setImportStep('select')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Choose Different File
                </button>
                <button
                  onClick={executeImport}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  disabled={importPreview.habits?.length === 0}
                >
                  Import {importPreview.habits?.length || 0} Habits
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Importing */}
          {importStep === 'importing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Importing your data...</p>
            </div>
          )}          {/* Step 5: Complete */}
          {importStep === 'complete' && importResult && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Import Successful!</h3>
              <p className="text-gray-600 mb-6">
                Your habit data has been imported and saved to your account.
              </p>
              
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
                  <div>
                    <span className="font-medium">{importResult.habitsCreated}</span> habits created
                  </div>
                  <div>
                    <span className="font-medium">{importResult.entriesCreated}</span> entries added
                  </div>
                </div>
                
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800 font-medium mb-2">
                      {importResult.errors.length} issues occurred:
                    </p>
                    <div className="max-h-20 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <p key={index} className="text-xs text-yellow-700">{error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CsvImportModal;
