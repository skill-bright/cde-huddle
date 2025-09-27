import { useMemo, useCallback } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = '120px' }: RichTextEditorProps) {
  // Check if dark mode is active
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  // TinyMCE configuration
  const init = useMemo(() => ({
    height: parseInt(minHeight),
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | formatselect | ' +
      'bold italic backcolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'removeformat | help',
    content_style: isDarkMode 
      ? 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; color: #e2e8f0; background-color: transparent; line-height: 1.6; } p { margin: 0 0 12px 0; } ul, ol { margin: 0 0 12px 0; padding-left: 20px; } .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before { color: #9ca3af; }'
      : 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; color: #374151; background-color: transparent; line-height: 1.6; } p { margin: 0 0 12px 0; } ul, ol { margin: 0 0 12px 0; padding-left: 20px; }',
    placeholder: placeholder || 'Start typing...',
    branding: false,
    elementpath: false,
    resize: true,
    statusbar: true,
    min_height: parseInt(minHeight),
    max_height: 600,
    skin: isDarkMode ? 'oxide-dark' : 'oxide',
    content_css: isDarkMode ? 'dark' : 'default',
    // Enhanced styling options
    setup: (editor: unknown) => {
      const editorInstance = editor as { on: (event: string, callback: () => void) => void; getContainer: () => HTMLElement };
      editorInstance.on('init', () => {
        // Add custom classes to the editor
        editorInstance.getContainer().classList.add('custom-tinymce-editor');
        if (isDarkMode) {
          editorInstance.getContainer().classList.add('dark-mode');
        }
      });
    },
  }), [minHeight, placeholder, isDarkMode]);

  const handleEditorChange = useCallback((content: string) => {
    onChange(content);
  }, [onChange]);

  return (
    <div className="relative">
      <div className="border border-white/30 dark:border-slate-600/30 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all duration-300 overflow-hidden bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm">
        <Editor
          apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
          init={init}
          value={value}
          onEditorChange={handleEditorChange}
        />
      </div>
    </div>
  );
} 