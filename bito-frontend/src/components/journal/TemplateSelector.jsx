import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { templateService } from '../../services/templateService';
import { 
  FileTextIcon, 
  PlusIcon, 
  Cross2Icon,
  CheckIcon 
} from '@radix-ui/react-icons';

const TemplateSelector = ({ isOpen, onClose, onSelectTemplate, onCreateTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Load templates when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await templateService.getUserTemplates();
      if (response.success) {
        setTemplates(response.templates || []);
      } else {
        setError('Failed to load templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setError('Error loading templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = async (template) => {
    if (!template) {
      // Start with blank journal
      onSelectTemplate(null);
      onClose();
      return;
    }

    try {
      setIsLoading(true);
      const response = await templateService.getTemplate(template._id);
      if (response.success) {
        onSelectTemplate(response.template);
        onClose();
      } else {
        setError('Failed to load template content');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      setError('Error loading template');
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultTemplates = () => {
    return templateService.getDefaultTemplates();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden z-10 transform transition-all duration-200 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-primary)]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Choose a Template
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Start with a pre-structured journal entry
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
          >
            <Cross2Icon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                <div className="w-6 h-6 border-2 border-[var(--color-text-tertiary)] border-t-blue-600 rounded-full animate-spin"></div>
                <span className="font-medium">Loading templates...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Start Blank Option */}
              <button
                onClick={() => handleSelectTemplate(null)}
                className="w-full p-4 text-left border-2 border-dashed border-[var(--color-border-primary)] hover:border-[var(--color-brand-500)] rounded-lg transition-all duration-200 group"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-[var(--color-surface-secondary)] rounded-lg flex items-center justify-center group-hover:bg-[var(--color-brand-50)] transition-colors">
                    <PlusIcon className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-brand-500)]" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-[var(--color-text-primary)]">Start Blank</h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">Begin with an empty journal entry</p>
                  </div>
                </div>
              </button>

              {/* Default Templates */}
              {templates.length === 0 && (
                <>
                  <div className="border-t border-[var(--color-border-primary)] pt-4">
                    <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
                      Starter Templates
                    </h3>
                  </div>
                  {getDefaultTemplates().map((template, index) => (
                    <button
                      key={index}
                      onClick={() => onSelectTemplate({ content: template.content })}
                      className="w-full p-4 text-left border border-[var(--color-border-primary)] hover:border-[var(--color-brand-500)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-all duration-200 group"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-[var(--color-brand-50)] rounded-lg flex items-center justify-center">
                          <FileTextIcon className="w-5 h-5 text-[var(--color-brand-500)]" />
                        </div>
                        <div className="ml-3">
                          <h3 className="font-medium text-[var(--color-text-primary)]">{template.name}</h3>
                          <p className="text-sm text-[var(--color-text-secondary)]">{template.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* User Templates */}
              {templates.length > 0 && (
                <>
                  <div className="border-t border-[var(--color-border-primary)] pt-4">
                    <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
                      My Templates
                    </h3>
                  </div>
                  {templates.map((template) => (
                    <button
                      key={template._id}
                      onClick={() => handleSelectTemplate(template)}
                      className="w-full p-4 text-left border border-[var(--color-border-primary)] hover:border-[var(--color-brand-500)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-all duration-200 group"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                          <FileTextIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="font-medium text-[var(--color-text-primary)]">{template.name}</h3>
                          {template.description && (
                            <p className="text-sm text-[var(--color-text-secondary)]">{template.description}</p>
                          )}
                          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                            Created {new Date(template.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)]">
          <button
            onClick={onCreateTemplate}
            className="flex items-center px-4 py-2 text-sm font-medium text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] rounded-lg transition-all duration-200"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create New Template
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TemplateSelector;
