/**
 * Service for validating API key availability and configuration
 */
export class ApiKeyValidationService {
  private supabaseUrl: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!this.supabaseUrl) {
      throw new Error('Missing VITE_SUPABASE_URL environment variable');
    }
  }

  /**
   * Check if the Anthropic API key is properly configured
   */
  async checkAnthropicApiKey(): Promise<{
    isConfigured: boolean;
    error?: string;
    details?: string;
  }> {
    try {
      // Test the Edge Function to see if it can access the API key
      const response = await fetch(`${this.supabaseUrl}/functions/v1/anthropic-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'Test'
            }
          ]
        })
      });

      if (response.status === 401) {
        return {
          isConfigured: false,
          error: 'API Key Not Found',
          details: 'The Anthropic API key is not configured in the database. Please set it up using the API Key Management.'
        };
      }

      if (response.status === 403) {
        return {
          isConfigured: false,
          error: 'API Key Invalid',
          details: 'The Anthropic API key in the database is invalid or expired. Please update it.'
        };
      }

      if (response.status === 500) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error?.includes('API key')) {
          return {
            isConfigured: false,
            error: 'API Key Error',
            details: 'There was an error with the API key configuration. Please check the setup.'
          };
        }
        return {
          isConfigured: false,
          error: 'Server Error',
          details: 'The Edge Function encountered an error. Please check the deployment.'
        };
      }

      if (response.ok) {
        return {
          isConfigured: true,
          details: 'Anthropic API key is properly configured and working.'
        };
      }

      return {
        isConfigured: false,
        error: 'Unknown Error',
        details: `Unexpected response: ${response.status} ${response.statusText}`
      };

    } catch (error) {
      console.error('Error checking API key:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          isConfigured: false,
          error: 'Network Error',
          details: 'Cannot connect to the Edge Function. Please check your internet connection and Supabase configuration.'
        };
      }

      return {
        isConfigured: false,
        error: 'Connection Error',
        details: 'Failed to connect to the API validation service.'
      };
    }
  }

  /**
   * Check if the Edge Function is deployed
   */
  async checkEdgeFunctionDeployment(): Promise<{
    isDeployed: boolean;
    error?: string;
    details?: string;
  }> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/anthropic-proxy`, {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });

      if (response.ok) {
        return {
          isDeployed: true,
          details: 'Edge Function is properly deployed and accessible.'
        };
      }

      if (response.status === 404) {
        return {
          isDeployed: false,
          error: 'Edge Function Not Found',
          details: 'The anthropic-proxy Edge Function is not deployed. Please run the deployment script.'
        };
      }

      return {
        isDeployed: false,
        error: 'Deployment Error',
        details: `Edge Function returned status: ${response.status}`
      };

    } catch (error) {
      console.error('Error checking Edge Function:', error);
      
      // Check if it's a CORS or network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          isDeployed: false,
          error: 'Edge Function Not Deployed',
          details: 'The anthropic-proxy Edge Function is not deployed or not accessible. Please run the deployment script.'
        };
      }

      return {
        isDeployed: false,
        error: 'Connection Error',
        details: 'Cannot connect to Supabase Edge Functions. Please check your configuration.'
      };
    }
  }

  /**
   * Perform a comprehensive API key validation
   */
  async validateApiKeySetup(): Promise<{
    isSetup: boolean;
    issues: Array<{
      type: 'error' | 'warning';
      title: string;
      message: string;
    }>;
  }> {
    const issues: Array<{
      type: 'error' | 'warning';
      title: string;
      message: string;
    }> = [];

    // Check Edge Function deployment
    const deploymentCheck = await this.checkEdgeFunctionDeployment();
    if (!deploymentCheck.isDeployed) {
      issues.push({
        type: 'error',
        title: 'Edge Function Not Deployed',
        message: deploymentCheck.details || 'The anthropic-proxy Edge Function needs to be deployed.'
      });
      return { isSetup: false, issues };
    }

    // Check API key configuration
    const apiKeyCheck = await this.checkAnthropicApiKey();
    if (!apiKeyCheck.isConfigured) {
      issues.push({
        type: 'error',
        title: apiKeyCheck.error || 'API Key Issue',
        message: apiKeyCheck.details || 'The Anthropic API key is not properly configured.'
      });
    }

    return {
      isSetup: issues.length === 0,
      issues
    };
  }
}
