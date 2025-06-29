import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected',
    features: [
      'web_scraping',
      'github_search',
      'demo_data',
      'mcp_validation'
    ],
    version: '3.0.0',
    scraping_enabled: true,
    supported_platforms: [
      'GitHub',
      'General Web',
      'MCP Repositories'
    ]
  });
}