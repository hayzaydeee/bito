import React, { useEffect, useMemo } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';

// Import BlockNote styles
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

const BlockNoteEditor = ({ 
  initialContent = null, 
  onChange, 
  onReady,
  placeholder = "Start writing your journal entry...",
  editable = true,
  theme = "light",
  className = ""
}) => {
  // Create editor instance
  const editor = useCreateBlockNote({
    initialContent: initialContent || [
      {
        type: "paragraph",
        content: ""
      }
    ],
    animations: true,
    defaultStyles: true,
    trailingBlock: true
  });

  // Handle editor changes
  useEffect(() => {
    if (!editor || !onChange) return;

    const handleUpdate = () => {
      const content = editor.document;
      onChange(content, editor);
    };

    // Listen for document changes
    editor.onChange(handleUpdate);

    return () => {
      // Cleanup if needed
    };
  }, [editor, onChange]);

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onReady) {
      onReady(editor);
    }
  }, [editor, onReady]);

  // Update content when initialContent changes
  useEffect(() => {
    if (editor && initialContent !== null) {
      // Only update if content is different to avoid cursor issues
      const currentContent = JSON.stringify(editor.document);
      const newContent = JSON.stringify(initialContent);
      
      if (currentContent !== newContent) {
        editor.replaceBlocks(editor.document, initialContent);
      }
    }
  }, [editor, initialContent]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className={`blocknote-editor ${className}`}>
      <BlockNoteView
        editor={editor}
        theme={theme}
        editable={editable}
        className="min-h-[400px] focus:outline-none"
        placeholder={placeholder}
      />
    </div>
  );
};

export default BlockNoteEditor;
