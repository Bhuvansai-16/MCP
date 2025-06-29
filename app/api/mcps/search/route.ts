import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface WebMCPResult {
  name: string;
  description: string;
  source_url: string;
  tags: string[];
  domain: string;
  validated: boolean;
  schema?: any;
  file_type: string;
  repository?: string;
  stars?: number;
  source_platform: string;
  confidence_score: number;
}

// GitHub API search for MCP repositories
async function searchGitHub(query: string, limit: number): Promise<WebMCPResult[]> {
  try {
    const searchQueries = [
      `${query} model context protocol`,
      `${query} mcp server`,
      `${query} filename:mcp.json`,
      `mcp ${query}`
    ];

    const results: WebMCPResult[] = [];

    for (const searchQuery of searchQueries.slice(0, 2)) { // Limit to avoid rate limits
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=${Math.min(limit, 10)}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'MCP-Playground'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        for (const repo of data.items || []) {
          if (results.length >= limit) break;
          
          // Check if this looks like an MCP repository
          const description = repo.description || '';
          const name = repo.name || '';
          const isMCPRelated = 
            description.toLowerCase().includes('mcp') ||
            description.toLowerCase().includes('model context protocol') ||
            name.toLowerCase().includes('mcp') ||
            repo.topics?.some((topic: string) => topic.includes('mcp'));

          if (isMCPRelated) {
            results.push({
              name: repo.name,
              description: repo.description || 'No description available',
              source_url: repo.html_url,
              tags: repo.topics || ['mcp'],
              domain: inferDomain(repo.name, repo.description),
              validated: false,
              file_type: 'repository',
              repository: repo.full_name,
              stars: repo.stargazers_count,
              source_platform: 'github',
              confidence_score: calculateConfidence(repo.name, repo.description, repo.stargazers_count)
            });
          }
        }
      }

      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  } catch (error) {
    console.error('GitHub search error:', error);
    return [];
  }
}

// Web scraping for MCP content
async function scrapeWebForMCPs(query: string, limit: number): Promise<WebMCPResult[]> {
  try {
    const results: WebMCPResult[] = [];
    
    // Search for MCP-related content on known sites
    const searchUrls = [
      `https://github.com/search?q=${encodeURIComponent(query + ' mcp')}&type=repositories`,
      `https://github.com/modelcontextprotocol`,
    ];

    for (const url of searchUrls) {
      if (results.length >= limit) break;
      
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);
          
          // Extract repository information from GitHub search results
          $('.repo-list-item, .Box-row').each((i, element) => {
            if (results.length >= limit) return false;
            
            const $element = $(element);
            const titleElement = $element.find('h3 a, .f4 a').first();
            const title = titleElement.text().trim();
            const href = titleElement.attr('href');
            const description = $element.find('p, .color-fg-muted').first().text().trim();
            
            if (title && href && (title.toLowerCase().includes('mcp') || description.toLowerCase().includes('mcp'))) {
              const fullUrl = href.startsWith('http') ? href : `https://github.com${href}`;
              
              results.push({
                name: title.split('/').pop() || title,
                description: description || 'No description available',
                source_url: fullUrl,
                tags: extractTags(title, description),
                domain: inferDomain(title, description),
                validated: false,
                file_type: 'repository',
                repository: title,
                stars: 0,
                source_platform: 'web_scraping',
                confidence_score: calculateConfidence(title, description, 0)
              });
            }
          });
        }
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  } catch (error) {
    console.error('Web scraping error:', error);
    return [];
  }
}

function inferDomain(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase();
  
  const domainKeywords = {
    'weather': ['weather', 'climate', 'forecast', 'temperature'],
    'finance': ['finance', 'trading', 'stock', 'crypto', 'payment'],
    'travel': ['travel', 'booking', 'hotel', 'flight'],
    'productivity': ['calendar', 'task', 'note', 'email', 'schedule'],
    'development': ['code', 'git', 'github', 'deploy', 'api', 'filesystem'],
    'social': ['social', 'twitter', 'facebook', 'slack', 'discord'],
    'data': ['data', 'database', 'sql', 'postgres', 'sqlite'],
    'ai': ['ai', 'ml', 'llm', 'gpt', 'model'],
    'communication': ['chat', 'message', 'slack', 'discord', 'teams'],
    'web': ['web', 'http', 'fetch', 'browser']
  };
  
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return domain;
    }
  }
  
  return 'general';
}

function extractTags(name: string, description: string): string[] {
  const text = `${name} ${description}`.toLowerCase();
  const tags = new Set<string>();
  
  const tagPatterns = {
    'mcp': ['mcp', 'model context protocol'],
    'api': ['api', 'rest', 'endpoint'],
    'database': ['db', 'database', 'sql'],
    'web': ['web', 'http', 'fetch'],
    'filesystem': ['file', 'filesystem', 'directory'],
    'memory': ['memory', 'storage', 'cache'],
    'github': ['github', 'git'],
    'slack': ['slack'],
    'weather': ['weather'],
    'server': ['server', 'service']
  };
  
  for (const [tag, patterns] of Object.entries(tagPatterns)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      tags.add(tag);
    }
  }
  
  return Array.from(tags);
}

function calculateConfidence(name: string, description: string, stars: number): number {
  let score = 0.5; // Base score
  
  const text = `${name} ${description}`.toLowerCase();
  
  // MCP-specific indicators
  if (text.includes('mcp') || text.includes('model context protocol')) {
    score += 0.3;
  }
  
  // Quality indicators
  if (description && description.length > 20) {
    score += 0.1;
  }
  
  if (stars > 10) {
    score += 0.1;
  }
  
  if (stars > 100) {
    score += 0.1;
  }
  
  return Math.min(score, 1.0);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const sources = searchParams.get('sources') || 'github,web';
    const useScraping = searchParams.get('use_scraping') === 'true';

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    const results: WebMCPResult[] = [];
    const sourceList = sources.split(',').map(s => s.trim());

    // GitHub API search
    if (sourceList.includes('github')) {
      const githubResults = await searchGitHub(query, Math.ceil(limit / 2));
      results.push(...githubResults);
    }

    // Web scraping
    if (useScraping && sourceList.includes('web')) {
      const webResults = await scrapeWebForMCPs(query, Math.ceil(limit / 2));
      results.push(...webResults);
    }

    // Remove duplicates and sort by confidence
    const uniqueResults = results.filter((result, index, self) => 
      index === self.findIndex(r => r.source_url === result.source_url)
    );

    const sortedResults = uniqueResults
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, limit);

    return NextResponse.json(sortedResults);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}