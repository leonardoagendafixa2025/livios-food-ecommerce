import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://dsbqagcvmdbpaxmrlnze.supabase.co';
const FALLBACK_ANON = typeof atob === 'function' ? atob('c2JfcHVibGlzaGFibGVfcnZOVFVvaHJMMkg2SGdzVDBPQk5jQV9relIxZHZUZg==') : '';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON;

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co'))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConnected = () => !!supabase;
