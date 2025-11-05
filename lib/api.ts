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

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`/api/status/${jobId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch job status');
  }

  return response.json();
}

export async function getResults(jobId: string): Promise<ResultRow[]> {
  const response = await fetch(`/api/results/${jobId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch results');
  }

  return response.json();
}

export async function getSynonyms(): Promise<Synonym[]> {
  const response = await fetch('/api/synonyms');

  if (!response.ok) {
    throw new Error('Failed to fetch synonyms');
  }

  return response.json();
}

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

export async function deleteSynonym(id: string): Promise<void> {
  const response = await fetch(`/api/synonyms/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete synonym');
  }
}

export async function getDocumentHistory(): Promise<any[]> {
  const response = await fetch('/api/history/documents');
  if (!response.ok) {
    throw new Error('Failed to fetch document history');
  }
  return response.json();
}

export async function getChatHistory(jobId?: string): Promise<any[]> {
  const url = jobId ? `/api/history/chat?jobId=${jobId}` : '/api/history/chat';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch chat history');
  }
  return response.json();
}

export async function exportCSV(jobId?: string): Promise<void> {
  if (!jobId) {
    throw new Error('Job ID is required to export CSV');
  }

  const url = `/api/export/csv?jobId=${jobId}`;
  const response = await fetch(url);

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to export CSV');
    }
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

const _getSynonyms = getSynonyms;
const _createSynonym = createSynonym;
const _updateSynonym = updateSynonym;
const _deleteSynonym = deleteSynonym;
const _getResults = getResults;
const _getJobStatus = getJobStatus;

type StoreSynonym = import('./types').Synonym;

export const apiClient = {
  // Ingest files - create processing job
  async ingest(files: File[]): Promise<{ job_id: string }> {
    const response = await uploadFiles(files);
    return { job_id: response.jobId };
  },

  async getSynonyms(): Promise<{ synonyms: StoreSynonym[] }> {
    const synonymsList = await _getSynonyms();
    return {
      synonyms: synonymsList.map(s => ({ term: s.term, canonical: s.canonical })) as StoreSynonym[]
    };
  },

  async createSynonym(data: { term: string; canonical: string }): Promise<void> {
    await _createSynonym(data.term, data.canonical);
  },

  async updateSynonym(term: string, canonical: string): Promise<void> {
    const synonymsList = await _getSynonyms();
    const existing = synonymsList.find(s => s.term === term);
    if (!existing) {
      throw new Error(`Synonym with term "${term}" not found`);
    }
    await _updateSynonym(existing.id, term, canonical);
  },

  async deleteSynonym(term: string): Promise<void> {
    const synonymsList = await _getSynonyms();
    const existing = synonymsList.find(s => s.term === term);
    if (!existing) {
      throw new Error(`Synonym with term "${term}" not found`);
    }
    await _deleteSynonym(existing.id);
  },

  async getResults(jobId: string): Promise<{ rows: import('./types').ConceptRow[] }> {
    const resultsList = await _getResults(jobId);
    const rows = resultsList.map(r => ({
      field: r.originalTerm,
      canonical: r.canonical,
      value: r.value,
      doc_id: r.docId,
      page: r.page,
      evidence: r.evidence || '',
      bbox: undefined as [number, number, number, number] | undefined,
    }));
    return { rows };
  },

  async getStatus(jobId: string): Promise<{ status: import('./types').JobStatus }> {
    const response = await _getJobStatus(jobId);
    return { status: response.status };
  },
};

