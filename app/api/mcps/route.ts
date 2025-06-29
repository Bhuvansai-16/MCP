import { NextRequest, NextResponse } from 'next/server';

// Demo MCP data based on official MCP GitHub repositories
const DEMO_MCPS = [
  {
    id: 'mcp-weather-001',
    name: 'weather-forecast',
    description: 'Real-time weather data and forecasting with global coverage and severe weather alerts',
    tags: ['weather', 'api', 'forecast', 'alerts'],
    domain: 'weather',
    validated: true,
    popularity: 95,
    source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/weather',
    source_platform: 'github',
    confidence_score: 0.95,
    file_type: 'json',
    repository: 'modelcontextprotocol/servers',
    stars: 1250,
    created_at: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'mcp-filesystem-002',
    name: 'filesystem-operations',
    description: 'Secure file system operations with read/write capabilities and directory management',
    tags: ['filesystem', 'files', 'directories', 'io'],
    domain: 'development',
    validated: true,
    popularity: 88,
    source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    source_platform: 'github',
    confidence_score: 0.92,
    file_type: 'typescript',
    repository: 'modelcontextprotocol/servers',
    stars: 1250,
    created_at: new Date('2024-01-14').toISOString(),
  },
  {
    id: 'mcp-memory-003',
    name: 'memory-storage',
    description: 'Persistent memory storage for maintaining context across conversations',
    tags: ['memory', 'storage', 'context', 'persistence'],
    domain: 'ai',
    validated: true,
    popularity: 82,
    source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
    source_platform: 'github',
    confidence_score: 0.89,
    file_type: 'typescript',
    repository: 'modelcontextprotocol/servers',
    stars: 1250,
    created_at: new Date('2024-01-13').toISOString(),
  },
  {
    id: 'mcp-fetch-004',
    name: 'web-fetch',
    description: 'HTTP client for fetching web content with support for various formats',
    tags: ['http', 'web', 'fetch', 'client'],
    domain: 'web',
    validated: true,
    popularity: 76,
    source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
    source_platform: 'github',
    confidence_score: 0.87,
    file_type: 'typescript',
    repository: 'modelcontextprotocol/servers',
    stars: 1250,
    created_at: new Date('2024-01-12').toISOString(),
  },
  {
    id: 'mcp-sqlite-005',
    name: 'sqlite-database',
    description: 'SQLite database operations with query execution and schema management',
    tags: ['database', 'sqlite', 'sql', 'queries'],
    domain: 'data',
    validated: true,
    popularity: 79,
    source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite',
    source_platform: 'github',
    confidence_score: 0.91,
    file_type: 'typescript',
    repository: 'modelcontextprotocol/servers',
    stars: 1250,
    created_at: new Date('2024-01-11').toISOString(),
  },
  {
    id: 'mcp-github-006',
    name: 'github-integration',
    description: 'GitHub API integration for repository management and issue tracking',
    tags: ['github', 'git', 'repositories', 'issues'],
    domain: 'development',
    validated: true,
    popularity: 85,
    source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
    source_platform: 'github',
    confidence_score: 0.93,
    file_type: 'typescript',
    repository: 'modelcontextprotocol/servers',
    stars: 1250,
    created_at: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'mcp-slack-007',
    name: 'slack-connector',
    description: 'Slack workspace integration for messaging and channel management',
    tags: ['slack', 'messaging', 'communication', 'workspace'],
    domain: 'communication',
    validated: true,
    popularity: 71,
    source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
    source_platform: 'github',
    confidence_score: 0.84,
    file_type: 'typescript',
    repository: 'modelcontextprotocol/servers',
    stars: 1250,
    created_at: new Date('2024-01-09').toISOString(),
  },
  {
    id: 'mcp-postgres-008',
    name: 'postgresql-client',
    description: 'PostgreSQL database client with advanced query capabilities',
    tags: ['postgresql', 'database', 'sql', 'client'],
    domain: 'data',
    validated: true,
    popularity: 83,
    source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
    source_platform: 'github',
    confidence_score: 0.90,
    file_type: 'typescript',
    repository: 'modelcontextprotocol/servers',
    stars: 1250,
    created_at: new Date('2024-01-08').toISOString(),
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const tags = searchParams.get('tags');
    const validated = searchParams.get('validated');
    const sortBy = searchParams.get('sort_by') || 'popularity';
    const limit = parseInt(searchParams.get('limit') || '50');

    let filteredMCPs = [...DEMO_MCPS];

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
    filteredMCPs = filteredMCPs.slice(0, limit);

    return NextResponse.json(filteredMCPs);
  } catch (error) {
    console.error('Error fetching MCPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCPs' },
      { status: 500 }
    );
  }
}