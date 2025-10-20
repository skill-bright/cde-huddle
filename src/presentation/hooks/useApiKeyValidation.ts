import { useState, useEffect, useCallback } from 'react';
import { ApiKeyValidationService } from '@/infrastructure/services/ApiKeyValidationService';
import { useToast } from './useToast';

export function useApiKeyValidation(autoValidate = false) {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);
  const { showError, showWarning, showSuccess, showInfo } = useToast();

  /**
   * Validate API key setup and show appropriate toasts
   */
  const validateApiKeySetup = useCallback(async (showSuccessToast = false) => {
    const validationService = new ApiKeyValidationService();
    setIsValidating(true);
    
    try {
      const result = await validationService.validateApiKeySetup();
      
      if (result.isSetup) {
        if (showSuccessToast) {
          showSuccess(
            'API Keys Configured',
            'All API keys are properly set up and working correctly.',
            3000
          );
        }
        setLastValidation(new Date());
        return true;
      } else {
        // Show the first error as the main toast
        if (result.issues.length > 0) {
          const firstIssue = result.issues[0];
          if (firstIssue.type === 'error') {
            showError(firstIssue.title, firstIssue.message, 8000);
          } else {
            showWarning(firstIssue.title, firstIssue.message, 6000);
          }

          // Show additional issues as info toasts
          result.issues.slice(1).forEach((issue, index) => {
            setTimeout(() => {
              if (issue.type === 'error') {
                showError(issue.title, issue.message, 6000);
              } else {
                showWarning(issue.title, issue.message, 5000);
              }
            }, (index + 1) * 1000);
          });
        }
        return false;
      }
    } catch (error) {
      console.error('Error validating API key setup:', error);
      showError(
        'Validation Error',
        'Failed to validate API key configuration. Please check your setup.',
        5000
      );
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [showError, showWarning, showSuccess]);

  /**
   * Check API key setup on component mount (only if autoValidate is true)
   */
  useEffect(() => {
    if (!autoValidate) return;
    
    // Only validate if we haven't validated recently (within 5 minutes)
    const shouldValidate = !lastValidation || 
      (Date.now() - lastValidation.getTime()) > 5 * 60 * 1000;

    if (shouldValidate) {
      validateApiKeySetup();
    }
  }, [autoValidate, lastValidation, validateApiKeySetup]);

  /**
   * Show a specific API key error
   */
  const showApiKeyError = useCallback((error: string, details?: string) => {
    showError('API Key Error', details || error, 8000);
  }, [showError]);

  /**
   * Show API key success message
   */
  const showApiKeySuccess = useCallback((message: string) => {
    showSuccess('API Key Updated', message, 4000);
  }, [showSuccess]);

  /**
   * Show API key warning
   */
  const showApiKeyWarning = useCallback((title: string, message: string) => {
    showWarning(title, message, 6000);
  }, [showWarning]);

  /**
   * Show setup instructions
   */
  const showSetupInstructions = useCallback(() => {
    showInfo(
      'API Key Setup Required',
      'Please set up your Anthropic API key in the database. Check the setup guide for instructions.',
      10000
    );
  }, [showInfo]);

  return {
    isValidating,
    validateApiKeySetup,
    showApiKeyError,
    showApiKeySuccess,
    showApiKeyWarning,
    showSetupInstructions,
    lastValidation
  };
}
