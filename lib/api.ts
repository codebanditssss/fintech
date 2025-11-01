import axios, { AxiosError } from 'axios';
import {
  IngestResponse,
  StatusResponse,
  ResultResponse,
  SynonymsResponse,
  Synonym,
} from './types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Central error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    throw new Error(message);
  }
);

export const apiClient = {
  // Upload PDFs
  ingest: async (files: File[]): Promise<IngestResponse> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    
    const { data } = await api.post<IngestResponse>('/ingest', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // Get job status
  getStatus: async (jobId: string): Promise<StatusResponse> => {
    const { data } = await api.get<StatusResponse>(`/status/${jobId}`);
    return data;
  },

  // Get results
  getResults: async (jobId: string): Promise<ResultResponse> => {
    const { data } = await api.get<ResultResponse>(`/result/${jobId}`);
    return data;
  },

  // Synonyms CRUD
  getSynonyms: async (): Promise<SynonymsResponse> => {
    const { data } = await api.get<SynonymsResponse>('/synonyms');
    return data;
  },

  createSynonym: async (synonym: Synonym): Promise<void> => {
    await api.post('/synonyms', synonym);
  },

  updateSynonym: async (term: string, canonical: string): Promise<void> => {
    await api.put('/synonyms', { term, canonical });
  },

  deleteSynonym: async (term: string): Promise<void> => {
    await api.delete(`/synonyms/${encodeURIComponent(term)}`);
  },

  // Export CSV
  exportCSV: async (): Promise<Blob> => {
    const { data } = await api.get('/export/csv', {
      responseType: 'blob',
    });
    return data;
  },
};
