import { useMemo, useCallback, useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = '120px' }: RichTextEditorProps) {
  // Check if TinyMCE API key is available, use 'no-api-key' as fallback
  const apiKey = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';
  
  // Check if dark mode is active
  const isDarkMode = document.documentElement.classList.contains('dark');

  // Use hooks for editor state management
  const [editorError, setEditorError] = useState(false);
  const [editorInitialized, setEditorInitialized] = useState(false);

  // Add timeout to detect if TinyMCE fails to initialize
  useEffect(() => {
    if (!editorError) {
      const timeout = setTimeout(() => {
        if (!editorInitialized) {
          console.warn('TinyMCE editor failed to initialize within timeout.');
          setEditorError(true);
        }
      }, 5000); // 5 second timeout

      return () => clearTimeout(timeout);
    }
  }, [editorError, editorInitialized]);

  // Fallback textarea component for error cases
  const FallbackTextarea = () => (
    <div className="relative">
      <div className="border border-white/30 dark:border-slate-600/30 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all duration-300 overflow-hidden bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Start typing...'}
          style={{ minHeight }}
          className="w-full p-4 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-vertical focus:outline-none font-mono text-sm leading-relaxed"
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500">
          Simple text editor (TinyMCE failed to load)
        </div>
      </div>
    </div>
  );
  
  // TinyMCE configuration - simplified and fixed
  const init = useMemo(() => ({
    height: parseInt(minHeight),
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | formatselect | ' +
      'bold italic | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'removeformat | help',
    // Simplified configuration
    inline: false,
    fixed_toolbar_container: false,
    // Remove problematic setup function and use simpler approach
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setup: (editor: any) => {
      editor.on('init', () => {
        setEditorInitialized(true);
      });
    },
    content_style: isDarkMode 
      ? 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; color: #e2e8f0; background-color: transparent; line-height: 1.6; } p { margin: 0 0 12px 0; } ul, ol { margin: 0 0 12px 0; padding-left: 20px; } .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before { color: #9ca3af; }'
      : 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; color: #374151; background-color: transparent; line-height: 1.6; } p { margin: 0 0 12px 0; } ul, ol { margin: 0 0 12px 0; padding-left: 20px; }',
    placeholder: placeholder || 'Start typing...',
    branding: false,
    elementpath: false,
    resize: 'vertical',
    statusbar: true,
    min_height: parseInt(minHeight),
    max_height: 600,
    skin: isDarkMode ? 'oxide-dark' : 'oxide',
    content_css: isDarkMode ? 'dark' : 'default',
  }), [minHeight, placeholder, isDarkMode]);

  const handleEditorChange = useCallback((content: string) => {
    onChange(content);
  }, [onChange]);

  // Render either TinyMCE editor or fallback textarea based on error state
  if (editorError) {
    console.warn('TinyMCE editor failed to load. Falling back to simple textarea.');
  }

  return (
    <>
      {editorError ? (
        <FallbackTextarea />
      ) : (
        <div className="relative">
          <div className="border border-white/30 dark:border-slate-600/30 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all duration-300 overflow-hidden bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm">
            <Editor
              key={`tinymce-${minHeight}-${isDarkMode}`}
              apiKey={apiKey}
              init={init}
              value={value}
              onEditorChange={handleEditorChange}
              onInit={() => {
                setEditorInitialized(true);
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onError={(error: any) => {
                console.error('TinyMCE editor error:', error);
                setEditorError(true);
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onFailure={(error: any) => {
                console.error('TinyMCE editor failure:', error);
                setEditorError(true);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
} 