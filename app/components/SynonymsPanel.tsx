'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSynonyms, createSynonym, updateSynonym, deleteSynonym, Synonym } from '@/lib/api';

interface SynonymsPanelProps {
  onSynonymChange?: () => void;
}

export default function SynonymsPanel({ onSynonymChange }: SynonymsPanelProps) {
  const [synonyms, setSynonyms] = useState<Synonym[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState('');
  const [editCanonical, setEditCanonical] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newCanonical, setNewCanonical] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load synonyms on mount
  useEffect(() => {
    const loadSynonyms = async () => {
      setIsLoading(true);
      try {
        const data = await getSynonyms();
        setSynonyms(data);
      } catch (error) {
        toast.error('Failed to load synonyms');
        console.error('Error loading synonyms:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSynonyms();
  }, []);

  const startEdit = (synonym: Synonym) => {
    setEditingId(synonym.id);
    setEditTerm(synonym.term);
    setEditCanonical(synonym.canonical);
  };

  const saveEdit = async () => {
    if (!editingId || !editTerm || !editCanonical) return;

    setIsSaving(true);
    try {
      await updateSynonym(editingId, editTerm, editCanonical);
      setSynonyms(prev =>
        prev.map(s =>
          s.id === editingId
            ? { ...s, term: editTerm, canonical: editCanonical }
            : s
        )
      );
      setEditingId(null);
      toast.success('Synonym updated successfully');
      onSynonymChange?.();
    } catch (error) {
      toast.error('Failed to update synonym');
      console.error('Error updating synonym:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTerm('');
    setEditCanonical('');
  };

  const handleDeleteSynonym = async (id: string) => {
    try {
      await deleteSynonym(id);
      setSynonyms(prev => prev.filter(s => s.id !== id));
      toast.success('Synonym deleted successfully');
      onSynonymChange?.();
    } catch (error) {
      toast.error('Failed to delete synonym');
      console.error('Error deleting synonym:', error);
    }
  };

  const addSynonym = async () => {
    if (!newTerm || !newCanonical) {
      toast.error('Please fill in both fields');
      return;
    }

    // Check if synonym already exists
    const existing = synonyms.find(s => s.term.toLowerCase().trim() === newTerm.toLowerCase().trim());
    
    setIsSaving(true);
    try {
      if (existing) {
        // Update existing synonym instead of creating new one
        await updateSynonym(existing.id, newTerm.trim(), newCanonical.trim());
        setSynonyms(prev =>
          prev.map(s =>
            s.id === existing.id
              ? { ...s, term: newTerm.trim(), canonical: newCanonical.trim() }
              : s
          )
        );
        toast.success('Synonym updated successfully');
      } else {
        // Create new synonym
        const newSynonym = await createSynonym(newTerm.trim(), newCanonical.trim());
        setSynonyms(prev => [...prev, newSynonym]);
        toast.success('Synonym added successfully');
      }
      setNewTerm('');
      setNewCanonical('');
      setIsAdding(false);
      onSynonymChange?.();
    } catch (error: any) {
      // Check if it's a duplicate error from the server
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        // Try to find and update it
        const existingByTerm = synonyms.find(s => s.term.toLowerCase().trim() === newTerm.toLowerCase().trim());
        if (existingByTerm) {
          try {
            await updateSynonym(existingByTerm.id, newTerm.trim(), newCanonical.trim());
            setSynonyms(prev =>
              prev.map(s =>
                s.id === existingByTerm.id
                  ? { ...s, term: newTerm.trim(), canonical: newCanonical.trim() }
                  : s
              )
            );
            toast.success('Synonym updated successfully');
            setNewTerm('');
            setNewCanonical('');
            setIsAdding(false);
            onSynonymChange?.();
            return;
          } catch (updateError) {
            toast.error('Failed to update existing synonym');
            console.error('Error updating synonym:', updateError);
          }
        } else {
          toast.error('A synonym with this term already exists. Please edit the existing one.');
        }
      } else {
        toast.error(error.message || 'Failed to add synonym');
        console.error('Error adding synonym:', error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Synonym Mappings</h2>
            <p className="text-xs text-zinc-500 mt-1">
              {synonyms.length} mappings • Changes apply instantly
            </p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Mapping
          </button>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        ) : (
        <div className="space-y-2">
          {/* Add New Form */}
          {isAdding && (
            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Original Term
                  </label>
                  <input
                    type="text"
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    placeholder="e.g., VAT"
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Canonical Field
                  </label>
                  <input
                    type="text"
                    value={newCanonical}
                    onChange={(e) => setNewCanonical(e.target.value)}
                    placeholder="e.g., Goods & Services Tax"
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={addSynonym}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded hover:bg-zinc-800 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewTerm('');
                    setNewCanonical('');
                  }}
                  className="px-3 py-1.5 bg-white text-zinc-700 text-xs font-medium border border-zinc-300 rounded hover:bg-zinc-50 transition-colors flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Synonym List */}
          {synonyms.map((synonym) => (
            <div
              key={synonym.id}
              className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors"
            >
              {editingId === synonym.id ? (
                <div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      value={editTerm}
                      onChange={(e) => setEditTerm(e.target.value)}
                      className="px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={editCanonical}
                      onChange={(e) => setEditCanonical(e.target.value)}
                      className="px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={isSaving}
                      className="p-1.5 bg-zinc-900 text-white rounded hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 bg-white text-zinc-700 border border-zinc-300 rounded hover:bg-zinc-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm font-medium text-zinc-900 min-w-[120px]">
                      {synonym.term}
                    </span>
                    <span className="text-zinc-400">→</span>
                    <span className="text-sm text-zinc-600">
                      {synonym.canonical}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(synonym)}
                      className="p-1.5 hover:bg-zinc-200 rounded transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-zinc-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteSynonym(synonym.id)}
                      className="p-1.5 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            ))}
        </div>
        )}
      </div>
    </div>
  );
}

