import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CONFIDENCE_COLORS, CONFIDENCE_LEVELS, STATUS_CONFIG } from './constants';
import { JobStatus } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateFileType(file: File, invoiceType: 'regular' | 'handwritten'): boolean {
  if (invoiceType === 'regular') {
    return file.type === 'application/pdf';
  }
  return file.type === 'application/pdf' || file.type.startsWith('image/');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function getStatusConfig(status: JobStatus | 'processing' | 'completed') {
  return STATUS_CONFIG[status] || STATUS_CONFIG.idle;
}

export function getConfidenceColor(confidence: number) {
  if (confidence >= CONFIDENCE_LEVELS.HIGH) return CONFIDENCE_COLORS.HIGH;
  if (confidence >= CONFIDENCE_LEVELS.MEDIUM) return CONFIDENCE_COLORS.MEDIUM;
  return CONFIDENCE_COLORS.LOW;
}

export function getConfidenceLabel(confidence: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (confidence >= CONFIDENCE_LEVELS.HIGH) return 'HIGH';
  if (confidence >= CONFIDENCE_LEVELS.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
