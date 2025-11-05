import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  upload_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  status: 'queued' | 'running' | 'done' | 'error';
  progress: number;
  documents_processed: number;
  total_records: number;
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface Result {
  id: string;
  job_id: string;
  doc_id: string;
  doc_name: string;
  page: number;
  original_term: string;
  canonical: string;
  value: string;
  confidence: number;
  evidence?: string;
  created_at: string;
}

export interface Synonym {
  id: string;
  term: string;
  canonical: string;
  created_at: string;
  updated_at: string;
}

