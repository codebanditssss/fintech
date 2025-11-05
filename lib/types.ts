export type JobStatus = 'idle' | 'queued' | 'running' | 'done' | 'error';
export type InvoiceType = 'regular' | 'handwritten';


export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  upload_date: string;
  status: string;
  job_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  status: JobStatus;
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
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  job_id: string;
  question: string;
  answer: string;
  created_at: string;
}

// ==========================================
// API REQUEST/RESPONSE TYPES
// ==========================================

export interface JobResponse {
  jobId: string;
  status: JobStatus;
  progress?: number;
  message?: string;
}

export interface JobStatusResponse {
  status: JobStatus;
  progress: number;
  documentsProcessed: number;
  totalRecords: number;
  message?: string;
}

export interface ResultRow {
  id: string;
  docId: string;
  docName: string;
  page: number;
  originalTerm: string;
  canonical: string;
  value: string;
  confidence: number;
  evidence?: string;
}

export interface ConceptRow {
  field: string;
  canonical: string;
  value: string;
  doc_id: string;
  page: number;
  evidence: string;
  bbox?: [number, number, number, number];
}

export interface IngestResponse {
  job_id: string;
}

export interface StatusResponse {
  status: JobStatus;
}

export interface ResultResponse {
  rows: ConceptRow[];
}

export interface SynonymsResponse {
  synonyms: Synonym[];
}

export interface DocumentHistoryItem {
  id: string;
  name: string;
  fileSize: number;
  status: string;
  uploadDate: string;
  jobId: string | null;
  recordsCount: number;
  jobStatus: JobStatus;
}

export interface ChatHistoryItem {
  id: string;
  job_id: string;
  question: string;
  answer: string;
  created_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Evidence {
  id: string;
  docName: string;
  page: number;
  originalTerm: string;
  canonical: string;
  value: string;
  confidence: number;
  evidence?: string;
}

export interface AuthFormData {
  email: string;
  password: string;
}

export interface SignUpFormData extends AuthFormData {
  confirmPassword: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}
