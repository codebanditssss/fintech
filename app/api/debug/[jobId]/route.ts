import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Debug endpoint to check job status and results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Get job info
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({
        error: 'Job not found',
        jobId,
        jobError
      }, { status: 404 });
    }

    // Get documents for this job
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('job_id', jobId);

    // Get results
    const { data: results, error: resultsError } = await supabase
      .from('results')
      .select('*')
      .eq('job_id', jobId);

    // Get synonyms
    const { data: synonyms } = await supabase
      .from('synonyms')
      .select('*');

    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        message: job.message,
        documents_processed: job.documents_processed,
        total_records: job.total_records,
        created_at: job.created_at,
      },
      documents: documents || [],
      results: {
        count: results?.length || 0,
        data: results || [],
        error: resultsError,
      },
      synonyms: {
        count: synonyms?.length || 0,
        mappings: synonyms?.map(s => `${s.term} -> ${s.canonical}`) || [],
      },
      debug: {
        geminiApiKey: process.env.GEMINI_API_KEY ? 'SET' : 'MISSING',
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Debug failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

