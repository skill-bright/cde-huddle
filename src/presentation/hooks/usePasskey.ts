import { useState, useCallback, useMemo } from 'react';
import { SupabasePasskeyService } from '@/infrastructure/services/SupabasePasskeyService';
import { useToast } from './useToast';

export function usePasskey() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    description: '',
    actionLabel: ''
  });

  const passkeyService = useMemo(() => new SupabasePasskeyService(), []);
  const { showError } = useToast();

  const validatePasskey = useCallback(async (passkey: string): Promise<boolean> => {
    try {
      return await passkeyService.validatePasskey(passkey);
    } catch (error) {
      console.error('Error validating passkey:', error);
      return false;
    }
  }, [passkeyService]);

  const showPasskeyModal = useCallback((
    action: () => void,
    title: string,
    description: string,
    actionLabel: string
  ) => {
    setPendingAction(() => action);
    setModalConfig({ title, description, actionLabel });
    setIsModalOpen(true);
  }, []);

  const handlePasskeyConfirm = useCallback(async (passkey: string) => {
    console.log('🔐 Passkey validation started...');
    const isValid = await validatePasskey(passkey);
    console.log('🔐 Passkey validation result:', isValid);
    
    if (isValid) {
      console.log('✅ Passkey valid, executing action...');
      setIsModalOpen(false);
      setPendingAction(null);
      if (pendingAction) {
        console.log('🚀 Calling pending action...');
        try {
          await pendingAction();
          console.log('✅ Action completed successfully');
        } catch (error) {
          console.error('❌ Action failed:', error);
        }
      }
    } else {
      console.log('❌ Passkey invalid, closing modal');
      showError(
        'Invalid Passkey',
        'The passkey you entered is incorrect. Please try again.',
        4000
      );
      setIsModalOpen(false);
      setPendingAction(null);
    }
  }, [validatePasskey, pendingAction, showError]);

  const handlePasskeyCancel = useCallback(() => {
    setIsModalOpen(false);
    setPendingAction(null);
  }, []);

  return {
    isModalOpen,
    modalConfig,
    showPasskeyModal,
    handlePasskeyConfirm,
    handlePasskeyCancel
  };
}
