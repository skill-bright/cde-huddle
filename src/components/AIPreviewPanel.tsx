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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
      <div className="bg-white w-full max-w-2xl h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Generated Content</h2>
              <p className="text-sm text-gray-600">Review and accept the AI suggestions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Generating AI content...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
              </div>
            </div>
          ) : !hasContent ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">No AI content generated yet</p>
              <p className="text-sm text-gray-500 mt-2">Click the AI generation buttons to get started</p>
            </div>
          ) : (
            <>
              {/* Yesterday Section */}
              {generatedContent.yesterday && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      What did you do yesterday?
                    </h3>
                    <button
                      onClick={() => onAccept('yesterday', generatedContent.yesterday!)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors duration-200"
                    >
                      <Check className="w-4 h-4" />
                      Accept
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-md">
                    <div dangerouslySetInnerHTML={{ __html: generatedContent.yesterday }} />
                  </div>
                </div>
              )}

              {/* Today Section */}
              {generatedContent.today && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      What will you do today?
                    </h3>
                    <button
                      onClick={() => onAccept('today', generatedContent.today!)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors duration-200"
                    >
                      <Check className="w-4 h-4" />
                      Accept
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-md">
                    <div dangerouslySetInnerHTML={{ __html: generatedContent.today }} />
                  </div>
                </div>
              )}

              {/* Blockers Section */}
              {generatedContent.blockers && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Any blockers or challenges?
                    </h3>
                    <button
                      onClick={() => onAccept('blockers', generatedContent.blockers!)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors duration-200"
                    >
                      <Check className="w-4 h-4" />
                      Accept
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-md">
                    <div dangerouslySetInnerHTML={{ __html: generatedContent.blockers }} />
                  </div>
                </div>
              )}

              {/* Accept All Button */}
              {fieldType === 'full' && hasContent && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={onAcceptAll}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 transition-colors duration-200"
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
