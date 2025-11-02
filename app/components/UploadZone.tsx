'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, File, X, Loader2, PenTool } from 'lucide-react';
import { toast } from 'sonner';
import { uploadFiles, uploadHandwrittenFiles } from '@/lib/api';

interface UploadZoneProps {
  onJobCreated: (jobId: string) => void;
}

type InvoiceType = 'regular' | 'handwritten';

export default function UploadZone({ onJobCreated }: UploadZoneProps) {
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('regular');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const dragCounter = useRef(0);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter') {
      dragCounter.current++;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setDragActive(true);
      }
    } else if (e.type === 'dragleave') {
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setDragActive(false);
      }
    } else if (e.type === 'dragover') {
      e.preventDefault();
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setDragActive(true);
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    droppedFiles.forEach(file => {
      if (invoiceType === 'regular') {
        if (file.type === 'application/pdf') {
          validFiles.push(file);
        } else {
          invalidFiles.push(file.name);
        }
      } else {
        // For handwritten, accept PDF, images
        if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file.name);
        }
      }
    });

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast.success(`Added ${validFiles.length} file${validFiles.length > 1 ? 's' : ''}`);
    }

    if (invalidFiles.length > 0) {
      const expectedTypes = invoiceType === 'regular' 
        ? 'PDF files'
        : 'PDF or image files (PNG, JPG, etc.)';
      toast.error(
        `${invalidFiles.length} file${invalidFiles.length > 1 ? 's' : ''} rejected. Only ${expectedTypes} are allowed.`,
        { duration: 4000 }
      );
    }
  }, [invoiceType]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      selectedFiles.forEach(file => {
        if (invoiceType === 'regular') {
          if (file.type === 'application/pdf') {
            validFiles.push(file);
          } else {
            invalidFiles.push(file.name);
          }
        } else {
          // For handwritten, accept PDF, images
          if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
            validFiles.push(file);
          } else {
            invalidFiles.push(file.name);
          }
        }
      });

      if (validFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...validFiles]);
        toast.success(`Added ${validFiles.length} file${validFiles.length > 1 ? 's' : ''}`);
      }

      if (invalidFiles.length > 0) {
        const expectedTypes = invoiceType === 'regular' 
          ? 'PDF files'
          : 'PDF or image files (PNG, JPG, etc.)';
        toast.error(
          `${invalidFiles.length} file${invalidFiles.length > 1 ? 's' : ''} rejected. Only ${expectedTypes} are allowed.`,
          { duration: 4000 }
        );
      }

      // Reset input value to allow re-selecting the same file
      e.target.value = '';
    }
  };

  const handleProcess = async () => {
    if (uploadedFiles.length === 0) {
      toast.error(`Please upload at least one ${invoiceType === 'regular' ? 'PDF' : 'image or PDF'} file`);
      return;
    }

    setIsProcessing(true);
    try {
      const response = invoiceType === 'handwritten' 
        ? await uploadHandwrittenFiles(uploadedFiles)
        : await uploadFiles(uploadedFiles);
      
      onJobCreated(response.jobId);
      toast.success(`Processing started! Job ID: ${response.jobId}`);
      setUploadedFiles([]); // Clear uploaded files
    } catch (error) {
      toast.error('Failed to upload files. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-200">
        <h2 className="text-sm font-semibold text-zinc-900">Upload Documents</h2>
        <p className="text-xs text-zinc-500 mt-1">Upload invoices to extract and normalize financial data</p>
        
        {/* Invoice Type Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => {
              setInvoiceType('regular');
              setUploadedFiles([]);
            }}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              invoiceType === 'regular'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Regular Invoices
          </button>
          <button
            onClick={() => {
              setInvoiceType('handwritten');
              setUploadedFiles([]);
            }}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${
              invoiceType === 'handwritten'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            <PenTool className="w-3 h-3" />
            Handwritten Invoices
          </button>
        </div>
      </div>

      <div className="p-6">
        <div
          className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
              : 'border-zinc-300 hover:border-zinc-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept={invoiceType === 'regular' ? '.pdf' : '.pdf,image/*'}
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="py-12 px-6 text-center">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 transition-colors ${
              dragActive ? 'bg-blue-100' : 'bg-zinc-100'
            }`}>
              {invoiceType === 'handwritten' ? (
                <PenTool className={`w-6 h-6 ${dragActive ? 'text-blue-600' : 'text-zinc-600'}`} />
              ) : (
                <Upload className={`w-6 h-6 ${dragActive ? 'text-blue-600' : 'text-zinc-600'}`} />
              )}
            </div>
            <p className={`text-sm font-medium mb-1 transition-colors ${
              dragActive ? 'text-blue-700' : 'text-zinc-900'
            }`}>
              {dragActive 
                ? 'Drop files here to upload'
                : invoiceType === 'handwritten' 
                  ? 'Drop handwritten invoices here or click to browse'
                  : 'Drop PDF files here or click to browse'
              }
            </p>
            <p className="text-xs text-zinc-500">
              {invoiceType === 'handwritten'
                ? 'Supports PDF, PNG, JPG images • Maximum 10MB per file • Uses Gemini AI for better handwriting recognition'
                : 'Support for multiple files • Maximum 10MB per file'}
            </p>
          </div>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-200"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-zinc-200 rounded flex items-center justify-center shrink-0">
                    <File className="w-4 h-4 text-zinc-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-zinc-200 rounded transition-colors shrink-0"
                >
                  <X className="w-4 h-4 text-zinc-600" />
                </button>
              </div>
            ))}
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <button 
            onClick={handleProcess}
            disabled={isProcessing}
            className="mt-4 w-full px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Process {uploadedFiles.length} {uploadedFiles.length === 1 ? 'Document' : 'Documents'}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

