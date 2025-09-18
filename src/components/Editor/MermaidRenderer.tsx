import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  content: string;
}

export function MermaidRenderer({ content }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize mermaid with basic config
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: '"ui-sans-serif", system-ui, sans-serif',
    });
  }, []);

  useEffect(() => {
    if (!content.trim() || !containerRef.current) {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      setError(null);
      return;
    }

    const renderMermaid = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Generate a unique ID for each diagram
        const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Clear the container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Validate and render the diagram
        const { svg } = await mermaid.render(diagramId, content);
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the rendering to avoid excessive re-renders
    const timeoutId = setTimeout(renderMermaid, 300);
    return () => clearTimeout(timeoutId);
  }, [content]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700">Mermaid Preview</h3>
      </div>
      <div className="flex-1 p-4 overflow-auto bg-white">
        {isLoading && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2">Rendering diagram...</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Invalid Mermaid Syntax</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {!content.trim() && !isLoading && !error && (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-2">Start typing Mermaid syntax to see the preview</p>
              <p className="text-xs mt-1">Try: <code className="bg-gray-100 px-1 rounded">graph TD; A--&gt;B</code></p>
            </div>
          </div>
        )}
        <div 
          ref={containerRef} 
          className="mermaid-container"
          style={{ 
            display: isLoading || error || !content.trim() ? 'none' : 'block' 
          }}
        />
      </div>
    </div>
  );
}