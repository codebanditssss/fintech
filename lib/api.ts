// API utilities for backend communication

export interface JobResponse {
  jobId: string;
  status: 'queued' | 'running' | 'done' | 'error';
  progress?: number;
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

export interface Synonym {
  id: string;
  term: string;
  canonical: string;
}

export interface JobStatusResponse {
  status: 'queued' | 'running' | 'done' | 'error';
  progress: number;
  documentsProcessed: number;
  totalRecords: number;
  message?: string;
}

// Upload files and create processing job
export async function uploadFiles(files: File[]): Promise<JobResponse> {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  const response = await fetch('/api/ingest', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}

// Upload handwritten invoice files and create processing job
export async function uploadHandwrittenFiles(files: File[]): Promise<JobResponse> {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  const response = await fetch('/api/ingest-handwritten', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}

// Get job status and progress
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`/api/status/${jobId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch job status');
  }

  return response.json();
}

// Get processing results for a job
export async function getResults(jobId: string): Promise<ResultRow[]> {
  const response = await fetch(`/api/results/${jobId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch results');
  }

  return response.json();
}

// Get all synonym mappings
export async function getSynonyms(): Promise<Synonym[]> {
  const response = await fetch('/api/synonyms');

  if (!response.ok) {
    throw new Error('Failed to fetch synonyms');
  }

  return response.json();
}

// Create a new synonym mapping
export async function createSynonym(term: string, canonical: string): Promise<Synonym> {
  const response = await fetch('/api/synonyms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ term, canonical }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create synonym: ${response.statusText}`);
  }

  return response.json();
}

// Update an existing synonym mapping
export async function updateSynonym(
  id: string,
  term: string,
  canonical: string
): Promise<Synonym> {
  const response = await fetch(`/api/synonyms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ term, canonical }),
  });

  if (!response.ok) {
    throw new Error('Failed to update synonym');
  }

  return response.json();
}

// Delete a synonym mapping
export async function deleteSynonym(id: string): Promise<void> {
  const response = await fetch(`/api/synonyms/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete synonym');
  }
}

// Export results as CSV
export async function exportCSV(jobId?: string): Promise<void> {
  const url = jobId ? `/api/export/csv?jobId=${jobId}` : '/api/export/csv';
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to export CSV');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `finance_results_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}

