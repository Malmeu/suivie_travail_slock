import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Exporter le client Supabase uniquement si les variables sont définies
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mapping des identifiants locaux de départements vers des UUIDs valides pour Supabase
const DEPT_MAP: Record<string, string> = {
  'dep_cardio': 'e3a51f89-8d76-4d0d-a764-16b71f9cf501',
  'dep_urgences': 'e3a51f89-8d76-4d0d-a764-16b71f9cf502',
  'dep_admin': 'e3a51f89-8d76-4d0d-a764-16b71f9cf503',
  'dep_tech': 'e3a51f89-8d76-4d0d-a764-16b71f9cf504'
};

const DEPT_MAP_REV: Record<string, string> = {
  'e3a51f89-8d76-4d0d-a764-16b71f9cf501': 'dep_cardio',
  'e3a51f89-8d76-4d0d-a764-16b71f9cf502': 'dep_urgences',
  'e3a51f89-8d76-4d0d-a764-16b71f9cf503': 'dep_admin',
  'e3a51f89-8d76-4d0d-a764-16b71f9cf504': 'dep_tech'
};

export const toSupabaseDeptId = (localId: string | undefined): string | null => {
  if (!localId) return null;
  return DEPT_MAP[localId] || localId;
};

export const toLocalDeptId = (supabaseId: string | undefined): string | undefined => {
  if (!supabaseId) return undefined;
  return DEPT_MAP_REV[supabaseId] || supabaseId;
};
