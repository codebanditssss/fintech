import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all synonyms
export async function GET() {
  try {
    const { data: synonyms, error } = await supabase
      .from('synonyms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching synonyms:', error);
      return NextResponse.json(
        { error: 'Failed to fetch synonyms' },
        { status: 500 }
      );
    }

    return NextResponse.json(synonyms || []);

  } catch (error) {
    console.error('Synonyms fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch synonyms' },
      { status: 500 }
    );
  }
}

// POST create new synonym
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { term, canonical } = body;

    if (!term || !canonical) {
      return NextResponse.json(
        { error: 'Term and canonical are required' },
        { status: 400 }
      );
    }

    const { data: synonym, error } = await supabase
      .from('synonyms')
      .insert({ term, canonical })
      .select()
      .single();

    if (error) {
      console.error('Error creating synonym:', error);
      // Check for duplicate key violation
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        return NextResponse.json(
          { error: 'A synonym with this term already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: error.message || 'Failed to create synonym', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(synonym, { status: 201 });

  } catch (error: any) {
    console.error('Synonym creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create synonym', details: error },
      { status: 500 }
    );
  }
}

