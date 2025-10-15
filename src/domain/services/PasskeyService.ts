/**
 * Service interface for passkey management
 */
export interface PasskeyService {
  /**
   * Validate a passkey
   * @param passkey The passkey to validate
   * @returns Promise<boolean> True if valid, false otherwise
   */
  validatePasskey(passkey: string): Promise<boolean>;

  /**
   * Get all passkeys (for management)
   * @returns Promise<Passkey[]>
   */
  getAllPasskeys(): Promise<Passkey[]>;

  /**
   * Create a new passkey
   * @param passkey The passkey data
   * @returns Promise<Passkey>
   */
  createPasskey(passkey: Omit<Passkey, 'id' | 'createdAt' | 'updatedAt'>): Promise<Passkey>;

  /**
   * Update a passkey
   * @param id The passkey ID
   * @param updates The updates to apply
   * @returns Promise<Passkey>
   */
  updatePasskey(id: string, updates: Partial<Omit<Passkey, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Passkey>;

  /**
   * Delete a passkey
   * @param id The passkey ID
   * @returns Promise<void>
   */
  deletePasskey(id: string): Promise<void>;
}

/**
 * Passkey entity
 */
export interface Passkey {
  id: string;
  keyName: string;
  keyValue: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
