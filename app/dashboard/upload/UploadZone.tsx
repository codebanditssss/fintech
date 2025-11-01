'use client';

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { apiClient } from '@/lib/api';
import { Button, Card } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';

export function UploadZone() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { setJob, setStatus, reset } = useAppStore();
  const { showToast } = useToast();

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === 'application/pdf'
    );
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(
      (file) => file.type === 'application/pdf'
    );
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      showToast('Please select at least one PDF file', 'error');
      return;
    }

    setUploading(true);
    reset();

    try {
      const { job_id } = await apiClient.ingest(files);
      setJob(job_id);
      setStatus('queued');
      setFiles([]);
      showToast('Files uploaded successfully. Processing...', 'success');
    } catch (error: any) {
      showToast(error.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}
        `}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Drag & drop PDF files here, or
        </p>
        <label className="cursor-pointer">
          <span className="text-blue-600 dark:text-blue-400 hover:underline">
            select files
          </span>
          <input
            type="file"
            multiple
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          PDF files only. Max size: 10MB per file
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selected files ({files.length}):
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
              >
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="flex-1 text-gray-700 dark:text-gray-300 truncate">
                  {file.name}
                </span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={files.length === 0 || uploading}
        variant="primary"
        size="lg"
        className="w-full mt-4"
      >
        {uploading ? 'Uploading...' : 'Upload & Process'}
      </Button>
    </Card>
  );
}
