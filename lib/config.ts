/**
 * VARUNASETU Platform Configuration & Integrations Interface
 * Prepared for Phase 4 external credential integrations (Groq LLM & Supabase).
 */

export interface SystemConfig {
  appName: string;
  version: string;
  environment: 'development' | 'production' | 'staging';
  groq: {
    enabled: boolean;
    apiKeyPresent: boolean;
    model: string;
  };
  supabase: {
    enabled: boolean;
    urlConfigured: boolean;
  };
  simulationEngine: {
    version: string;
    deterministicMode: boolean;
    maxAlternateRoutes: number;
  };
}

export const PLATFORM_CONFIG: SystemConfig = {
  appName: 'VARUNASETU',
  version: '2.0.0-PROD',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  groq: {
    enabled: Boolean(process.env.GROQ_API_KEY),
    apiKeyPresent: Boolean(process.env.GROQ_API_KEY),
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  },
  supabase: {
    enabled: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    urlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  },
  simulationEngine: {
    version: '2.4.0',
    deterministicMode: true,
    maxAlternateRoutes: 12,
  },
};
