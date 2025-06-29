import { NextRequest, NextResponse } from 'next/server';
import { searchWebMCPs } from '../../../../lib/webScraper';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const limit = parseInt(searchParams.get('limit') || '20');
  const sources = searchParams.get('sources') || 'github,huggingface,web,scraping';
  const minConfidence = parseFloat(searchParams.get('min_confidence') || '0.0');
  const useScraping = searchParams.get('use_scraping') === 'true';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const results = await searchWebMCPs(query, limit, {
      sources: sources.split(','),
      minConfidence,
      useScraping
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Web search failed:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}