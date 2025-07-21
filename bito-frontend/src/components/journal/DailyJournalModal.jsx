import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Cross2Icon,
  CheckCircledIcon,
  FileTextIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import BlockNoteEditor from "./BlockNoteEditor";
import { journalService } from "../../services/journalService";
import { useAuth } from "../../contexts/AuthContext";

const DailyJournalModal = ({
  isOpen,
  onClose,
  date,
  focusHabit = null,
  habits = [],
  habitEntries = {},
  onSave,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [entry, setEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved"); // 'saving', 'saved', 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const [editor, setEditor] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");

  // Format date for display
  const formattedDate = useMemo(() => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
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
    setErrorMessage("");

    try {
      if (!isAuthenticated) {
        // Create a blank entry for unauthenticated users
        const dateStr = journalService.formatDateForAPI(date);
        const newEntry = {
          _id: null,
          userId: null,
          date: dateStr,
          richContent: null,
          plainTextContent: "",
          mood: null,
          energy: null,
          tags: [],
          wordCount: 0,
        };
        setEntry(newEntry);
        setMood(null);
        setEnergy(null);
        setTags([]);
        setWordCount(0);
        setErrorMessage("Please log in to save and sync your journal entries");
        return;
      }

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
          plainTextContent: "",
          mood: null,
          energy: null,
          tags: [],
          wordCount: 0,
        };
        setEntry(newEntry);
        setMood(null);
        setEnergy(null);
        setTags([]);
        setWordCount(0);
      }
    } catch (error) {
      console.error("Error loading journal entry:", error);
      setErrorMessage(
        error.message?.includes("log in")
          ? "Please log in to access your journal"
          : "Failed to load journal entry"
      );
      setSaveStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (content) => {
      if (!date) return;

      if (!isAuthenticated) {
        setErrorMessage("Please log in to save your journal entries");
        setSaveStatus("error");
        return;
      }

      setSaving(true);
      setSaveStatus("saving");
      setErrorMessage(""); // Clear any previous errors

      try {
        const dateStr = journalService.formatDateForAPI(date);
        const plainText = journalService.extractPlainText(content);
        const newWordCount = journalService.getWordCount(plainText);

        // Only save if there's actual content or metadata changes
        if (newWordCount === 0 && !mood && !energy && (!tags || tags.length === 0)) {
          console.log('Skipping save - no content or metadata to save');
          setSaving(false);
          return;
        }

        const updateData = {
          richContent: content,
          plainTextContent: plainText,
          wordCount: newWordCount,
          mood,
          energy,
          tags,
          createdVia: "modal",
        };

        const savedEntry = await journalService.saveDailyJournal(
          dateStr,
          updateData
        );
        setEntry(savedEntry);
        setWordCount(newWordCount);
        setSaveStatus("saved");
        setErrorMessage(""); // Clear any previous errors

        // Notify parent of save
        if (onSave) {
          onSave(savedEntry);
        }
      } catch (error) {
        console.error("Error saving journal:", error);
        setErrorMessage(error.message || "Failed to save journal entry");
        setSaveStatus("error");
      } finally {
        setSaving(false);
      }
    }, 1500),
    [date, mood, energy, tags, onSave]
  );

  // Handle editor content changes
  const handleEditorChange = useCallback(
    (content, editorInstance) => {
      const plainText = journalService.extractPlainText(content);
      const newWordCount = journalService.getWordCount(plainText);
      setWordCount(newWordCount);

      // Auto-save
      debouncedSave(content);
    },
    [debouncedSave]
  );

  // Handle mood change
  const handleMoodChange = (newMood) => {
    setMood(newMood);
    setSaveStatus("saving");
  };

  // Handle energy change
  const handleEnergyChange = (newEnergy) => {
    setEnergy(newEnergy);
    setSaveStatus("saving");
  };

  // Handle tag management
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setNewTag("");
      setSaveStatus("saving");
    }
  };

  const removeTag = (tagToRemove) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
    setSaveStatus("saving");
  };

  // Save metadata changes (only if entry exists in database)
  useEffect(() => {
    if (
      entry &&
      entry._id && // Only save metadata if entry exists in database
      (mood !== entry.mood ||
        energy !== entry.energy ||
        JSON.stringify(tags) !== JSON.stringify(entry.tags))
    ) {
      const saveMetadata = async () => {
        try {
          const dateStr = journalService.formatDateForAPI(date);
          const updateData = { mood, energy, tags };
          await journalService.updateDailyJournal(dateStr, updateData);
          setSaveStatus("saved");
        } catch (error) {
          console.error("Error saving metadata:", error);
          setSaveStatus("error");
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
    setNewTag("");
    setWordCount(0);
    setSaveStatus("saved");
    onClose();
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl max-w-6xl w-full max-h-[90vh] flex overflow-hidden z-10 transform transition-all duration-200 scale-100">
        {/* Authentication Warning Banner */}
        {!isAuthenticated && (
          <div className="absolute top-0 left-0 right-0 bg-amber-50 border-b border-amber-200 px-6 py-3 z-20">
            <div className="flex items-center gap-3 text-amber-800">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium">
                Please log in to save your journal entries
              </span>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <div
          className={`w-72 border-r border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] p-6 overflow-auto ${
            !isAuthenticated ? "pt-20" : ""
          }`}
        >
          <div className="space-y-6">
            {/* Date and basic info */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                Daily Journal
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {formattedDate}
              </p>
            </div>

            {/* Mood selector */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
                How was your mood today?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleMoodChange(value)}
                    className={`
                        w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200
                        ${
                          mood === value
                            ? "bg-blue-600 text-white shadow-md scale-105"
                            : "bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] hover:border-blue-300"
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
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
                What was your energy level?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleEnergyChange(value)}
                    className={`
                        w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200
                        ${
                          energy === value
                            ? "bg-green-600 text-white shadow-md scale-105"
                            : "bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] hover:border-green-300"
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
                <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
                  Today's Habits
                </h4>
                <div className="space-y-2">
                  {habits.map((habit) => {
                    const habitEntry = habitEntries[habit.id];
                    const isCompleted = habitEntry?.completed;
                    const isFocused = focusHabit?.id === habit.id;

                    return (
                      <div
                        key={habit.id}
                        className={`
                            flex items-center gap-3 p-3 rounded-lg text-sm transition-colors
                            ${
                              isFocused
                                ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-600"
                                : "bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] hover:bg-[var(--color-surface-hover)]"
                            }
                          `}
                      >
                        <span className="text-lg">{habit.icon}</span>
                        <span
                          className={`flex-1 font-medium ${
                            isCompleted
                              ? "text-[var(--color-text-primary)]"
                              : "text-[var(--color-text-secondary)]"
                          }`}
                        >
                          {habit.name}
                        </span>
                        {isCompleted && (
                          <CheckCircledIcon className="w-4 h-4 text-green-500" />
                        )}
                        {habitEntry?.notes && (
                          <FileTextIcon className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main editor area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-primary)] bg-[var(--color-surface-primary)]">
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Write your thoughts
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Reflect on your day, habits, and experiences
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Save status */}
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === "saving" && (
                  <div className="flex items-center gap-2 text-blue-700">
                    <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium">Saving...</span>
                  </div>
                )}
                {saveStatus === "saved" && (
                  <span className="text-green-700 font-medium">✓ Saved</span>
                )}
                {saveStatus === "error" && (
                  <span className="text-red-700 font-bold">Error saving</span>
                )}
              </div>

              <button
                onClick={handleClose}
                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
              >
                <Cross2Icon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 p-6 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                  <div className="w-6 h-6 border-2 border-[var(--color-text-tertiary)] border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="font-medium">Loading your journal...</span>
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
          <div className="border-t border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-6 py-4">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-4 text-[var(--color-text-secondary)]">
                <span className="font-medium">{wordCount} words</span>
                <span>•</span>
                <span>{journalService.getReadingTime(wordCount)} min read</span>
                {entry?.lastEditedAt && (
                  <>
                    <span>•</span>
                    <span>
                      Last edited{" "}
                      {new Date(entry.lastEditedAt).toLocaleTimeString()}
                    </span>
                  </>
                )}

                {/* Save status indicator */}
                <span>•</span>
                <div className="flex items-center gap-2">
                  {saveStatus === "saving" && (
                    <>
                      <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-blue-700 font-medium">
                        Saving...
                      </span>
                    </>
                  )}
                  {saveStatus === "saved" && (
                    <>
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-green-700 font-medium">Saved</span>
                    </>
                  )}
                  {saveStatus === "error" && (
                    <>
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                      <span className="text-red-700 font-bold">Error</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Error message */}
                {errorMessage && (
                  <div className="text-red-800 font-bold bg-red-100 px-3 py-1 rounded-md border border-red-200">
                    {errorMessage}
                  </div>
                )}
                <div className="text-xs text-[var(--color-text-tertiary)]">
                  Press Esc to close
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
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
