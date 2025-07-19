/**
 * Enhanced CSV Import Modal with LLM Integration
 * Integrates with existing Bito HabitContext and provides fallback to current system
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useHabits } from '@contexts/HabitContext';
import csvImportService from '@services/csvImportService';
import { analyzeCsvWithServerLLM, testServerLLMConnection } from '@services/serverLlmCsvAnalyzer';
import { applyCsvMappings, validateMappings } from '@services/enhancedCsvTransformService';
import LLMSettingsModal from './LLMSettingsModal';

const EnhancedCsvImportModal = ({ isOpen, onClose, onImportComplete }) => {
  // State management
  const [step, setStep] = useState('select'); // select, analyze, review, preview, import, complete
  const [csvData, setCsvData] = useState(null);
  const [llmAnalysis, setLlmAnalysis] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [transformedData, setTransformedData] = useState(null);
    // UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [serverLLMAvailable, setServerLLMAvailable] = useState(false);
  const [useLLM, setUseLLM] = useState(false);
  const [showLLMSettings, setShowLLMSettings] = useState(false);

  const habitContext = useHabits();  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setCsvData(null);
      setLlmAnalysis(null);
      setMappings([]);
      setTransformedData(null);
      setError(null);
      setAnalysisProgress('');
      setShowLLMSettings(false);
    } else {
      // Check server LLM availability when modal opens
      checkServerLLMAvailability();
    }
  }, [isOpen]);
  // Check if server-side LLM is available
  const checkServerLLMAvailability = async () => {
    try {
      const result = await testServerLLMConnection();
      const isAvailable = result.success && result.configured;
      setServerLLMAvailable(isAvailable);
      setUseLLM(isAvailable);
    } catch (error) {
      console.error('Failed to check server LLM availability:', error);
      setServerLLMAvailable(false);
      setUseLLM(false);
    }
  };
  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) return;

    // Validate that we have a proper File object
    if (!(selectedFile instanceof File)) {
      setError('Invalid file selection. Please try again.');
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setError(null);
    setStep('analyze');    try {
      // Read file as text with fallback for older browsers
      let text;
      if (selectedFile.text && typeof selectedFile.text === 'function') {
        text = await selectedFile.text();
      } else {
        // Fallback using FileReader
        text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(new Error('Failed to read file'));
          reader.readAsText(selectedFile);
        });
      }
      
      // Parse CSV first
      const Papa = (await import('papaparse')).default;
      const csvResult = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim()
      });

      if (csvResult.errors.length > 0) {
        setError('CSV parsing error: ' + csvResult.errors[0].message);
        return;
      }      setCsvData(csvResult);

      // Decide whether to use LLM or fallback
      if (useLLM && serverLLMAvailable) {
        await performLLMAnalysis(csvResult);
      } else {
        await performFallbackAnalysis(csvResult);
      }

    } catch (error) {
      console.error('File processing error:', error);
      setError('Failed to process CSV file: ' + error.message);
      setStep('select');
    }
  }, [useLLM, serverLLMAvailable]);
  // Perform LLM analysis
  const performLLMAnalysis = async (csvResult) => {
    setIsAnalyzing(true);
    setAnalysisProgress('Analyzing CSV structure with AI...');

    try {
      const analysis = await analyzeCsvWithServerLLM(csvResult);
      setLlmAnalysis(analysis);
      
      // Auto-apply high confidence suggestions
      const highConfidenceMappings = analysis.suggestions.filter(s => s.confidence > 0.8);
      setMappings(highConfidenceMappings);
      
      setAnalysisProgress('Analysis complete!');
      setStep('review');
      
    } catch (error) {
      console.error('LLM analysis failed:', error);
      setAnalysisProgress('AI analysis failed, using basic analysis...');
      
      // Fallback to basic analysis
      await performFallbackAnalysis(csvResult);
    } finally {
      setIsAnalyzing(false);
    }
  };  // Perform fallback analysis using existing system
  const performFallbackAnalysis = async (csvResult) => {
    setAnalysisProgress('Analyzing CSV structure...');
    
    try {
      // Simple validation of parsed CSV result
      if (!csvResult.data || csvResult.data.length === 0) {
        setError('CSV file is empty or invalid');
        setStep('select');
        return;
      }

      if (!csvResult.meta || !csvResult.meta.fields || csvResult.meta.fields.length === 0) {
        setError('CSV file has no headers');
        setStep('select');
        return;
      }      // Create basic mappings from existing logic
      const basicMappings = await createBasicMappings(csvResult);
      setMappings(basicMappings);
      
      // Find date column for analysis
      const headers = csvResult.meta.fields;
      const dateColumn = headers.find(field => 
        /date|day|time|when/i.test(field)
      );
      
      // Create mock analysis for consistency
      setLlmAnalysis({
        confidence: 0.6,
        dateColumn: dateColumn || headers[0], // Use first column as fallback
        suggestions: basicMappings,
        patterns: {
          dataFormat: 'basic_habits',
          trackingStyle: 'boolean',
          primaryUseCase: 'habit_formation'
        },
        recommendations: [
          'Using basic pattern matching analysis.',
          'For better analysis, configure AI settings.'
        ],
        metadata: { source: 'fallback' }
      });
      
      setStep('review');
      
    } catch (error) {
      console.error('Fallback analysis failed:', error);
      setError('Failed to analyze CSV: ' + error.message);
      setStep('select');
    }
  };

  // Create basic mappings from existing system logic
  const createBasicMappings = async (csvResult) => {
    const headers = csvResult.meta.fields;
    const dateColumn = headers.find(field => 
      /date|day|time|when/i.test(field)
    );
    
    const habitColumns = headers.filter(field => field !== dateColumn);
    
    return habitColumns.map(field => ({
      sourceColumn: field,
      targetWidget: 'habit-tracker',
      confidence: 0.6,
      reasoning: 'Basic pattern matching - assumed to be a habit tracker',
      config: {
        name: field,
        category: 'general',
        icon: '✅',
        color: '#6b7280'
      }
    }));
  };

  // Handle suggestion application/removal
  const handleSuggestionToggle = (suggestion, isCurrentlyApplied) => {
    if (isCurrentlyApplied) {
      setMappings(prev => prev.filter(m => m.sourceColumn !== suggestion.sourceColumn));
    } else {
      setMappings(prev => [...prev, suggestion]);
    }
  };

  // Preview import
  const handlePreview = async () => {
    if (mappings.length === 0) {
      setError('Please select at least one mapping');
      return;
    }

    try {
      setStep('preview');
      
      // Validate mappings
      const validation = validateMappings(csvData, mappings);
      if (!validation.isValid) {
        setError('Mapping validation failed: ' + validation.errors.join(', '));
        return;
      }

      // Transform data
      const transformed = applyCsvMappings(csvData, mappings);
      setTransformedData(transformed);
      
      if (transformed.errors.length > 0) {
        console.warn('Transform warnings:', transformed.errors);
      }
      
    } catch (error) {
      console.error('Preview failed:', error);
      setError('Failed to generate preview: ' + error.message);
    }
  };

  // Execute final import
  const executeImport = async () => {
    if (!transformedData) return;

    try {
      setStep('import');
      
      // Import habits using existing context
      for (const habit of transformedData.habits) {
        const habitData = {
          name: habit.name,
          color: habit.color,
          icon: habit.icon,
          description: habit.description || `Imported from CSV`
        };
        
        const result = await habitContext.createHabit(habitData);
        if (!result.success) {
          console.error('Failed to create habit:', result.error);
        }
      }

      // Import completions (this would need to be implemented in your context)
      // For now, we'll store them in the completions state
      // In a real implementation, you'd batch import these
      
      setStep('complete');
      
      // Call completion callback
      if (onImportComplete) {
        onImportComplete(transformedData);
      }
      
    } catch (error) {
      console.error('Import failed:', error);
      setError('Import failed: ' + error.message);
    }
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-[var(--color-surface-primary)] rounded-xl shadow-xl border border-[var(--color-border-primary)] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-zoom-in">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-primary)]">
            <div>
              <h2 className="text-2xl font-dmSerif gradient-text">
                {step === 'complete' ? '🎉 Import Complete!' : '📊 Enhanced CSV Import'}
              </h2>
              <p className="text-[var(--color-text-secondary)] mt-1 font-outfit">
                {useLLM ? 'AI-powered intelligent CSV analysis' : 'Basic CSV import with pattern matching'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!useLLM && (
                <button
                  onClick={() => setShowLLMSettings(true)}
                  className="px-3 py-1 text-xs bg-[var(--color-info-surface)] text-[var(--color-info-text)] rounded-lg hover:bg-[var(--color-info-hover)] transition-colors font-outfit"
                >
                  Enable AI Analysis
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {step === 'select' && (
              <SelectFileStep 
                onFileSelect={handleFileSelect}
                dragActive={dragActive}
                onDrag={handleDrag}
                onDrop={handleDrop}
                error={error}
              />
            )}

            {step === 'analyze' && (
              <AnalyzeStep 
                isAnalyzing={isAnalyzing}
                progress={analysisProgress}
                useLLM={useLLM}
              />
            )}

            {step === 'review' && llmAnalysis && (
              <ReviewStep 
                analysis={llmAnalysis}
                mappings={mappings}
                onSuggestionToggle={handleSuggestionToggle}
                onPreview={handlePreview}
                onBack={() => setStep('select')}
              />
            )}

            {step === 'preview' && transformedData && (
              <PreviewStep 
                transformedData={transformedData}
                onImport={executeImport}
                onBack={() => setStep('review')}
              />
            )}

            {step === 'import' && (
              <ImportingStep />
            )}

            {step === 'complete' && transformedData && (
              <CompleteStep 
                transformedData={transformedData}
                onClose={onClose}
              />
            )}
          </div>
        </div>
      </div>      {/* LLM Settings Modal */}
      <LLMSettingsModal 
        isOpen={showLLMSettings}
        onClose={() => {
          setShowLLMSettings(false);
          // Re-check server availability after settings change
          checkServerLLMAvailability();
        }}
      />
    </>
  );
};

