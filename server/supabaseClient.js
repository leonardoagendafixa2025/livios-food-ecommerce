import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let supabase = null;

export function initSupabase(customUrl, customKey) {
  const url = customUrl || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = customKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (url && key && url.includes('supabase.co')) {
    try {
      supabase = createClient(url, key);
      console.log("🟢 Client Supabase inicializado com sucesso para:", url);
      return supabase;
    } catch (err) {
      console.error("🔴 Erro ao inicializar Supabase client:", err.message);
      supabase = null;
      return null;
    }
  } else {
    console.log("🟡 Supabase não configurado ou aguardando credenciais válidas no .env ou Painel Admin.");
    supabase = null;
    return null;
  }
}

// Inicialização automática ao carregar módulo
initSupabase();

export function getSupabase() {
  return supabase;
}

export function isSupabaseConfigured() {
  return !!supabase;
}

export async function testSupabaseConnection() {
  if (!supabase) return { ok: false, error: "Supabase client não inicializado" };
  try {
    const { data, error } = await supabase.from('categories').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      return { ok: false, error: error.message };
    }
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

