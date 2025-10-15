import { createClient } from '@supabase/supabase-js';
import { PasskeyService, Passkey } from '@/domain/services/PasskeyService';

export class SupabasePasskeyService implements PasskeyService {
  private supabase;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  async validatePasskey(passkey: string): Promise<boolean> {
    try {
      console.log('🔐 SupabasePasskeyService: Validating passkey...');
      const { data, error } = await this.supabase
        .rpc('validate_passkey', { passkey_value: passkey });

      console.log('🔐 SupabasePasskeyService: RPC response:', { data, error });

      if (error) {
        console.error('❌ SupabasePasskeyService: Error validating passkey:', error);
        return false;
      }

      const isValid = data === true;
      console.log('🔐 SupabasePasskeyService: Validation result:', isValid);
      return isValid;
    } catch (error) {
      console.error('❌ SupabasePasskeyService: Exception validating passkey:', error);
      return false;
    }
  }

  async getAllPasskeys(): Promise<Passkey[]> {
    try {
      console.log('🔐 SupabasePasskeyService: Fetching all passkeys...');
      const { data, error } = await this.supabase
        .from('passkeys')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('🔐 SupabasePasskeyService: Passkeys response:', { data, error });

      if (error) {
        console.error('❌ SupabasePasskeyService: Error fetching passkeys:', error);
        return [];
      }

      const passkeys = data.map(this.mapToPasskey);
      console.log('🔐 SupabasePasskeyService: Mapped passkeys:', passkeys);
      return passkeys;
    } catch (error) {
      console.error('❌ SupabasePasskeyService: Exception fetching passkeys:', error);
      return [];
    }
  }

  async createPasskey(passkeyData: Omit<Passkey, 'id' | 'createdAt' | 'updatedAt'>): Promise<Passkey> {
    try {
      const { data, error } = await this.supabase
        .from('passkeys')
        .insert({
          key_name: passkeyData.keyName,
          key_value: passkeyData.keyValue,
          description: passkeyData.description,
          is_active: passkeyData.isActive
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating passkey:', error);
        throw new Error('Failed to create passkey');
      }

      return this.mapToPasskey(data);
    } catch (error) {
      console.error('Error creating passkey:', error);
      throw error;
    }
  }

  async updatePasskey(id: string, updates: Partial<Omit<Passkey, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Passkey> {
    try {
      const updateData: Record<string, unknown> = {};
      
      if (updates.keyName !== undefined) updateData.key_name = updates.keyName;
      if (updates.keyValue !== undefined) updateData.key_value = updates.keyValue;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await this.supabase
        .from('passkeys')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating passkey:', error);
        throw new Error('Failed to update passkey');
      }

      return this.mapToPasskey(data);
    } catch (error) {
      console.error('Error updating passkey:', error);
      throw error;
    }
  }

  async deletePasskey(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('passkeys')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting passkey:', error);
        throw new Error('Failed to delete passkey');
      }
    } catch (error) {
      console.error('Error deleting passkey:', error);
      throw error;
    }
  }

  private mapToPasskey(data: Record<string, unknown>): Passkey {
    return {
      id: data.id as string,
      keyName: data.key_name as string,
      keyValue: data.key_value as string,
      description: data.description as string,
      isActive: data.is_active as boolean,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string
    };
  }
}
