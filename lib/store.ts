import { create } from 'zustand';
import {
  JobStatus,
  ConceptRow,
  Synonym,
} from './types';
import { apiClient } from './api';

interface AppState {
  // State
  jobId: string | null;
  status: JobStatus;
  results: ConceptRow[];
  synonyms: Synonym[];
  loading: boolean;
  error: string | null;

  // Actions
  setJob: (jobId: string | null) => void;
  setStatus: (status: JobStatus) => void;
  setResults: (results: ConceptRow[]) => void;
  setSynonyms: (synonyms: Synonym[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Async actions
  fetchSynonyms: () => Promise<void>;
  saveSynonym: (term: string, canonical: string) => Promise<void>;
  deleteSynonym: (term: string) => Promise<void>;
  fetchResults: (jobId: string) => Promise<void>;
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  jobId: null,
  status: 'idle',
  results: [],
  synonyms: [],
  loading: false,
  error: null,

  // Setters
  setJob: (jobId) => set({ jobId }),
  setStatus: (status) => set({ status }),
  setResults: (results) => set({ results }),
  setSynonyms: (synonyms) => set({ synonyms }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Async actions
  fetchSynonyms: async () => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.getSynonyms();
      set({ synonyms: response.synonyms, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  saveSynonym: async (term, canonical) => {
    try {
      set({ loading: true, error: null });
      const existing = get().synonyms.find((s) => s.term === term);
      
      if (existing) {
        await apiClient.updateSynonym(term, canonical);
      } else {
        await apiClient.createSynonym({ term, canonical });
      }
      
      // Refresh synonyms list
      await get().fetchSynonyms();
      
      // If we have a job, refresh results
      const { jobId } = get();
      if (jobId && get().status === 'done') {
        await get().fetchResults(jobId);
      }
      
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteSynonym: async (term) => {
    try {
      set({ loading: true, error: null });
      await apiClient.deleteSynonym(term);
      await get().fetchSynonyms();
      
      const { jobId } = get();
      if (jobId && get().status === 'done') {
        await get().fetchResults(jobId);
      }
      
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchResults: async (jobId) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.getResults(jobId);
      set({ results: response.rows, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  reset: () => set({
    jobId: null,
    status: 'idle',
    results: [],
    loading: false,
    error: null,
  }),
}));
