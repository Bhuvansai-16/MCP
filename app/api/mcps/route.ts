import { NextRequest, NextResponse } from 'next/server';
import { sampleMCPs } from '../../../lib/sampleData';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  const tags = searchParams.get('tags');
  const validated = searchParams.get('validated');
  const sortBy = searchParams.get('sort_by') || 'popularity';
  const limit = parseInt(searchParams.get('limit') || '50');

  let filteredMCPs = [...sampleMCPs];

  // Apply filters
  if (domain && domain !== 'all') {
    filteredMCPs = filteredMCPs.filter(mcp => mcp.domain === domain);
  }

  if (tags) {
    const tagList = tags.split(',').map(tag => tag.trim().toLowerCase());
    filteredMCPs = filteredMCPs.filter(mcp => 
      mcp.tags.some(tag => tagList.includes(tag.toLowerCase()))
    );
  }

  if (validated !== null) {
    const isValidated = validated === 'true';
    filteredMCPs = filteredMCPs.filter(mcp => mcp.validated === isValidated);
  }

  // Apply sorting
  switch (sortBy) {
    case 'name':
      filteredMCPs.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'created_at':
      filteredMCPs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case 'confidence_score':
      filteredMCPs.sort((a, b) => b.confidence_score - a.confidence_score);
      break;
    default: // popularity
      filteredMCPs.sort((a, b) => b.popularity - a.popularity);
  }

  // Apply limit
  const results = filteredMCPs.slice(0, limit);

  return NextResponse.json(results);
}