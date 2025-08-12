import { useMemo, useCallback } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = '120px' }: RichTextEditorProps) {
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
    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; }',
    placeholder: placeholder || 'Start typing...',
    branding: false,
    elementpath: false,
    resize: true, // Enable TinyMCE's built-in resize
    statusbar: true, // Show status bar which contains the resize handle
    min_height: parseInt(minHeight), // Set minimum height
    max_height: 600, // Set maximum height
  }), [minHeight, placeholder]);

  const handleEditorChange = useCallback((content: string) => {
    onChange(content);
  }, [onChange]);

  return (
    <div className="border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all duration-200">
      <Editor
        apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
        init={init}
        value={value}
        onEditorChange={handleEditorChange}
      />
    </div>
  );
} 