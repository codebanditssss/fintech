'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, User, Bot, Calendar, Loader2 } from 'lucide-react';
import { getChatHistory } from '@/lib/api';

interface ChatHistoryItem {
  id: string;
  job_id: string;
  question: string;
  answer: string;
  created_at: string;
}

interface ChatHistoryProps {
  jobId?: string | null;
  onHistorySelect?: (item: ChatHistoryItem) => void;
}

export default function ChatHistory({ jobId, onHistorySelect }: ChatHistoryProps) {
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!jobId) {
        setHistory([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const chatHistory = await getChatHistory(jobId);
        setHistory(chatHistory);
      } catch (err) {
        setError('Failed to load chat history');
        console.error('Error fetching chat history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [jobId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Chat History</h2>
          <p className="text-xs text-zinc-500 mt-1">
            {jobId ? 'Conversation history for this job' : 'Select a job to view chat history'}
          </p>
        </div>
        {history.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-zinc-600 hover:text-zinc-900 font-medium"
          >
            {showAll ? 'Show Less' : `Show All (${history.length})`}
          </button>
        )}
      </div>

      <div className={`overflow-y-auto ${showAll ? 'max-h-[400px]' : ''}`}>
        {!jobId ? (
          <div className="px-6 py-12 text-center">
            <MessageSquare className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No job selected</p>
            <p className="text-xs text-zinc-400 mt-1">Process a document to start chatting</p>
          </div>
        ) : isLoading ? (
          <div className="px-6 py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Loading history...</p>
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <MessageSquare className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No chat history yet</p>
            <p className="text-xs text-zinc-400 mt-1">Start asking questions to see history</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {(showAll ? history : history.slice(0, 3)).map((item) => (
              <div
                key={item.id}
                onClick={() => onHistorySelect?.(item)}
                className={`px-6 py-4 hover:bg-zinc-50 transition-colors ${
                  onHistorySelect ? 'cursor-pointer' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-zinc-600 mt-1 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-zinc-900">{item.question}</p>
                      <span className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pl-6">
                    <Bot className="w-4 h-4 text-zinc-600 mt-1 shrink-0" />
                    <p className="text-sm text-zinc-600 flex-1">{item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

