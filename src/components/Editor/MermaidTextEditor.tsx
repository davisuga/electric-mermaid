import React, { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { ElectricProvider } from '../../y-electric';

interface MermaidTextEditorProps {
  provider: ElectricProvider;
  onContentChange: (content: string) => void;
}

export function MermaidTextEditor({ provider, onContentChange }: MermaidTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(`graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    B -->|No| D[End]
    C --> D`);
  const yTextRef = useRef<Y.Text | null>(null);
  const isUpdatingFromYjs = useRef(false);

  useEffect(() => {
    // Trigger initial content change
    onContentChange(content);
  }, []);

  useEffect(() => {
    if (!provider.doc) return;

    // Get or create the text content from Yjs
    const yText = provider.doc.getText('content');
    yTextRef.current = yText;

    // Only initialize if Yjs doesn't have content and we have sample content
    const existingContent = yText.toString();
    if (!existingContent && content) {
      yText.insert(0, content);
    } else if (existingContent) {
      setContent(existingContent);
      onContentChange(existingContent);
    }

    // Listen for changes from other clients
    const handleYjsUpdate = () => {
      isUpdatingFromYjs.current = true;
      const newContent = yText.toString();
      setContent(newContent);
      onContentChange(newContent);
      
      // Preserve cursor position
      if (textareaRef.current) {
        const cursorPos = textareaRef.current.selectionStart;
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(cursorPos, cursorPos);
          }
          isUpdatingFromYjs.current = false;
        });
      } else {
        isUpdatingFromYjs.current = false;
      }
    };

    yText.observe(handleYjsUpdate);

    return () => {
      yText.unobserve(handleYjsUpdate);
    };
  }, [provider, onContentChange]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isUpdatingFromYjs.current || !yTextRef.current) return;

    const newContent = e.target.value;
    const yText = yTextRef.current;
    
    // Calculate the diff and apply operations to Yjs
    const oldContent = content;
    
    // Simple approach: replace all content (can be optimized for better performance)
    provider.doc.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, newContent);
    });

    setContent(newContent);
    onContentChange(newContent);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700">Mermaid Editor</h3>
      </div>
      <div className="flex-1 p-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          className="w-full h-full resize-none border-none outline-none font-mono text-sm leading-relaxed"
          placeholder="Enter Mermaid diagram syntax here...

Example:
graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    B -->|No| D[End]
    C --> D"
          spellCheck={false}
        />
      </div>
    </div>
  );
}