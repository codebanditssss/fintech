export type JobStatus = 'idle' | 'queued' | 'running' | 'done' | 'error';

export interface ConceptRow {
  field: string;
  canonical: string;
  value: string;
  doc_id: string;
  page: number;
  evidence: string;
  bbox?: [number, number, number, number]; // optional bounding box
}

export interface Synonym {
  term: string;
  canonical: string;
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
