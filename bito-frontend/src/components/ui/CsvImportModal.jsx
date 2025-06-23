import React, { useState, useCallback } from 'react';
import csvImportService from '../../services/csvImportService';
import { dualWriteHabits } from '../../utils/dualWriteSystem';

const { importCsvData, validateCsvStructure, mergeWithExistingData, mergeWithNewStore } = csvImportService;

const CsvImportModal = ({ isOpen, onClose, onImport, existingHabits = [], existingCompletions = {} }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [importStep, setImportStep] = useState('select'); // select, validate, preview, importing, complete
  const [validation, setValidation] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

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
  }, [handleFileSelect]);
  // Execute import
  const executeImport = useCallback(async () => {
    if (!importPreview) return;

    setImportStep('importing');
    try {
      // Phase 2: Use dual-write system for import
        // Handle old format for backward compatibility
      const mergedData = mergeWithExistingData(
        importPreview.oldFormat, 
        existingHabits, 
        existingCompletions
      );
      
      // Handle new store format
      const newStoreResult = mergeWithNewStore(importPreview.newFormat);
      
      setImportResult({
        ...mergedData,
        newStoreStats: newStoreResult
      });
      setImportStep('complete');
      
      // Call parent callback with merged data (old system)
      onImport(mergedData);
      
      console.log('📊 Import Results:');
      console.log('Old system:', mergedData);
      console.log('New store:', newStoreResult);
    } catch (err) {
      setError(`Import failed: ${err.message}`);
      setImportStep('preview');
    }
  }, [importPreview, existingHabits, existingCompletions, onImport]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Import Habit Data from CSV</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
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
          )}

          {/* Step 3: Preview */}
          {importStep === 'preview' && importPreview && (
            <div>
              <h3 className="text-lg font-medium mb-4">Import Preview</h3>              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {importPreview?.newFormat?.stats?.validRows || 0}
                  </div>
                  <div className="text-sm text-blue-700">Valid Days</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {importPreview?.newFormat?.habits?.length || 0}
                  </div>
                  <div className="text-sm text-green-700">Habits</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {importPreview?.newFormat?.completions?.length || 0}
                  </div>
                  <div className="text-sm text-purple-700">Completions</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {importPreview?.newFormat?.stats?.dateRange?.totalDays || 0}
                  </div>
                  <div className="text-sm text-orange-700">Days Tracked</div>
                </div>
              </div>              {/* Date Range */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Date Range</h4>
                <p className="text-sm text-gray-600">
                  {importPreview?.newFormat?.stats?.dateRange?.start 
                    ? `${importPreview.newFormat.stats.dateRange.start} to ${importPreview.newFormat.stats.dateRange.end}`
                    : 'No valid dates found'
                  }
                </p>
              </div>

              {/* Habits to be imported */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Habits to Import</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(importPreview?.newFormat?.habits || []).map((habit) => (
                    <div key={habit.id} className="flex items-center space-x-2 text-sm">
                      <span className="text-lg">{habit.icon}</span>
                      <span>{habit.name}</span>
                    </div>
                  ))}
                </div>
              </div>              {/* Errors/Warnings */}
              {(importPreview?.newFormat?.errors?.length || 0) > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-700 mb-2">Issues Found</h4>
                  <div className="max-h-32 overflow-y-auto bg-red-50 p-3 rounded-md">
                    {(importPreview?.newFormat?.errors || []).map((error, index) => (
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
                >
                  Import Data
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
          )}

          {/* Step 5: Complete */}
          {importStep === 'complete' && importResult && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Import Successful!</h3>
              <p className="text-gray-600 mb-6">
                Your habit data has been imported and merged with existing data.
              </p>              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-green-700">
                  Imported {importPreview?.newFormat?.completions?.length || 0} habit completions 
                  across {importPreview?.newFormat?.stats?.dateRange?.totalDays || 0} days
                </p>
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
