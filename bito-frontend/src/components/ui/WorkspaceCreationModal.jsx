import React, { useState } from 'react';
import { Cross2Icon, PersonIcon, TargetIcon, ReaderIcon, ActivityLogIcon, HomeIcon, GlobeIcon } from '@radix-ui/react-icons';
import { groupsAPI } from '../../services/api';

const WorkspaceCreationModal = ({ isOpen, onClose, onWorkspaceCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'personal',
    settings: {
      isPublic: false,
      allowInvites: true,
      requireApproval: true,
      privacyLevel: 'invite-only'
    }
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const workspaceTypes = [
    {
      id: 'personal',
      name: 'Personal',
      description: 'For individual habit tracking',
      icon: TargetIcon,
      color: 'text-blue-500'
    },
    {
      id: 'family',
      name: 'Family',
      description: 'Track habits with family members',
      icon: PersonIcon,
      color: 'text-green-500'
    },
    {
      id: 'team',
      name: 'Team',
      description: 'Work team productivity habits',
      icon: HomeIcon,
      color: 'text-purple-500'
    },
    {
      id: 'fitness',
      name: 'Fitness',
      description: 'Workout and health tracking',
      icon: ActivityLogIcon,
      color: 'text-red-500'
    },
    {
      id: 'study',
      name: 'Study',
      description: 'Learning and academic habits',
      icon: ReaderIcon,
      color: 'text-yellow-500'
    },
    {
      id: 'community',
      name: 'Community',
      description: 'Public community workspace',
      icon: GlobeIcon,
      color: 'text-indigo-500'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      const data = await groupsAPI.createGroup(formData);
      
      if (data.success) {
        onWorkspaceCreated(data.workspace);
        onClose();
        // Reset form
        setFormData({
          name: '',
          description: '',
          type: 'personal',
          settings: {
            isPublic: false,
            allowInvites: true,
            requireApproval: true,
            privacyLevel: 'invite-only'
          }
        });
      } else {
        setError(data.error || 'Failed to create workspace');
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      setError('Failed to create workspace. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Workspace</h2>
            <p className="text-gray-600 mt-1">Set up a collaborative space for habit tracking</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Cross2Icon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Workspace Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Johnson Family Habits, Dev Team Wellness..."
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What's this workspace for?"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Workspace Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Workspace Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {workspaceTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleInputChange('type', type.id)}
                    className={`p-4 border-2 rounded-lg transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${type.color}`} />
                    <h3 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {type.name}
                    </h3>
                    <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Privacy Settings
            </label>
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Public Workspace</h4>
                  <p className="text-sm text-gray-600">Allow anyone to discover and join</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('settings.isPublic', !formData.settings.isPublic)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.settings.isPublic ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.settings.isPublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Allow Member Invites</h4>
                  <p className="text-sm text-gray-600">Members can invite others to join</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('settings.allowInvites', !formData.settings.allowInvites)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.settings.allowInvites ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.settings.allowInvites ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Require Approval</h4>
                  <p className="text-sm text-gray-600">New members need admin approval</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('settings.requireApproval', !formData.settings.requireApproval)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.settings.requireApproval ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.settings.requireApproval ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !formData.name.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceCreationModal;