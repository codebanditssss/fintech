import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    console.log(`[Results API] Fetching results for jobId: ${jobId}`);

    const { data: results, error } = await supabase
      .from('results')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`[Results API] Error fetching results for jobId ${jobId}:`, error);
      return NextResponse.json(
        { error: 'Failed to fetch results', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[Results API] Found ${results?.length || 0} results for jobId ${jobId}`);
    if (results && results.length > 0) {
      console.log(`[Results API] Sample results:`, results.slice(0, 3).map(r => ({
        term: r.original_term,
        canonical: r.canonical,
        value: r.value
      })));
    } else {
      console.warn(`[Results API] ⚠️ No results found for jobId ${jobId}`);
      // Check if job exists
      const { data: job } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (job) {
        console.log(`[Results API] Job exists with status: ${job.status}, progress: ${job.progress}, total_records: ${job.total_records}`);
      } else {
        console.warn(`[Results API] Job ${jobId} not found`);
      }
    }

    // Transform to match frontend interface
    const transformedResults = results?.map(result => ({
      id: result.id,
      docId: result.doc_id,
      docName: result.doc_name,
      page: result.page,
      originalTerm: result.original_term,
      canonical: result.canonical,
      value: result.value,
      confidence: result.confidence,
      evidence: result.evidence,
    })) || [];

    return NextResponse.json(transformedResults);

  } catch (error) {
    console.error('[Results API] Results fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results', details: (error as Error).message },
      { status: 500 }
    );
  }
}

