import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { templateService } from '../../services/templateService';
import BlockNoteEditor from './BlockNoteEditor';
import { 
  FileTextIcon, 
  PlusIcon, 
  Cross2Icon,
  Pencil1Icon,
  TrashIcon,
  CheckIcon,
  CaretLeftIcon,
  GearIcon
} from '@radix-ui/react-icons';

const TemplateManager = ({ isOpen, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('list'); // 'list', 'create', 'edit'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editor, setEditor] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: []
  });

  // Load templates when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setView('list');
      setSelectedTemplate(null);
      setFormData({ name: '', description: '', content: [] });
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

  const handleCreateTemplate = () => {
    setView('create');
    setFormData({ name: '', description: '', content: [] });
    setSelectedTemplate(null);
  };

  const handleEditTemplate = async (template) => {
    try {
      setIsLoading(true);
      const response = await templateService.getTemplate(template._id);
      if (response.success) {
        setSelectedTemplate(response.template);
        setFormData({
          name: response.template.name,
          description: response.template.description || '',
          content: response.template.content || []
        });
        setView('edit');
      } else {
        setError('Failed to load template');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      setError('Error loading template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      await templateService.deleteTemplate(templateId);
      await loadTemplates(); // Reload the list
      setError('');
    } catch (error) {
      console.error('Error deleting template:', error);
      setError('Failed to delete template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.name.trim()) {
      setError('Template name is required');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      
      // Get content from editor if available
      let content = formData.content;
      if (editor) {
        try {
          content = editor.document || [];
        } catch (error) {
          console.warn('Could not get editor content:', error);
        }
      }

      const templateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        content
      };

      if (view === 'create') {
        await templateService.createTemplate(templateData);
      } else if (view === 'edit' && selectedTemplate) {
        await templateService.updateTemplate(selectedTemplate._id, templateData);
      }

      await loadTemplates(); // Reload the list
      setView('list');
    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditorReady = (editorInstance) => {
    setEditor(editorInstance);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const renderListView = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">My Templates</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Create and manage your journal templates
          </p>
        </div>
        <button
          onClick={handleCreateTemplate}
          className="flex items-center px-4 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg transition-all duration-200 text-sm font-medium"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Template
        </button>
      </div>

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
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[var(--color-surface-secondary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileTextIcon className="w-8 h-8 text-[var(--color-text-tertiary)]" />
          </div>
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No templates yet</h3>
          <p className="text-[var(--color-text-secondary)] text-sm mb-6">
            Create your first template to speed up journal writing
          </p>
          <button
            onClick={handleCreateTemplate}
            className="px-6 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg transition-all duration-200 text-sm font-medium"
          >
            Create Template
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template._id}
              className="p-4 border border-[var(--color-border-primary)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--color-brand-50)] rounded-lg flex items-center justify-center">
                    <FileTextIcon className="w-5 h-5 text-[var(--color-brand-500)]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[var(--color-text-primary)]">{template.name}</h4>
                    {template.description && (
                      <p className="text-sm text-[var(--color-text-secondary)]">{template.description}</p>
                    )}
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
                  >
                    <Pencil1Icon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template._id)}
                    className="p-2 text-[var(--color-text-secondary)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateEditView = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-primary)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('list')}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
          >
            <CaretLeftIcon className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {view === 'create' ? 'Create Template' : 'Edit Template'}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Design your template structure
            </p>
          </div>
        </div>
        <button
          onClick={handleSaveTemplate}
          disabled={isSaving || !formData.name.trim()}
          className="px-4 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Template'}
        </button>
      </div>

      {/* Form */}
      <div className="p-6 border-b border-[var(--color-border-primary)]">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder="e.g., Daily Reflection"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Brief description of this template"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Template Content</h4>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Design your template structure with headers, placeholders, and formatting. Users will see this as their starting point.
          </p>
        </div>
        <div className="border border-[var(--color-border-primary)] rounded-lg overflow-hidden">
          <BlockNoteEditor
            initialContent={formData.content}
            onReady={handleEditorReady}
            placeholder="Design your template here... Add headers, bullet points, placeholders, etc."
            className="prose prose-lg max-w-none"
          />
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden z-10 transform transition-all duration-200 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-brand-50)] rounded-lg flex items-center justify-center">
              <GearIcon className="w-5 h-5 text-[var(--color-brand-500)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Template Manager
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Manage your journal templates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
          >
            <Cross2Icon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === 'list' ? renderListView() : renderCreateEditView()}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TemplateManager;
