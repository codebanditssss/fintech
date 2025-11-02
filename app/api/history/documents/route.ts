import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select(`
        id,
        name,
        file_size,
        status,
        created_at,
        upload_date
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching document history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch document history' },
        { status: 500 }
      );
    }

    // Get job info for each document via results table
    const history = await Promise.all(
      documents?.map(async (doc) => {
        const { data: result } = await supabase
          .from('results')
          .select('job_id')
          .eq('doc_id', doc.id)
          .limit(1)
          .maybeSingle();

        const jobId = result?.job_id || null;
        let recordsCount = 0;
        let jobStatus = 'unknown';

        if (jobId) {
          const { data: job } = await supabase
            .from('jobs')
            .select('status, total_records')
            .eq('id', jobId)
            .maybeSingle();
          
          recordsCount = job?.total_records || 0;
          jobStatus = job?.status || 'unknown';
        }

        return {
          id: doc.id,
          name: doc.name,
          fileSize: doc.file_size,
          status: doc.status,
          uploadDate: doc.upload_date || doc.created_at,
          jobId,
          recordsCount,
          jobStatus,
        };
      }) || []
    );

    return NextResponse.json(history);
  } catch (error) {
    console.error('Document history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document history' },
      { status: 500 }
    );
  }
}

