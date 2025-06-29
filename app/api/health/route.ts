import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected',
    features: [
      'enhanced_web_scraping',
      'multi_platform_discovery', 
      'advanced_validation',
      'confidence_scoring',
      'robust_caching',
      'search_analytics',
      'scraping_analytics',
      'beautifulsoup4_integration'
    ],
    version: '3.0.0',
    scraping_enabled: true,
    supported_platforms: [
      'GitHub',
      'GitLab', 
      'Hugging Face',
      'General Web',
      'Awesome Lists'
    ]
  });
}