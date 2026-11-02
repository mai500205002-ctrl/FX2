import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Surface a clear error rather than passing undefined into the client.
  throw new Error(
    'TEXTFX requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to be set in .env',
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export interface CreationRow {
  id: string;
  title: string;
  text: string;
  effect_id: string;
  values: Record<string, number | string>;
  family: string;
  created_at: string;
}

export type CreationInput = Omit<CreationRow, 'id' | 'created_at'>;
