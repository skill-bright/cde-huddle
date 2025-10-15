import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw, Settings, Key } from 'lucide-react';
import { useApiKeyValidation } from '@/presentation/hooks/useApiKeyValidation';
import { SupabasePasskeyService } from '@/infrastructure/services/SupabasePasskeyService';

export function ApiKeyStatusChecker() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isValidating, validateApiKeySetup } = useApiKeyValidation();

  const handleValidate = async () => {
    await validateApiKeySetup(true); // Show success toast if valid
  };

  const handleTestPasskey = async () => {
    console.log('🔑 Testing passkey system...');
    const passkeyService = new SupabasePasskeyService();
    
    // Test fetching all passkeys
    const passkeys = await passkeyService.getAllPasskeys();
    console.log('🔑 Available passkeys:', passkeys);
    
    // Test validating the default passkey
    const isValid = await passkeyService.validatePasskey('huddle2025');
    console.log('🔑 Default passkey validation result:', isValid);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg"
      >
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>API Status</span>
          </button>
        ) : (
          <div className="p-4 min-w-[300px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                API Key Status
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span className="text-gray-500 dark:text-gray-400">×</span>
              </button>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Check if your Anthropic API key and Edge Function are properly configured.
            </p>
            
            <div className="space-y-2">
              <button
                onClick={handleValidate}
                disabled={isValidating}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-blue-600 dark:border-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Check API Status</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleTestPasskey}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 dark:bg-purple-500 border border-purple-600 dark:border-purple-500 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
              >
                <Key className="w-4 h-4" />
                <span>Test Passkey</span>
              </button>
            </div>
            
            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700 dark:text-blue-400">
                  <p className="font-medium mb-1">Setup Required:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Deploy Edge Function: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">./scripts/deploy-edge-functions.sh</code></li>
                    <li>• Set up API key in database</li>
                    <li>• Check the setup guide for details</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
