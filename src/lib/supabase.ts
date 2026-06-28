import { createClient } from '@supabase/supabase-js';

// Função para limpar a URL do Supabase, removendo caminhos desnecessários como /rest/v1
const cleanSupabaseUrl = (url: string): string => {
  if (!url) return '';
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
};

// Cliente público padrão (inicializado sob demanda)
export const getSupabase = () => {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseUrl = cleanSupabaseUrl(rawUrl);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Chaves do Supabase não configuradas nas variáveis de ambiente.');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Cliente administrador para scripts de ingestão e rotas de API seguras (inicializado sob demanda)
export const getSupabaseAdmin = () => {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseUrl = cleanSupabaseUrl(rawUrl);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variáveis de ambiente admin do Supabase não configuradas.');
  }
  return createClient(supabaseUrl, serviceRoleKey);
};


