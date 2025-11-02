'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { getResults, ResultRow } from '@/lib/api';

interface ResultsTableProps {
  jobId: string | null;
  onRowClick: (row: ResultRow) => void;
}

export default function ResultsTable({ jobId, onRowClick }: ResultsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<ResultRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch results when jobId changes
  useEffect(() => {
    if (!jobId) {
      setData([]);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log(`[ResultsTable] Fetching results for jobId: ${jobId}`);
        const results = await getResults(jobId);
        console.log(`[ResultsTable] Received ${results.length} results`);
        if (results.length === 0) {
          console.warn(`[ResultsTable] ⚠️ No results received for jobId ${jobId}`);
        } else {
          console.log(`[ResultsTable] Sample results:`, results.slice(0, 3));
        }
        setData(results);
      } catch (err) {
        setError('Failed to load results');
        console.error('[ResultsTable] Error fetching results:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [jobId]);

  const filteredData = data.filter(
    row =>
      row.originalTerm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.canonical.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.docName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-200">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Normalized Results</h2>
            <p className="text-xs text-zinc-500 mt-1">
              {filteredData.length} records • Click any row to view evidence
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent w-64"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                Document
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                Page
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                Original Term
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                Canonical Field
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                Evidence
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-zinc-500">
                    <Loader2 className="w-8 h-8 mb-3 text-zinc-400 animate-spin" />
                    <p className="text-sm font-medium">Loading results...</p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-red-500">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-zinc-500">
                    <FileText className="w-12 h-12 mb-3 text-zinc-300" />
                    <p className="text-sm font-medium">No results found</p>
                    <p className="text-xs mt-1">Upload documents to see normalized data</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick(row)}
                  className="hover:bg-zinc-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-zinc-100 rounded flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-zinc-600" />
                      </div>
                      <span className="text-sm font-medium text-zinc-900 truncate max-w-[200px]">
                        {row.docName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-zinc-600">{row.page}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-100 text-xs font-medium text-zinc-700">
                      {row.originalTerm}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-zinc-900">
                      {row.canonical}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-mono text-zinc-900">
                      ${row.value}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        row.confidence >= 95
                          ? 'bg-green-50 text-green-700'
                          : row.confidence >= 90
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {row.confidence}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-1.5 hover:bg-zinc-200 rounded transition-colors">
                      <ExternalLink className="w-4 h-4 text-zinc-600" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredData.length > 0 && (
        <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Showing {filteredData.length} of {data.length} results
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs font-medium text-zinc-700 border border-zinc-300 rounded hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button className="px-3 py-1.5 text-xs font-medium text-zinc-700 border border-zinc-300 rounded hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

