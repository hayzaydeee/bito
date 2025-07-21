import React, { useEffect, useMemo } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { useTheme } from '../../contexts/ThemeContext';

// Import BlockNote styles
import '@blocknote/core/fonts/inter.css';
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
  
  // Safely process initial content - ensure it's always a valid BlockNote structure
  const processedInitialContent = useMemo(() => {
    // Helper function to sanitize block content
    const sanitizeBlockContent = (content) => {
      if (!Array.isArray(content)) {
        return [];
      }
      
      return content.map(item => {
        if (typeof item === 'string') {
          return item;
        }
        
        if (item && typeof item === 'object') {
          // Ensure text content has proper structure
          if (item.type === 'text' || item.text !== undefined) {
            return {
              type: 'text',
              text: String(item.text || ''),
              styles: item.styles || {}
            };
          }
          
          // Handle other content types
          return {
            type: item.type || 'text',
            text: String(item.text || item.content || ''),
            styles: item.styles || {}
          };
        }
        
        return '';
      }).filter(item => item !== ''); // Remove empty items
    };
    
    // Helper function to create a valid block
    const createValidBlock = (block) => {
      if (!block || typeof block !== 'object') {
        return {
          id: crypto.randomUUID?.() || Math.random().toString(36),
          type: "paragraph",
          props: {},
          content: []
        };
      }
      
      const blockType = block.type || "paragraph";
      const blockContent = sanitizeBlockContent(block.content || []);
      
      return {
        id: block.id || crypto.randomUUID?.() || Math.random().toString(36),
        type: blockType,
        props: block.props || {},
        content: blockContent
      };
    };
    
    // If no initial content or invalid format, return default empty paragraph
    if (!initialContent) {
      return [createValidBlock(null)];
    }
    
    // Handle different content formats
    let contentArray;
    
    if (Array.isArray(initialContent)) {
      contentArray = initialContent;
    } else if (typeof initialContent === 'object') {
      // Single block object
      contentArray = [initialContent];
    } else {
      // Invalid format
      return [createValidBlock(null)];
    }
    
    // Sanitize and validate each block
    const validatedContent = contentArray
      .filter(block => block != null) // Remove null/undefined blocks
      .map(createValidBlock);
    
    // Ensure we have at least one block
    if (validatedContent.length === 0) {
      return [createValidBlock(null)];
    }
    
    return validatedContent;
  }, [initialContent]);
  
  // Add debug logging
  console.log('BlockNote initialContent received:', initialContent);
  console.log('BlockNote processedInitialContent:', processedInitialContent);
  
  // Create editor instance - let React handle errors with error boundaries
  const editor = useCreateBlockNote({
    initialContent: processedInitialContent,
    animations: true,
    defaultStyles: true,
    trailingBlock: true
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
    if (editor && initialContent && Array.isArray(initialContent) && initialContent.length > 0) {
      // Validate the content structure before updating
      const isValidContent = initialContent.every(block => 
        block && 
        typeof block === 'object' && 
        block.type && 
        Array.isArray(block.content)
      );
      
      if (!isValidContent) {
        console.warn('Invalid BlockNote content structure:', initialContent);
        return;
      }
      
      // Only update if content is different to avoid cursor issues
      try {
        const currentContent = JSON.stringify(editor.document);
        const newContent = JSON.stringify(initialContent);
        
        if (currentContent !== newContent) {
          editor.replaceBlocks(editor.document, initialContent);
        }
      } catch (error) {
        console.error('Error updating editor content:', error);
      }
    }
  }, [editor, initialContent]);

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
        className="min-h-[400px] focus:outline-none"
        placeholder={placeholder}
      />
    </div>
  );
};

export default BlockNoteEditor;
