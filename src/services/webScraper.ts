import { mockWebMCPs, WebMCPResult } from '../data/mockMCPs';

export interface ScrapedMCP extends WebMCPResult {}

class WebScraperService {
  private isInitialized = false;
  private searchHistory: Array<{query: string, timestamp: Date, results: number}> = [];

  async initialize() {
    if (this.isInitialized) {
      console.log('🔧 Web scraper already initialized');
      return;
    }
    
    try {
      console.log('🚀 Initializing web scraper service...');
      console.log('🌐 Environment: Browser-based scraping');
      console.log('📊 Mock data available:', mockWebMCPs.length, 'MCPs');
      
      // Since Playwright doesn't work in browser environment, we'll use fetch-based scraping
      this.isInitialized = true;
      console.log('✅ Web scraper service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize web scraper:', error);
      throw new Error('Web scraping not available');
    }
  }

  async searchGitHub(query: string, limit: number = 10): Promise<ScrapedMCP[]> {
    console.log(`🐙 Searching GitHub for: "${query}" (limit: ${limit})`);
    
    try {
      // Simulate GitHub API search
      const searchTerms = query.toLowerCase().split(' ');
      
      // Filter mock data based on query relevance
      const filteredResults = mockWebMCPs.filter(mcp => {
        const searchableText = `${mcp.name} ${mcp.description} ${mcp.tags.join(' ')}`.toLowerCase();
        return searchTerms.some(term => searchableText.includes(term));
      });

      // Add some dynamic results based on query
      const dynamicResults: ScrapedMCP[] = [];
      
      if (query.toLowerCase().includes('weather')) {
        dynamicResults.push({
          name: `github-weather-${Date.now()}`,
          description: `Advanced weather MCP found on GitHub for "${query}"`,
          source_url: `https://github.com/weather-tools/${query.replace(/\s+/g, '-')}-mcp`,
          tags: ['weather', 'api', 'github', query.toLowerCase()],
          domain: 'weather',
          validated: true,
          file_type: 'typescript',
          repository: `weather-tools/${query.replace(/\s+/g, '-')}-mcp`,
          stars: Math.floor(Math.random() * 500) + 100,
          source_platform: 'github',
          confidence_score: 0.85 + Math.random() * 0.1
        });
      }

      if (query.toLowerCase().includes('api') || query.toLowerCase().includes('tool')) {
        dynamicResults.push({
          name: `api-${query.replace(/\s+/g, '-')}-tool`,
          description: `GitHub repository for ${query} API integration`,
          source_url: `https://github.com/api-tools/${query.replace(/\s+/g, '-')}`,
          tags: ['api', 'tools', 'integration', query.toLowerCase()],
          domain: 'development',
          validated: true,
          file_type: 'json',
          repository: `api-tools/${query.replace(/\s+/g, '-')}`,
          stars: Math.floor(Math.random() * 300) + 50,
          source_platform: 'github',
          confidence_score: 0.75 + Math.random() * 0.15
        });
      }

      const allResults = [...filteredResults, ...dynamicResults];

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

      console.log(`✅ GitHub search completed: ${allResults.length} results found`);
      return allResults.slice(0, limit);

    } catch (error) {
      console.error('❌ GitHub search failed:', error);
      return [];
    }
  }

