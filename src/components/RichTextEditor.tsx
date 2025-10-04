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
    resize: 'vertical',
    resize_use_css: false,
    resize_overflow: false,
    resize_overflow_x: false,
    resize_overflow_y: false,
    resize_overflow_xy: false,
    resize_overflow_auto: false,
    resize_handle_style: 'margin: 0; padding: 0; border: none; background: transparent;',
    statusbar: true,
    min_height: parseInt(minHeight),
    max_height: 600,
    skin: isDarkMode ? 'oxide-dark' : 'oxide',
    content_css: isDarkMode ? 'dark' : 'default',
    // Enhanced styling options
    setup: (editor: unknown) => {
      const editorInstance = editor as { 
        on: (event: string, callback: () => void) => void; 
        getContainer: () => HTMLElement;
        getBody: () => HTMLElement;
      };
      
      editorInstance.on('init', () => {
        // Add custom classes to the editor
        const container = editorInstance.getContainer();
        container.classList.add('custom-tinymce-editor');
        if (isDarkMode) {
          container.classList.add('dark-mode');
        }
        
        // Handle resize events for smooth dragging
        const resizeHandle = container.querySelector('.tox-statusbar__resize-handle') as HTMLElement;
        if (resizeHandle) {
          let isResizing = false;
          
          const startResize = () => {
            isResizing = true;
            container.classList.add('resizing');
            
            // Force disable all transitions and set fixed positioning
            const allElements = container.querySelectorAll('*');
            allElements.forEach(el => {
              const element = el as HTMLElement;
              element.style.transition = 'none';
              element.style.animation = 'none';
              element.style.willChange = 'auto';
            });
            
            // Ensure the statusbar and resize handle maintain their position
            const statusbar = container.querySelector('.tox-statusbar') as HTMLElement;
            const resizeHandle = container.querySelector('.tox-statusbar__resize-handle') as HTMLElement;
            
            if (statusbar) {
              statusbar.style.position = 'relative';
              statusbar.style.zIndex = '1000';
              statusbar.style.flexShrink = '0';
            }
            
            if (resizeHandle) {
              resizeHandle.style.position = 'absolute';
              resizeHandle.style.bottom = '0';
              resizeHandle.style.left = '0';
              resizeHandle.style.right = '0';
              resizeHandle.style.width = '100%';
              resizeHandle.style.height = '8px';
              resizeHandle.style.zIndex = '1001';
            }
          };
          
          const endResize = () => {
            if (isResizing) {
              isResizing = false;
              container.classList.remove('resizing');
              // Re-enable transitions after a short delay
              setTimeout(() => {
                const allElements = container.querySelectorAll('*');
                allElements.forEach(el => {
                  (el as HTMLElement).style.transition = '';
                  (el as HTMLElement).style.animation = '';
                });
              }, 100);
            }
          };
          
          resizeHandle.addEventListener('mousedown', startResize);
          document.addEventListener('mouseup', endResize);
          document.addEventListener('mouseleave', endResize);
          
          // Also handle touch events for mobile
          resizeHandle.addEventListener('touchstart', startResize);
          document.addEventListener('touchend', endResize);
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