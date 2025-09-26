import React from 'react';
import { X, Check, XCircle, Sparkles, Loader2 } from 'lucide-react';

interface AIPreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  generatedContent: {
    yesterday?: string;
    today?: string;
    blockers?: string;
  };
  onAccept: (field: 'yesterday' | 'today' | 'blockers', content: string) => void;
  onAcceptAll: () => void;
  loading: boolean;
  fieldType?: 'yesterday' | 'today' | 'blockers' | 'full';
}

export function AIPreviewPanel({
  isOpen,
  onClose,
  generatedContent,
  onAccept,
  onAcceptAll,
  loading,
  fieldType = 'full'
}: AIPreviewPanelProps) {
  if (!isOpen) return null;

  const hasContent = generatedContent.yesterday || generatedContent.today || generatedContent.blockers;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-50">
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl w-full max-w-2xl h-full overflow-y-auto border-l border-white/20 dark:border-gray-700/20">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100/80 dark:bg-purple-900/30 rounded-full flex items-center justify-center border border-purple-200/50 dark:border-purple-700/50">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Generated Content</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Review and accept the AI suggestions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-lg transition-all duration-200 border border-white/20 dark:border-gray-700/20"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Generating AI content...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This may take a few moments</p>
              </div>
            </div>
          ) : !hasContent ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/40 dark:bg-gray-800/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 dark:border-gray-700/30">
                <Sparkles className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">No AI content generated yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Click the AI generation buttons to get started</p>
            </div>
          ) : (
            <>
              {/* Yesterday Section */}
              {generatedContent.yesterday && (
                <div className="border border-white/20 dark:border-gray-700/20 rounded-xl p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                      What did you do yesterday?
                    </h3>
                    <button
                      onClick={() => onAccept('yesterday', generatedContent.yesterday!)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-400 bg-green-50/80 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/50 rounded-lg hover:bg-green-100/80 dark:hover:bg-green-800/30 transition-all duration-200"
                    >
                      <Check className="w-4 h-4" />
                      Accept
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-700/60 p-3 rounded-lg dark:prose-invert">
                    <div dangerouslySetInnerHTML={{ __html: generatedContent.yesterday }} />
                  </div>
                </div>
              )}

              {/* Today Section */}
              {generatedContent.today && (
                <div className="border border-white/20 dark:border-gray-700/20 rounded-xl p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                      What will you do today?
                    </h3>
                    <button
                      onClick={() => onAccept('today', generatedContent.today!)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-lg hover:bg-blue-100/80 dark:hover:bg-blue-800/30 transition-all duration-200"
                    >
                      <Check className="w-4 h-4" />
                      Accept
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-700/60 p-3 rounded-lg dark:prose-invert">
                    <div dangerouslySetInnerHTML={{ __html: generatedContent.today }} />
                  </div>
                </div>
              )}

              {/* Blockers Section */}
              {generatedContent.blockers && (
                <div className="border border-white/20 dark:border-gray-700/20 rounded-xl p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full"></div>
                      Any blockers or challenges?
                    </h3>
                    <button
                      onClick={() => onAccept('blockers', generatedContent.blockers!)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/50 rounded-lg hover:bg-red-100/80 dark:hover:bg-red-800/30 transition-all duration-200"
                    >
                      <Check className="w-4 h-4" />
                      Accept
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-700/60 p-3 rounded-lg dark:prose-invert">
                    <div dangerouslySetInnerHTML={{ __html: generatedContent.blockers }} />
                  </div>
                </div>
              )}

              {/* Accept All Button */}
              {fieldType === 'full' && hasContent && (
                <div className="pt-4 border-t border-white/20 dark:border-gray-700/20">
                  <button
                    onClick={onAcceptAll}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-purple-600 dark:bg-purple-500 border border-transparent rounded-xl hover:bg-purple-700 dark:hover:bg-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Check className="w-4 h-4" />
                    Accept All AI Suggestions
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