  async searchWeb(query: string, limit: number = 10): Promise<ScrapedMCP[]> {
    console.log(`🌐 Searching general web for: "${query}" (limit: ${limit})`);
    
    try {
      // Simulate web search results
      const webResults: ScrapedMCP[] = [];
      
      // Generate dynamic results based on query
      const queryTerms = query.toLowerCase().split(' ');
      
      queryTerms.forEach((term, index) => {
        if (term.length > 2) { // Skip very short terms
          webResults.push({
            name: `web-${term}-mcp-${index}`,
            description: `Web-based ${term} MCP found via search engine crawling`,
            source_url: `https://mcp-registry.com/${term}-tools.json`,
            tags: [term, 'web', 'registry'],
            domain: this.inferDomain(term),
            validated: Math.random() > 0.3, // 70% chance of being validated
            file_type: Math.random() > 0.5 ? 'json' : 'yaml',
            source_platform: 'web',
            confidence_score: 0.6 + Math.random() * 0.3
          });
        }
      });

      // Add some high-quality results for common queries
      if (query.toLowerCase().includes('scraping') || query.toLowerCase().includes('scrape')) {
        webResults.push({
          name: 'professional-scraper-mcp',
          description: 'Enterprise-grade web scraping MCP with rate limiting and proxy support',
          source_url: 'https://scraping-tools.io/mcp/professional.json',
          tags: ['scraping', 'web', 'enterprise', 'proxy'],
          domain: 'development',
          validated: true,
          file_type: 'json',
          source_platform: 'web',
          confidence_score: 0.92
        });
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));

      console.log(`✅ Web search completed: ${webResults.length} results found`);
      return webResults.slice(0, limit);

    } catch (error) {
      console.error('❌ Web search failed:', error);
      return [];
    }
  }

  async searchAwesomeLists(query: string, limit: number = 10): Promise<ScrapedMCP[]> {
    console.log(`⭐ Searching awesome lists for: "${query}" (limit: ${limit})`);
    
    try {
      // Simulate awesome list search
      const awesomeResults: ScrapedMCP[] = [];
      
      // Filter existing awesome-style results
      const awesomeFiltered = mockWebMCPs.filter(mcp => 
        mcp.repository?.includes('awesome') || 
        mcp.description.toLowerCase().includes('awesome') ||
        mcp.tags.includes('awesome')
      );

      // Add query-specific awesome list results
      if (query.toLowerCase().includes('ai') || query.toLowerCase().includes('ml')) {
        awesomeResults.push({
          name: 'awesome-ai-mcp-collection',
          description: 'Curated collection of AI and ML MCPs from awesome-ai-tools',
          source_url: 'https://github.com/awesome-ai/mcp-tools/blob/main/ai-mcps.json',
          tags: ['ai', 'ml', 'awesome', 'collection'],
          domain: 'ai',
          validated: true,
          file_type: 'json',
          repository: 'awesome-ai/mcp-tools',
          stars: 1250,
          source_platform: 'github',
          confidence_score: 0.95
        });
      }

      const allResults = [...awesomeFiltered, ...awesomeResults];

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));

      console.log(`✅ Awesome lists search completed: ${allResults.length} results found`);
      return allResults.slice(0, limit);

    } catch (error) {
      console.error('❌ Awesome lists search failed:', error);
      return [];
    }
  }

  async searchAll(query: string, limit: number = 20): Promise<ScrapedMCP[]> {
    console.log(`🔍 Starting comprehensive search for: "${query}"`);
    console.log(`📊 Target limit: ${limit} results`);
    
    // Record search in history
    this.searchHistory.push({
      query,
      timestamp: new Date(),
      results: 0 // Will be updated later
    });

    try {
      const searchPromises = [
        this.searchGitHub(query, Math.ceil(limit / 3)),
        this.searchWeb(query, Math.ceil(limit / 3)),
        this.searchAwesomeLists(query, Math.ceil(limit / 3))
      ];

      console.log('🚀 Executing parallel searches...');
      const results = await Promise.allSettled(searchPromises);

      const allResults: ScrapedMCP[] = [];

      // Process GitHub results
      if (results[0].status === 'fulfilled') {
        console.log(`🐙 GitHub: ${results[0].value.length} results`);
        allResults.push(...results[0].value);
      } else {
        console.error('❌ GitHub search failed:', results[0].reason);
      }

      // Process Web results
      if (results[1].status === 'fulfilled') {
        console.log(`🌐 Web: ${results[1].value.length} results`);
        allResults.push(...results[1].value);
      } else {
        console.error('❌ Web search failed:', results[1].reason);
      }

      // Process Awesome Lists results
      if (results[2].status === 'fulfilled') {
        console.log(`⭐ Awesome: ${results[2].value.length} results`);
        allResults.push(...results[2].value);
      } else {
        console.error('❌ Awesome lists search failed:', results[2].reason);
      }

      // Deduplicate by URL and name
      const uniqueResults = this.deduplicateResults(allResults);
      console.log(`🔄 Deduplicated: ${allResults.length} → ${uniqueResults.length} results`);

      // Sort by confidence score and relevance
      const sortedResults = this.rankResults(uniqueResults, query);
      console.log(`📈 Results ranked by relevance and confidence`);

      // Apply final limit
      const finalResults = sortedResults.slice(0, limit);

      // Update search history
      const lastSearch = this.searchHistory[this.searchHistory.length - 1];
      if (lastSearch) {
        lastSearch.results = finalResults.length;
      }

      console.log(`✅ Comprehensive search completed:`);
      console.log(`   📊 Total results: ${finalResults.length}`);
      console.log(`   ⏱️ Search history: ${this.searchHistory.length} searches`);
      
      // Log sample results for debugging
      finalResults.slice(0, 3).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.name} (${result.confidence_score.toFixed(2)} confidence)`);
      });

      return finalResults;

    } catch (error) {
      console.error('❌ Comprehensive search failed:', error);
      return [];
    }
  }

  private deduplicateResults(results: ScrapedMCP[]): ScrapedMCP[] {
    const seen = new Set<string>();
    return results.filter(mcp => {
      const key = `${mcp.name}-${mcp.source_url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private rankResults(results: ScrapedMCP[], query: string): ScrapedMCP[] {
    const queryLower = query.toLowerCase();
    
    return results.sort((a, b) => {
      // Calculate relevance score
      const aRelevance = this.calculateRelevance(a, queryLower);
      const bRelevance = this.calculateRelevance(b, queryLower);
      
      // Combine relevance and confidence
      const aScore = (aRelevance * 0.6) + (a.confidence_score * 0.4);
      const bScore = (bRelevance * 0.6) + (b.confidence_score * 0.4);
      
      return bScore - aScore;
    });
  }

  private calculateRelevance(mcp: ScrapedMCP, query: string): number {
    let score = 0;
    const searchableText = `${mcp.name} ${mcp.description} ${mcp.tags.join(' ')}`.toLowerCase();
    
    // Exact name match
    if (mcp.name.toLowerCase().includes(query)) {
      score += 0.5;
    }
    
    // Description match
    if (mcp.description.toLowerCase().includes(query)) {
      score += 0.3;
    }
    
    // Tag matches
    const queryWords = query.split(' ');
    queryWords.forEach(word => {
      if (mcp.tags.some(tag => tag.toLowerCase().includes(word))) {
        score += 0.1;
      }
    });
    
    // Platform bonus
    if (mcp.source_platform === 'github') {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  private inferDomain(term: string): string {
    const domainMap: Record<string, string> = {
      'weather': 'weather',
      'api': 'development',
      'file': 'development',
      'calendar': 'productivity',
      'social': 'social',
      'shop': 'ecommerce',
      'travel': 'travel',
      'finance': 'finance',
      'ai': 'ai',
      'ml': 'ai',
      'scrape': 'development',
      'tool': 'development'
    };
    
    return domainMap[term] || 'general';
  }

  getSearchHistory(): Array<{query: string, timestamp: Date, results: number}> {
    return [...this.searchHistory];
  }

  clearSearchHistory(): void {
    this.searchHistory = [];
    console.log('🧹 Search history cleared');
  }

  async cleanup() {
    console.log('🧹 Cleaning up web scraper service...');
    this.isInitialized = false;
    console.log('✅ Web scraper service cleaned up');
  }
}

export const webScraperService = new WebScraperService();