import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, Save, AlertTriangle } from 'lucide-react';
import { SupabasePasskeyService } from '@/infrastructure/services/SupabasePasskeyService';
import { Passkey } from '@/domain/services/PasskeyService';

export function PasskeyManagement() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPasskey, setShowCurrentPasskey] = useState(false);
  const [newPasskey, setNewPasskey] = useState('');
  const [showNewPasskey, setShowNewPasskey] = useState(false);

  const passkeyService = useMemo(() => new SupabasePasskeyService(), []);

  const loadPasskeys = useCallback(async () => {
    try {
      setLoading(true);
      const data = await passkeyService.getAllPasskeys();
      setPasskeys(data);
    } catch (error) {
      console.error('Error loading passkeys:', error);
      setError('Failed to load passkeys');
    } finally {
      setLoading(false);
    }
  }, [passkeyService]);

  useEffect(() => {
    loadPasskeys();
  }, [loadPasskeys]);

  const handleUpdatePasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPasskey.trim()) {
      setError('Please enter a new passkey');
      return;
    }

    if (newPasskey.length < 6) {
      setError('Passkey must be at least 6 characters long');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Find the weekly report generation passkey
      const weeklyReportPasskey = passkeys.find(p => p.keyName === 'weekly_report_generation');
      
      if (weeklyReportPasskey) {
        await passkeyService.updatePasskey(weeklyReportPasskey.id, {
          keyValue: newPasskey
        });
        setSuccess('Passkey updated successfully!');
        setNewPasskey('');
        await loadPasskeys();
      } else {
        setError('Weekly report passkey not found');
      }
    } catch (error) {
      console.error('Error updating passkey:', error);
      setError('Failed to update passkey');
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

  const weeklyReportPasskey = passkeys.find(p => p.keyName === 'weekly_report_generation');

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 p-6 shadow-lg">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
          <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Passkey Management
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
          <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
        </motion.div>
      )}

      {weeklyReportPasskey && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Current Weekly Report Passkey
          </h4>
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type={showCurrentPasskey ? 'text' : 'password'}
                value={weeklyReportPasskey.keyValue}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPasskey(!showCurrentPasskey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                {showCurrentPasskey ? (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {weeklyReportPasskey.description}
          </p>
        </div>
      )}

      <form onSubmit={handleUpdatePasskey} className="space-y-4">
        <div>
          <label htmlFor="newPasskey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New Passkey
          </label>
          <div className="relative">
            <input
              id="newPasskey"
              type={showNewPasskey ? 'text' : 'password'}
              value={newPasskey}
              onChange={(e) => setNewPasskey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter new passkey"
              disabled={saving}
            />
            <button
              type="button"
              onClick={() => setShowNewPasskey(!showNewPasskey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              disabled={saving}
            >
              {showNewPasskey ? (
                <EyeOff className="w-4 h-4 text-gray-500" />
              ) : (
                <Eye className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Minimum 6 characters. This will be used for generating weekly reports.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || !newPasskey.trim()}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-blue-600 dark:border-blue-500 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Updating...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Update Passkey</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
