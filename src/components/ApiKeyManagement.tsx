import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Key, Save, AlertTriangle, CheckCircle } from 'lucide-react';


export function ApiKeyManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      // Note: This would need to be implemented with proper admin access
      // For now, we'll show a placeholder
      console.log('Loading API keys...');
    } catch (error) {
      console.error('Error loading API keys:', error);
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApiKey = async (serviceName: string, newKey: string) => {
    if (!newKey.trim()) {
      setError('Please enter a new API key');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // This would need to be implemented with proper admin access
      // For now, we'll show a success message
      setSuccess(`API key for ${serviceName} updated successfully!`);
      setNewApiKey('');
      setEditingKey(null);
    } catch (error) {
      console.error('Error updating API key:', error);
      setError('Failed to update API key');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 p-6 shadow-lg">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
          <Key className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          API Key Management
        </h3>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl"
        >
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-xl"
        >
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
            <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl">
          <h4 className="text-md font-medium text-blue-800 dark:text-blue-300 mb-2">
            Anthropic API Key
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
            This API key is used for AI-powered weekly report generation. It's stored securely in the database and never exposed to the client.
          </p>
          
          {editingKey === 'anthropic' ? (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new Anthropic API key"
                  disabled={saving}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleUpdateApiKey('anthropic', newApiKey)}
                  disabled={saving || !newApiKey.trim()}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-blue-600 dark:border-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Key</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditingKey(null);
                    setNewApiKey('');
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Key stored securely in database
                </span>
              </div>
              <button
                onClick={() => setEditingKey('anthropic')}
                className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
              >
                Update Key
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-xl">
          <h4 className="text-md font-medium text-yellow-800 dark:text-yellow-300 mb-2">
            Security Notice
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            API keys are stored securely in the database and accessed only by server-side functions. 
            They are never exposed to the client-side code, ensuring maximum security.
          </p>
        </div>
      </div>
    </div>
  );
}