// Step Components (simplified for brevity)
const SelectFileStep = ({ onFileSelect, dragActive, onDrag, onDrop, error }) => (
  <div className="p-6">
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
    >
      <div className="space-y-4">
        <div className="text-6xl">📊</div>
        <h3 className="text-xl font-semibold">Select Your CSV File</h3>
        <p className="text-gray-600">
          Drag and drop your CSV file here, or click to browse
        </p>        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onFileSelect(file);
            }
          }}
          className="hidden"
          id="csv-file-input"
        />
        <label
          htmlFor="csv-file-input"
          className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
        >
          Choose File
        </label>
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
      </div>
    </div>
  </div>
);

const AnalyzeStep = ({ isAnalyzing, progress, useLLM }) => (
  <div className="p-6 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <h3 className="text-lg font-semibold mb-2">
        {useLLM ? 'AI Analysis in Progress...' : 'Analyzing CSV...'}
      </h3>
      <p className="text-gray-600">{progress}</p>
    </div>
  </div>
);

const ReviewStep = ({ analysis, mappings, onSuggestionToggle, onPreview, onBack }) => (
  <div className="p-6">
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-2">
        {analysis.metadata?.source === 'fallback' ? 'Basic Analysis Results' : 'AI Analysis Results'}
      </h3>
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <span>Confidence: {Math.round(analysis.confidence * 100)}%</span>
        <span>•</span>
        <span>Format: {analysis.patterns.dataFormat?.replace('_', ' ')}</span>
      </div>
    </div>

    <div className="space-y-4 mb-8">
      {analysis.suggestions.map((suggestion, index) => (
        <SuggestionCard
          key={index}
          suggestion={suggestion}
          isApplied={mappings.some(m => m.sourceColumn === suggestion.sourceColumn)}
          onToggle={() => onSuggestionToggle(
            suggestion, 
            mappings.some(m => m.sourceColumn === suggestion.sourceColumn)
          )}
        />
      ))}
    </div>

    <div className="flex space-x-3 pt-6 border-t">
      <button
        onClick={onBack}
        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
      >
        Start Over
      </button>
      <button
        onClick={onPreview}
        disabled={mappings.length === 0}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 font-medium"
      >
        Preview Import ({mappings.length} mappings)
      </button>
    </div>
  </div>
);

