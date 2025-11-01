import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { processPDFBatch } from '@/lib/openai-service';
import { uploadFileToStorage } from '@/lib/storage-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Create a new job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        status: 'queued',
        progress: 0,
        documents_processed: 0,
        total_records: 0,
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Error creating job:', jobError);
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      );
    }

    // Process each file and optionally upload to storage
    const documentPromises = files.map(async (file) => {
      // Try to upload to Supabase Storage (optional, won't fail if it doesn't work)
      const filePath = await uploadFileToStorage(file, job.id);

      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          file_path: filePath,
          file_size: file.size,
          status: 'uploaded',
        })
        .select()
        .single();

      if (docError) {
        console.error('Error creating document:', docError);
        return null;
      }

      return document;
    });

    const documents = await Promise.all(documentPromises);
    const validDocuments = documents.filter(Boolean);

    // Update job to running status
    await supabase
      .from('jobs')
      .update({ 
        status: 'running',
        message: `Processing ${validDocuments.length} documents...`
      })
      .eq('id', job.id);

    // Start background processing with real OpenAI extraction
    processDocuments(job.id, validDocuments.map(d => d!.id), files);

    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
    });

  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}

// Real processing function with OpenAI
async function processDocuments(jobId: string, documentIds: string[], files: File[]) {
  try {
    console.log(`[Job ${jobId}] Starting real OCR processing for ${files.length} files`);

    // Update job to running
    await supabase
      .from('jobs')
      .update({ 
        progress: 5, 
        message: 'Initializing OCR engine...' 
      })
      .eq('id', jobId);

    // Get synonyms for mapping
    const { data: synonyms } = await supabase
      .from('synonyms')
      .select('*');

    const synonymMap = new Map(synonyms?.map(s => [s.term.toLowerCase(), s.canonical]) || []);
    console.log(`[Job ${jobId}] Loaded ${synonyms?.length || 0} synonym mappings`);

    // Process all PDFs with OpenAI
    let currentProgress = 10;
    const allResults: any[] = [];

    const extractionResults = await processPDFBatch(files, async (current, total, filename) => {
      // Update progress for each file
      currentProgress = 10 + Math.floor((current / total) * 60);
      await supabase
        .from('jobs')
        .update({ 
          progress: currentProgress,
          message: `Extracting data from ${filename} (${current}/${total})...`
        })
        .eq('id', jobId);
      
      console.log(`[Job ${jobId}] Processing ${filename}: ${current}/${total}`);
    });

    console.log(`[Job ${jobId}] OpenAI extraction complete. Processing results...`);

    await supabase
      .from('jobs')
      .update({ 
        progress: 75,
        message: 'Mapping extracted terms to canonical fields...'
      })
      .eq('id', jobId);

    // Map extraction results to database format
    for (let i = 0; i < extractionResults.length; i++) {
      const extraction = extractionResults[i];
      const docId = documentIds[i];

      // Get document info
      const { data: doc } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .single();

      if (!doc || extraction.results.length === 0) {
        console.log(`[Job ${jobId}] No results for ${extraction.filename}`);
        continue;
      }

      // Map each extracted term
      for (const extracted of extraction.results) {
        // Find canonical term from synonyms
        const canonical = synonymMap.get(extracted.term.toLowerCase()) || extracted.term;

        allResults.push({
          job_id: jobId,
          doc_id: docId,
          doc_name: doc.name,
          page: extracted.page,
          original_term: extracted.term,
          canonical: canonical,
          value: extracted.value,
          confidence: extracted.confidence,
          evidence: extracted.evidence,
        });
      }
    }

    console.log(`[Job ${jobId}] Mapped ${allResults.length} financial terms`);

    await supabase
      .from('jobs')
      .update({ 
        progress: 85,
        message: 'Saving extracted data...'
      })
      .eq('id', jobId);

    // Insert all results to database
    if (allResults.length > 0) {
      const { error: resultsError } = await supabase
        .from('results')
        .insert(allResults);

      if (resultsError) {
        console.error(`[Job ${jobId}] Error inserting results:`, resultsError);
        throw resultsError;
      }
    }

    await supabase
      .from('jobs')
      .update({ 
        progress: 95,
        message: 'Finalizing...'
      })
      .eq('id', jobId);

    // Wait a moment for UI effect
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mark job as complete
    await supabase
      .from('jobs')
      .update({
        status: 'done',
        progress: 100,
        documents_processed: files.length,
        total_records: allResults.length,
        message: `Successfully extracted ${allResults.length} financial terms from ${files.length} documents`,
      })
      .eq('id', jobId);

    console.log(`[Job ${jobId}] Processing complete! Total records: ${allResults.length}`);

  } catch (error) {
    console.error(`[Job ${jobId}] Processing error:`, error);
    
    await supabase
      .from('jobs')
      .update({
        status: 'error',
        message: 'Processing failed: ' + (error as Error).message,
      })
      .eq('id', jobId);
  }
}

