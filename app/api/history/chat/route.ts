import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    let query = supabase
      .from('chat_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    const { data: history, error } = await query;

    if (error) {
      console.error('Error fetching chat history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch chat history' },
        { status: 500 }
      );
    }

    return NextResponse.json(history || []);
  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}

