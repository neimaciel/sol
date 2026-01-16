/**
 * API Configuration - Centralized URLs for all services
 */

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Check .env file.');
}

// All API endpoints go through Supabase Edge Functions
export const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;
