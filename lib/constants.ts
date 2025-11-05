export const STATUS_CONFIG = {
  idle: {
    label: 'Ready',
    color: 'text-zinc-500',
    bg: 'bg-zinc-100',
    badgeBg: 'bg-zinc-50',
    badgeText: 'text-zinc-700',
    description: 'Upload documents to begin processing',
  },
  queued: {
    label: 'Queued',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-700',
    description: 'Job queued for processing',
  },
  processing: {
    label: 'Processing',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    description: 'Extracting and normalizing data...',
  },
  running: {
    label: 'Running',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    description: 'Processing documents...',
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600',
    bg: 'bg-green-50',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-700',
    description: 'Documents processed successfully',
  },
  done: {
    label: 'Done',
    color: 'text-green-600',
    bg: 'bg-green-50',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-700',
    description: 'Processing completed successfully',
  },
  error: {
    label: 'Error',
    color: 'text-red-600',
    bg: 'bg-red-50',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
    description: 'An error occurred during processing',
  },
} as const;

export const CONFIDENCE_LEVELS = {
  HIGH: 95,
  MEDIUM: 90,
  LOW: 0,
} as const;

export const CONFIDENCE_COLORS = {
  HIGH: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  MEDIUM: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
  LOW: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
} as const;


export const FILE_TYPES = {
  REGULAR: {
    accept: '.pdf',
    mimeType: 'application/pdf',
    description: 'PDF files only',
  },
  HANDWRITTEN: {
    accept: '.pdf,image/*',
    mimeTypes: ['application/pdf', 'image/'],
    description: 'PDF, PNG, JPG images',
  },
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const MAX_FILE_SIZE_TEXT = '10MB';


export const POLLING_INTERVAL = 2000; // 2 seconds


export const RECORDS_PER_PAGE = 10;


export const MAX_CONVERSATION_HISTORY = 4;

export const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant' as const,
  content: "Hi! I can help you query the financial data from your uploaded documents. Try asking:\n\n• What's the total GST amount?\n• Show me all tax terms\n• What's the invoice total?",
};

