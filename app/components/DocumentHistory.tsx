'use client';

import { useState, useEffect } from 'react';
import { FileText, Calendar, Loader2 } from 'lucide-react';
import { getDocumentHistory } from '@/lib/api';

interface DocumentHistoryItem {
  id: string;
  name: string;
  fileSize: number;
  status: string;
  uploadDate: string;
  jobId: string | null;
  recordsCount: number;
  jobStatus: string;
}

interface DocumentHistoryProps {
  onDocumentSelect?: (jobId: string) => void;
}

export default function DocumentHistory({ onDocumentSelect }: DocumentHistoryProps) {
  const [documents, setDocuments] = useState<DocumentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const history = await getDocumentHistory();
        setDocuments(history);
      } catch (err) {
        setError('Failed to load document history');
        console.error('Error fetching document history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Document History</h2>
          <p className="text-xs text-zinc-500 mt-1">Recently processed documents</p>
        </div>
        {documents.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-zinc-600 hover:text-zinc-900 font-medium"
          >
            {showAll ? 'Show Less' : `Show All (${documents.length})`}
          </button>
        )}
      </div>

      <div className={`overflow-y-auto ${showAll ? 'max-h-[400px]' : ''}`}>
        {isLoading ? (
          <div className="px-6 py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Loading history...</p>
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No documents yet</p>
            <p className="text-xs text-zinc-400 mt-1">Upload your first document to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {(showAll ? documents : documents.slice(0, 3)).map((doc) => (
              <div
                key={doc.id}
                onClick={() => doc.jobId && onDocumentSelect?.(doc.jobId)}
                className={`px-6 py-4 hover:bg-zinc-50 transition-colors ${
                  doc.jobId && onDocumentSelect ? 'cursor-pointer' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-zinc-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(doc.uploadDate)}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatFileSize(doc.fileSize)}
                      </span>
                      {doc.recordsCount > 0 && (
                        <span className="text-xs text-zinc-500">
                          {doc.recordsCount} records
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      doc.jobStatus === 'done'
                        ? 'bg-green-50 text-green-700'
                        : doc.jobStatus === 'running'
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    {doc.jobStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

