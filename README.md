# Finance Concept Translator- FinTech


PROJECT DEVS => KHUSHI DIWAN & VAANYA GOEL


An AI-powered financial document processor that extracts, normalizes, and analyzes financial data from PDF invoices and receipts. Transform complex financial documents into clean, consistent data with intelligent concept mapping and real-time processing.

## Overview

Finance Concept Translator uses advanced AI to extract financial terms from any PDF format, normalizes them using intelligent synonym mapping, and provides interactive Q&A capabilities for data exploration. Built for hackathon projects requiring accurate financial data extraction from varied document formats.

![Landing Page](./public/landingpage.png)

## Key Features

### Intelligent Document Processing
- **Format-Agnostic Extraction**: Works with any PDF layout, from simple invoices to complex multi-tax documents
- **AI-Powered Analysis**: Uses OpenAI GPT-4o-mini for context-aware extraction, not just keyword matching
- **Batch Processing**: Upload and process multiple documents simultaneously
- **Real-Time Updates**: See results appear instantly as they're processed

### Smart Normalization
- **Synonym Management**: Map variations (G.S.T, IGST, CGST) to canonical terms (GST)
- **Adaptive Learning**: System learns from your corrections and applies them to future processing
- **Concept Mapping**: Automatically normalizes terms across different documents

### Interactive Data Exploration
- **Q&A Chat Interface**: Ask natural language questions about your extracted data
- **Evidence Tracking**: View source snippets for every extracted value
- **Confidence Scoring**: See accuracy indicators for each extraction

### Data Export
- **CSV Export**: Download normalized data in Excel-compatible format
- **Complete Metadata**: Includes document names, page numbers, confidence scores, and evidence

## Technology Stack

### Frontend
- **Next.js 16** (App Router) - Full-stack React framework with server-side rendering
- **React 19** - Modern UI library with concurrent rendering
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling framework
- **Zustand** - Lightweight state management

### Backend
- **Next.js API Routes** - Serverless backend endpoints
- **Supabase** - PostgreSQL database with real-time subscriptions and file storage
- **OpenAI GPT-4o-mini** - AI-powered document analysis
- **pdf2json** - PDF text extraction library

### Infrastructure
- **Supabase Auth** - User authentication and session management
- **Supabase Storage** - Secure file storage
- **Supabase Realtime** - Live data streaming capabilities

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Supabase account and project
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd FinTech
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

4. Run the development server:
```bash
pnpm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Document Upload
1. Navigate to the dashboard after signing up/logging in
2. Drag and drop PDF files or click to browse
3. Multiple files can be uploaded simultaneously
4. Processing begins automatically

![Dashboard](./public/dashboard.png)

### Viewing Results
1. Results appear in real-time as processing completes
2. Use the search bar to filter by term, document, or canonical field
3. Click any row to view detailed evidence with source snippets
4. Confidence scores indicate extraction accuracy

![Results Table](./public/results.png)

![Evidence Drawer](./public/evidence.png)

### Managing Synonyms
1. Access the Synonyms Panel on the dashboard
2. Add new mappings: Map term variations to canonical fields
3. Edit existing mappings: Update normalization rules
4. Changes apply instantly to future processing

![Synonyms Panel](./public/synonyms.png)

### Interactive Q&A
1. Open the chat interface from the dashboard
2. Ask questions about your extracted data:
   - "What's the total GST amount?"
   - "Show all taxes from invoice_001.pdf"
   - "What's the discount on page 2?"
3. Get instant answers based on your extracted data

![Chat Interface](./public/chat.png)

### Exporting Data
1. Click the "Export CSV" button when results are ready
2. Download includes all fields: Document, Page, Original Term, Canonical Field, Value, Confidence, Evidence
3. Open in Excel or any spreadsheet application

## Development

### Running Tests
```bash
pnpm run test
```

### Building for Production
```bash
pnpm run build
pnpm start
```

### Linting
```bash
pnpm run lint
```

## Troubleshooting

### Documents Not Processing
- Check OpenAI API key is set correctly in `.env.local`
- Verify Supabase connection in browser console
- Check file size limits (default 10MB per file)

### Results Not Appearing
- Ensure job status is "done" before viewing results
- Check browser console for API errors
- Verify Supabase database connection

### Chat Not Working
- Ensure a job has completed processing
- Check that results exist for the jobId
- Verify OpenAI API key is valid








