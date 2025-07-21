import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Cross2Icon, CheckCircleIcon } from '@radix-ui/react-icons';
import { StickyNoteIcon } from '@heroicons/react/24/solid';
import BlockNoteEditor from './BlockNoteEditor';
import { journalService } from '../../services/journalService';

const DailyJournalModal = ({ 
  isOpen, 
  onClose, 
  date, 
  focusHabit = null,
  habits = [],
  habitEntries = {},
  onSave
}) => {
  const [entry, setEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'
  const [editor, setEditor] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  // Format date for display
  const formattedDate = useMemo(() => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, [date]);

  // Load journal entry when modal opens
  useEffect(() => {
    if (isOpen && date) {
      loadJournalEntry();
    }
  }, [isOpen, date]);

  const loadJournalEntry = async () => {
    setIsLoading(true);
    try {
      const dateStr = journalService.formatDateForAPI(date);
      const journalEntry = await journalService.getDailyJournal(dateStr);
      
      if (journalEntry) {
        setEntry(journalEntry);
        setMood(journalEntry.mood);
        setEnergy(journalEntry.energy);
        setTags(journalEntry.tags || []);
        setWordCount(journalEntry.wordCount || 0);
      } else {
        // Create new entry
        const newEntry = {
          date: dateStr,
          richContent: null,
          plainTextContent: '',
          mood: null,
          energy: null,
          tags: [],
          wordCount: 0
        };
        setEntry(newEntry);
        setMood(null);
        setEnergy(null);
        setTags([]);
        setWordCount(0);
      }
    } catch (error) {
      console.error('Error loading journal entry:', error);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (content) => {
      if (!date) return;

      setSaving(true);
      setSaveStatus('saving');

      try {
        const dateStr = journalService.formatDateForAPI(date);
        const plainText = journalService.extractPlainText(content);
        const newWordCount = journalService.getWordCount(plainText);

        const updateData = {
          richContent: content,
          plainTextContent: plainText,
          wordCount: newWordCount,
          mood,
          energy,
          tags,
          createdVia: 'modal'
        };

        const savedEntry = await journalService.saveDailyJournal(dateStr, updateData);
        setEntry(savedEntry);
        setWordCount(newWordCount);
        setSaveStatus('saved');

        // Notify parent of save
        if (onSave) {
          onSave(savedEntry);
        }
      } catch (error) {
        console.error('Error saving journal:', error);
        setSaveStatus('error');
      } finally {
        setSaving(false);
      }
    }, 1500),
    [date, mood, energy, tags, onSave]
  );

  // Handle editor content changes
  const handleEditorChange = useCallback((content, editorInstance) => {
    const plainText = journalService.extractPlainText(content);
    const newWordCount = journalService.getWordCount(plainText);
    setWordCount(newWordCount);
    
    // Auto-save
    debouncedSave(content);
  }, [debouncedSave]);

  // Handle mood change
  const handleMoodChange = (newMood) => {
    setMood(newMood);
    setSaveStatus('saving');
  };

  // Handle energy change
  const handleEnergyChange = (newEnergy) => {
    setEnergy(newEnergy);
    setSaveStatus('saving');
  };

  // Handle tag management
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setNewTag('');
      setSaveStatus('saving');
    }
  };

  const removeTag = (tagToRemove) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    setSaveStatus('saving');
  };

  // Save metadata changes
  useEffect(() => {
    if (entry && (mood !== entry.mood || energy !== entry.energy || JSON.stringify(tags) !== JSON.stringify(entry.tags))) {
      const saveMetadata = async () => {
        try {
          const dateStr = journalService.formatDateForAPI(date);
          const updateData = { mood, energy, tags };
          await journalService.updateDailyJournal(dateStr, updateData);
          setSaveStatus('saved');
        } catch (error) {
          console.error('Error saving metadata:', error);
          setSaveStatus('error');
        }
      };

      const timeoutId = setTimeout(saveMetadata, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [mood, energy, tags, entry, date]);

  // Handle modal close
  const handleClose = () => {
    setEntry(null);
    setMood(null);
    setEnergy(null);
    setTags([]);
    setNewTag('');
    setWordCount(0);
    setSaveStatus('saved');
    onClose();
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex border border-slate-200 overflow-hidden">
          {/* Sidebar */}
          <div className="w-72 border-r border-slate-200 bg-slate-50/50 p-6 overflow-auto">
            <div className="space-y-6">
              {/* Date and basic info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Daily Journal
                </h3>
                <p className="text-sm text-slate-600">
                  {formattedDate}
                </p>
              </div>
              
              {/* Mood selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  How was your mood today?
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleMoodChange(value)}
                      className={`
                        w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200
                        ${mood === value
                          ? 'bg-blue-500 text-white shadow-md scale-105'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }
                      `}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  What was your energy level?
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleEnergyChange(value)}
                      className={`
                        w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200
                        ${energy === value
                          ? 'bg-green-500 text-white shadow-md scale-105'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }
                      `}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Today's habits */}
              {habits.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Today's Habits</h4>
                  <div className="space-y-2">
                    {habits.map(habit => {
                      const habitEntry = habitEntries[habit.id];
                      const isCompleted = habitEntry?.completed;
                      const isFocused = focusHabit?.id === habit.id;
                      
                      return (
                        <div 
                          key={habit.id}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg text-sm transition-colors
                            ${isFocused 
                              ? 'bg-purple-50 border border-purple-200' 
                              : 'bg-white border border-slate-200 hover:bg-slate-50'
                            }
                          `}
                        >
                          <span className="text-lg">{habit.icon}</span>
                          <span className={`flex-1 font-medium ${isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                            {habit.name}
                          </span>
                          {isCompleted && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                          {habitEntry?.notes && <StickyNoteIcon className="w-4 h-4 text-blue-500" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Tags
                </label>
                <div className="space-y-3">
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full border border-slate-200"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="text-slate-400 hover:text-slate-600 ml-1"
                          >
                            <Cross2Icon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      placeholder="Add a tag..."
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={addTag}
                      disabled={!newTag.trim()}
                      className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main editor area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Write your thoughts</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Reflect on your day, habits, and experiences
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Save status */}
                <div className="flex items-center gap-2 text-sm">
                  {saveStatus === 'saving' && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="text-green-600 font-medium">✓ Saved</span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-red-600 font-medium">Error saving</span>
                  )}
                </div>
                
                <button 
                  onClick={handleClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Cross2Icon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 p-6 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex items-center gap-3 text-slate-500">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                    <span>Loading your journal...</span>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">
                  <BlockNoteEditor
                    initialContent={entry?.richContent}
                    onChange={handleEditorChange}
                    onReady={setEditor}
                    placeholder="How did today go? Reflect on your habits, mood, and experiences..."
                    className="prose prose-lg max-w-none"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4">
              <div className="flex justify-between items-center text-sm text-slate-500">
                <div className="flex items-center gap-4">
                  <span className="font-medium">{wordCount} words</span>
                  <span>•</span>
                  <span>{journalService.getReadingTime(wordCount)} min read</span>
                  {entry?.lastEditedAt && (
                    <>
                      <span>•</span>
                      <span>
                        Last edited {new Date(entry.lastEditedAt).toLocaleTimeString()}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  Press Esc to close
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Debounce helper function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default DailyJournalModal;