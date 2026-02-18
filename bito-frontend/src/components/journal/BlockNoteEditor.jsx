import React, { useEffect, useMemo } from 'react';
import { useCreateBlockNote, SuggestionMenuController } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { offset, flip, shift, size } from '@floating-ui/react';
import { useTheme } from '../../contexts/ThemeContext';
import { sanitizeDocument } from '../../utils/sanitizeBlock';
import { journalV2Service } from '../../services/journalV2Service';

// Import BlockNote styles (Inter font intentionally omitted — app uses EB Garamond + League Spartan)
import '@blocknote/mantine/style.css';

const BlockNoteEditor = ({ 
  initialContent = null, 
  onChange, 
  onReady,
  placeholder = "Start writing your journal entry...",
  editable = true,
  className = ""
}) => {
  const { effectiveTheme } = useTheme();
  
  // State to handle editor errors
  const [editorError, setEditorError] = React.useState(null);
  
  // Reset error when initialContent changes
  React.useEffect(() => {
    setEditorError(null);
  }, [initialContent]);
  
  // Safely process initial content using shared sanitizer
  const processedInitialContent = useMemo(
    () => sanitizeDocument(initialContent),
    [initialContent]
  );
  
  // Create editor with default configuration - BlockNote includes all block types by default
  const editor = useCreateBlockNote({
    initialContent: processedInitialContent,
    animations: true,
    defaultStyles: true,
    trailingBlock: true,
    // Upload handler for image / file blocks (drag-drop, paste, toolbar)
    uploadFile: async (file) => {
      // Reject video uploads (too heavy)
      if (file.type.startsWith('video/')) {
        throw new Error('Video uploads are not supported. Try linking a video URL instead.');
      }
      const url = await journalV2Service.uploadImage(file);
      return url;
    },
  });
  
  // If editor creation failed, the component will unmount and remount

  // Handle editor changes
  useEffect(() => {
    if (!editor || !onChange) return;

    const handleUpdate = () => {
      const content = editor.document;
      onChange(content, editor);
    };

    // Listen for document changes
    const unsubscribe = editor.onChange(handleUpdate);

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [editor, onChange]);

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onReady) {
      onReady(editor);
    }
  }, [editor, onReady]);

  if (editorError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-[var(--color-surface-secondary)] rounded-lg p-4">
        <div className="text-[var(--color-text-secondary)] text-center">
          <p className="text-lg font-medium mb-2">Editor Error</p>
          <p className="text-sm mb-4">There was an issue loading the journal editor.</p>
          <button 
            onClick={() => {
              setEditorError(null);
              window.location.reload();
            }}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary-dark)]"
          >
            Reload Editor
          </button>
        </div>
      </div>
    );
  }

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64 bg-[var(--color-surface-secondary)] rounded-lg">
        <div className="text-[var(--color-text-secondary)]">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className={`blocknote-editor ${className}`}>
      <BlockNoteView
        editor={editor}
        theme={effectiveTheme}
        editable={editable}
        className="min-h-[300px] focus:outline-none"
        placeholder={placeholder}
        slashMenu={false}
      >
        {/* Slash menu: prefer opening above the cursor so it stays
            accessible inside the scrollable editor card. Falls back
            to bottom-start when near the top (e.g. first line). */}
        <SuggestionMenuController
          triggerCharacter="/"
          floatingUIOptions={{
            useFloatingOptions: {
              placement: 'top-start',
              middleware: [
                offset(10),
                flip({ fallbackPlacements: ['bottom-start'], padding: 10 }),
                shift(),
                size({
                  apply({ elements, availableHeight }) {
                    elements.floating.style.maxHeight = `${Math.max(0, availableHeight)}px`;
                  },
                  padding: 10,
                }),
              ],
            },
          }}
        />
      </BlockNoteView>
    </div>
  );
};

export default BlockNoteEditor;
