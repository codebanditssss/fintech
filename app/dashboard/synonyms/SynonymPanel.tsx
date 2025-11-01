'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Synonym } from '@/lib/types';
import { Card, Button, Input, Loader } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';

export function SynonymPanel() {
  const { synonyms, loading, fetchSynonyms, saveSynonym, deleteSynonym } = useAppStore();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [newTerm, setNewTerm] = useState('');
  const [newCanonical, setNewCanonical] = useState('');
  const [editTerm, setEditTerm] = useState('');
  const [editCanonical, setEditCanonical] = useState('');

  useEffect(() => {
    fetchSynonyms().catch(() => {
      showToast('Failed to load synonyms', 'error');
    });
  }, [fetchSynonyms, showToast]);

  const handleAdd = async () => {
    if (!newTerm.trim() || !newCanonical.trim()) {
      showToast('Term and canonical cannot be empty', 'error');
      return;
    }

    const duplicate = synonyms.find((s) => s.term === newTerm.trim());
    if (duplicate) {
      showToast('Synonym with this term already exists', 'error');
      return;
    }

    try {
      await saveSynonym(newTerm.trim(), newCanonical.trim());
      setNewTerm('');
      setNewCanonical('');
      showToast('Synonym added successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to add synonym', 'error');
    }
  };

  const handleEdit = (synonym: Synonym) => {
    setEditing(synonym.term);
    setEditTerm(synonym.term);
    setEditCanonical(synonym.canonical);
  };

  const handleSaveEdit = async () => {
    if (!editTerm.trim() || !editCanonical.trim()) {
      showToast('Term and canonical cannot be empty', 'error');
      return;
    }

    try {
      await saveSynonym(editTerm.trim(), editCanonical.trim());
      setEditing(null);
      showToast('Synonym updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update synonym', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setEditTerm('');
    setEditCanonical('');
  };

  const handleDelete = async (term: string) => {
    if (!confirm(`Delete synonym "${term}"?`)) return;

    try {
      await deleteSynonym(term);
      showToast('Synonym deleted successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete synonym', 'error');
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Synonym Mappings
          </h3>
        </div>

        {/* Add new */}
        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Input
            type="text"
            placeholder="Term"
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            className="text-sm"
          />
          <Input
            type="text"
            placeholder="Canonical"
            value={newCanonical}
            onChange={(e) => setNewCanonical(e.target.value)}
            className="text-sm"
          />
          <Button
            onClick={handleAdd}
            variant="primary"
            size="sm"
            className="w-full"
            disabled={loading || !newTerm.trim() || !newCanonical.trim()}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Synonym
          </Button>
        </div>

        {/* List */}
        {loading && synonyms.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader />
          </div>
        ) : synonyms.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No synonyms yet. Add one above.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {synonyms.map((synonym) => (
              <div
                key={synonym.term}
                className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                {editing === synonym.term ? (
                  <div className="space-y-2">
                    <Input
                      type="text"
                      value={editTerm}
                      onChange={(e) => setEditTerm(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="text"
                      value={editCanonical}
                      onChange={(e) => setEditCanonical(e.target.value)}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveEdit}
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        disabled={loading}
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {synonym.term}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        → {synonym.canonical}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(synonym)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-400"
                        aria-label="Edit synonym"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(synonym.term)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
                        aria-label="Delete synonym"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