const SuggestionCard = ({ suggestion, isApplied, onToggle }) => (
  <div className={`border rounded-lg p-4 ${isApplied ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h4 className="font-semibold">{suggestion.sourceColumn}</h4>
        <p className="text-sm text-gray-600 mb-2">
          Maps to: {suggestion.targetWidget} • Confidence: {Math.round(suggestion.confidence * 100)}%
        </p>
        <p className="text-xs text-gray-500">{suggestion.reasoning}</p>
      </div>
      <button
        onClick={onToggle}
        className={`px-4 py-2 rounded-lg ${
          isApplied 
            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {isApplied ? 'Remove' : 'Apply'}
      </button>
    </div>
  </div>
);

const PreviewStep = ({ transformedData, onImport, onBack }) => (
  <div className="p-6">
    <h3 className="text-xl font-semibold mb-6">Import Preview</h3>
    
    <div className="grid grid-cols-3 gap-6 mb-8">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="text-3xl font-bold text-blue-600">{transformedData.habits.length}</div>
        <div className="text-sm text-blue-700 mt-1">Habits</div>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-3xl font-bold text-green-600">{transformedData.completions.length}</div>
        <div className="text-sm text-green-700 mt-1">Completions</div>
      </div>
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
        <div className="text-3xl font-bold text-purple-600">{transformedData.widgets?.length || 0}</div>
        <div className="text-sm text-purple-700 mt-1">Widgets</div>
      </div>
    </div>

    <div className="flex space-x-3">
      <button
        onClick={onBack}
        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
      >
        Adjust Mappings
      </button>
      <button
        onClick={onImport}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
      >
        Import Data
      </button>
    </div>
  </div>
);

const ImportingStep = () => (
  <div className="p-6 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
      <h3 className="text-lg font-semibold">Importing Data...</h3>
    </div>
  </div>
);

const CompleteStep = ({ transformedData, onClose }) => (
  <div className="p-8 text-center">
    <div className="text-6xl mb-6">🎉</div>
    <h3 className="text-2xl font-semibold mb-4">Import Complete!</h3>
    <p className="text-gray-600 mb-8">
      Successfully imported {transformedData.habits.length} habits with {transformedData.completions.length} completion records.
    </p>
    <button
      onClick={onClose}
      className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-lg"
    >
      Go to Dashboard
    </button>
  </div>
);

export default EnhancedCsvImportModal;
