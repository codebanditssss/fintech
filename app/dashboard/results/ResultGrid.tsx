'use client';

import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Eye } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ConceptRow } from '@/lib/types';
import { Input, Card, EmptyState, Loader } from '@/components/ui';
import { EvidenceDrawer } from './EvidenceDrawer';

type SortField = 'field' | 'canonical' | 'value' | 'page';
type SortDirection = 'asc' | 'desc';

export function ResultGrid() {
  const { results, loading } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('canonical');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedRow, setSelectedRow] = useState<ConceptRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredAndSorted = useMemo(() => {
    let filtered = results;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.field.toLowerCase().includes(query) ||
          row.canonical.toLowerCase().includes(query) ||
          row.value.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];

      if (sortField === 'page') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [results, searchQuery, sortField, sortDirection]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSorted.slice(start, start + itemsPerPage);
  }, [filteredAndSorted, currentPage]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      {children}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  if (loading && results.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" />
        </div>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No results yet"
          description="Upload and process PDFs to see extracted concepts here."
        />
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by field, canonical, or value..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {paginated.length} of {filteredAndSorted.length} results
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                    <SortHeader field="field">Field</SortHeader>
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                    <SortHeader field="canonical">Canonical</SortHeader>
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                    <SortHeader field="value">Value</SortHeader>
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                    Doc ID
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                    <SortHeader field="page">Page</SortHeader>
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-3 text-gray-900 dark:text-gray-100">{row.field}</td>
                    <td className="p-3 text-gray-900 dark:text-gray-100">{row.canonical}</td>
                    <td className="p-3 text-gray-900 dark:text-gray-100">{row.value}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400 font-mono text-xs">
                      {row.doc_id}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{row.page}</td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedRow(row)}
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs"
                        aria-label="View evidence"
                      >
                        <Eye className="w-3 h-3" />
                        Evidence
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </Card>

      {selectedRow && (
        <EvidenceDrawer
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </>
  );
}
