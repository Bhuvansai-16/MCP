import { mockWebMCPs, WebMCPResult } from '../data/mockMCPs';

export interface ScrapedMCP extends WebMCPResult {}

class WebScraperService {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing web scraper service...');
      // Since Playwright doesn't work in browser environment, we'll use fetch-based scraping
      this.isInitialized = true;
      console.log('Web scraper service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize web scraper:', error);
      throw new Error('Web scraping not available');
    }
  }

  async searchGitHub(query: string, limit: number = 10): Promise<ScrapedMCP[]> {
    console.log(`Searching GitHub for: ${query}`);
    
    try {
      // For demo purposes, filter mock data based on query
      const filteredResults = mockWebMCPs.filter(mcp => 
        mcp.name.toLowerCase().includes(query.toLowerCase()) ||
        mcp.description.toLowerCase().includes(query.toLowerCase()) ||
        mcp.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log(`Found ${filteredResults.length} MCPs from GitHub`);
      return filteredResults.slice(0, limit);

    } catch (error) {
      console.error('GitHub search failed:', error);
      return [];
    }
  }

  async searchWeb(query: string, limit: number = 10): Promise<ScrapedMCP[]> {
    console.log(`Searching web for: ${query}`);
    
    try {
      // For demo purposes, return some mock results
      const webResults: ScrapedMCP[] = [
        {
          name: `web-${query}-tool`,
          description: `Web-based ${query} tool found via search`,
          source_url: `https://example.com/${query}-mcp.json`,
          tags: [query, 'web', 'api'],
          domain: 'general',
          validated: false,
          file_type: 'json',
          source_platform: 'web',
          confidence_score: 0.7
        }
      ];

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log(`Found ${webResults.length} MCPs from web search`);
      return webResults.slice(0, limit);

    } catch (error) {
      console.error('Web search failed:', error);
      return [];
    }
  }

  async searchAwesomeLists(query: string, limit: number = 10): Promise<ScrapedMCP[]> {
    console.log('Searching awesome lists for MCPs...');
    
    try {
      // For demo purposes, return filtered mock data
      const awesomeResults = mockWebMCPs.filter(mcp => 
        mcp.repository?.includes('awesome') || 
        mcp.description.toLowerCase().includes('awesome')
      );

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      console.log(`Found ${awesomeResults.length} MCPs from awesome lists`);
      return awesomeResults.slice(0, limit);

    } catch (error) {
      console.error('Awesome lists search failed:', error);
      return [];
    }
  }

  async searchAll(query: string, limit: number = 20): Promise<ScrapedMCP[]> {
    console.log(`Starting comprehensive web search for: ${query}`);
    
    try {
      const [githubResults, webResults, awesomeResults] = await Promise.allSettled([
        this.searchGitHub(query, Math.ceil(limit / 3)),
        this.searchWeb(query, Math.ceil(limit / 3)),
        this.searchAwesomeLists(query, Math.ceil(limit / 3))
      ]);

      const allResults: ScrapedMCP[] = [];

      if (githubResults.status === 'fulfilled') {
        allResults.push(...githubResults.value);
      }
      if (webResults.status === 'fulfilled') {
        allResults.push(...webResults.value);
      }
      if (awesomeResults.status === 'fulfilled') {
        allResults.push(...awesomeResults.value);
      }

      // Deduplicate by URL
      const uniqueResults = allResults.filter((mcp, index, arr) => 
        arr.findIndex(m => m.source_url === mcp.source_url) === index
      );

      // Sort by confidence score
      uniqueResults.sort((a, b) => b.confidence_score - a.confidence_score);

      console.log(`Found ${uniqueResults.length} unique MCPs total`);
      return uniqueResults.slice(0, limit);

    } catch (error) {
      console.error('Comprehensive search failed:', error);
      return [];
    }
  }

  async cleanup() {
    // No cleanup needed for fetch-based implementation
    console.log('Web scraper service cleaned up');
  }
}

export const webScraperService = new WebScraperService();