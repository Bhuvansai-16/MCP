import { chromium, Browser, Page } from 'playwright';

export interface ScrapedMCP {
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

class WebScraperService {
  private browser: Browser | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing Playwright browser...');
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.isInitialized = true;
      console.log('Playwright browser initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Playwright:', error);
      throw new Error('Web scraping not available - Playwright initialization failed');
    }
  }

  async searchGitHub(query: string, limit: number = 10): Promise<ScrapedMCP[]> {
    if (!this.browser) await this.initialize();
    
    const page = await this.browser!.newPage();
    const results: ScrapedMCP[] = [];

    try {
      console.log(`Searching GitHub for: ${query}`);
      
      // Search for MCP files on GitHub
      const searchUrl = `https://github.com/search?q=${encodeURIComponent(query)}+filename%3A.mcp.json+OR+filename%3A.mcp.yaml&type=code`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      // Extract search results
      const searchResults = await page.$$eval('.search-result-item', (items) => {
        return items.slice(0, 10).map(item => {
          const titleElement = item.querySelector('a[href*="/blob/"]');
          const repoElement = item.querySelector('a[href*="github.com/"]');
          const codePreview = item.querySelector('.code-list');
          
          return {
            url: titleElement?.getAttribute('href') || '',
            repository: repoElement?.textContent?.trim() || '',
            preview: codePreview?.textContent?.trim() || ''
          };
        });
      });

      // Process each result
      for (const result of searchResults.slice(0, limit)) {
        if (!result.url) continue;

        try {
          const fullUrl = result.url.startsWith('http') ? result.url : `https://github.com${result.url}`;
          const rawUrl = fullUrl.replace('/blob/', '/raw/');
          
          // Fetch the raw file content
          const response = await fetch(rawUrl);
          if (!response.ok) continue;
          
          const content = await response.text();
          const mcp = this.parseAndValidateMCP(content, fullUrl, result.repository);
          
          if (mcp) {
            results.push(mcp);
          }
        } catch (error) {
          console.warn(`Failed to process result: ${result.url}`, error);
        }
      }

      console.log(`Found ${results.length} valid MCPs from GitHub`);
      return results;

    } catch (error) {
      console.error('GitHub search failed:', error);
      return [];
    } finally {
      await page.close();
    }
  }

  async searchWeb(query: string, limit: number = 10): Promise<ScrapedMCP[]> {
    if (!this.browser) await this.initialize();
    
    const page = await this.browser!.newPage();
    const results: ScrapedMCP[] = [];

    try {
      console.log(`Searching web for: ${query}`);
      
      // Use DuckDuckGo for web search
      const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}+mcp+json+filetype%3Ajson`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      // Extract search result links
      const links = await page.$$eval('a[href*="http"]', (elements) => {
        return elements
          .map(el => el.getAttribute('href'))
          .filter(href => href && (href.includes('.json') || href.includes('mcp')))
          .slice(0, 20);
      });

      // Process each link
      for (const link of links.slice(0, limit)) {
        if (!link) continue;

        try {
          const response = await fetch(link);
          if (!response.ok) continue;
          
          const content = await response.text();
          const mcp = this.parseAndValidateMCP(content, link, '');
          
          if (mcp) {
            results.push(mcp);
          }
        } catch (error) {
          console.warn(`Failed to process link: ${link}`, error);
        }
      }

      console.log(`Found ${results.length} valid MCPs from web search`);
      return results;

    } catch (error) {
      console.error('Web search failed:', error);
      return [];
    } finally {
      await page.close();
    }
  }

  async searchAwesomeLists(query: string, limit: number = 10): Promise<ScrapedMCP[]> {
    if (!this.browser) await this.initialize();
    
    const page = await this.browser!.newPage();
    const results: ScrapedMCP[] = [];

    try {
      console.log('Searching awesome lists for MCPs...');
      
      const awesomeUrls = [
        'https://github.com/modelcontextprotocol/servers',
        'https://github.com/topics/mcp',
        'https://github.com/topics/model-context-protocol'
      ];

      for (const url of awesomeUrls) {
        try {
          await page.goto(url, { waitUntil: 'networkidle' });
          await page.waitForTimeout(2000);

          // Extract repository links
          const repoLinks = await page.$$eval('a[href*="github.com/"]', (elements) => {
            return elements
              .map(el => el.getAttribute('href'))
              .filter(href => href && href.includes('github.com/') && !href.includes('/topics/'))
              .slice(0, 10);
          });

          // Process each repository
          for (const repoLink of repoLinks.slice(0, Math.ceil(limit / awesomeUrls.length))) {
            if (!repoLink) continue;

            try {
              // Look for MCP files in the repository
              const searchUrl = `${repoLink}/search?q=filename%3A.mcp.json+OR+filename%3A.mcp.yaml`;
              await page.goto(searchUrl, { waitUntil: 'networkidle' });
              
              const mcpFiles = await page.$$eval('a[href*="/blob/"]', (elements) => {
                return elements
                  .map(el => el.getAttribute('href'))
                  .filter(href => href && (href.includes('.mcp.') || href.includes('mcp')))
                  .slice(0, 3);
              });

              for (const mcpFile of mcpFiles) {
                if (!mcpFile) continue;
                
                const fullUrl = mcpFile.startsWith('http') ? mcpFile : `https://github.com${mcpFile}`;
                const rawUrl = fullUrl.replace('/blob/', '/raw/');
                
                const response = await fetch(rawUrl);
                if (!response.ok) continue;
                
                const content = await response.text();
                const mcp = this.parseAndValidateMCP(content, fullUrl, repoLink);
                
                if (mcp) {
                  results.push(mcp);
                }
              }
            } catch (error) {
              console.warn(`Failed to process repository: ${repoLink}`, error);
            }
          }
        } catch (error) {
          console.warn(`Failed to process awesome list: ${url}`, error);
        }
      }

      console.log(`Found ${results.length} valid MCPs from awesome lists`);
      return results;

    } catch (error) {
      console.error('Awesome lists search failed:', error);
      return [];
    } finally {
      await page.close();
    }
  }

  private parseAndValidateMCP(content: string, sourceUrl: string, repository: string): ScrapedMCP | null {
    try {
      let data: any;
      let fileType = 'json';

      // Try to parse as JSON first
      try {
        data = JSON.parse(content);
      } catch {
        // Try YAML
        try {
          const yaml = await import('js-yaml');
          data = yaml.load(content);
          fileType = 'yaml';
        } catch {
          return null;
        }
      }

      // Validate MCP structure
      if (!this.isValidMCPStructure(data)) {
        return null;
      }

      // Extract metadata
      const name = data.name || this.extractNameFromUrl(sourceUrl);
      const description = data.description || `MCP found at ${sourceUrl}`;
      const domain = this.extractDomain(data, name, description);
      const tags = this.extractTags(data, name, description);
      const confidence = this.calculateConfidence(data, sourceUrl);

      return {
        name,
        description,
        source_url: sourceUrl,
        tags,
        domain,
        validated: true,
        schema: data,
        file_type: fileType,
        repository: repository || this.extractRepository(sourceUrl),
        stars: undefined, // Would need GitHub API for this
        source_platform: sourceUrl.includes('github.com') ? 'github' : 'web',
        confidence_score: confidence
      };

    } catch (error) {
      console.warn('Failed to parse MCP content:', error);
      return null;
    }
  }

  private isValidMCPStructure(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    if (!data.name || typeof data.name !== 'string') return false;
    if (!data.tools || !Array.isArray(data.tools)) return false;
    
    // Validate tools structure
    for (const tool of data.tools) {
      if (!tool || typeof tool !== 'object') return false;
      if (!tool.name || !tool.description) return false;
    }
    
    return true;
  }

  private extractNameFromUrl(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace(/\.(json|yaml|yml)$/, '') || 'unknown-mcp';
  }

  private extractRepository(url: string): string | undefined {
    const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
    return match ? match[1] : undefined;
  }

  private extractDomain(data: any, name: string, description: string): string {
    if (data.domain) return data.domain;
    
    const text = `${name} ${description}`.toLowerCase();
    
    const domainKeywords = {
      'weather': ['weather', 'climate', 'forecast'],
      'finance': ['finance', 'trading', 'stock', 'crypto'],
      'travel': ['travel', 'booking', 'hotel', 'flight'],
      'productivity': ['calendar', 'task', 'note', 'email'],
      'development': ['code', 'git', 'github', 'deploy'],
      'social': ['social', 'twitter', 'facebook', 'post'],
      'ecommerce': ['shop', 'store', 'product', 'cart'],
      'data': ['data', 'analytics', 'database', 'query'],
      'ai': ['ai', 'ml', 'llm', 'gpt', 'model'],
      'communication': ['chat', 'message', 'slack', 'discord']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return domain;
      }
    }

    return 'general';
  }

  private extractTags(data: any, name: string, description: string): string[] {
    const tags = new Set<string>();

    // Add explicit tags
    if (data.tags && Array.isArray(data.tags)) {
      data.tags.forEach((tag: string) => tags.add(tag));
    }

    // Extract from tool names
    if (data.tools) {
      data.tools.forEach((tool: any) => {
        if (tool.name) {
          const toolName = tool.name.toLowerCase();
          tags.add(toolName.split('_')[0]);
        }
      });
    }

    // Extract from text
    const text = `${name} ${description}`.toLowerCase();
    const commonTags = ['api', 'web', 'database', 'cloud', 'automation', 'integration'];
    
    commonTags.forEach(tag => {
      if (text.includes(tag)) {
        tags.add(tag);
      }
    });

    return Array.from(tags).slice(0, 10); // Limit to 10 tags
  }

  private calculateConfidence(data: any, url: string): number {
    let score = 0.5; // Base score

    // Schema completeness
    if (data.description) score += 0.1;
    if (data.version) score += 0.1;
    if (data.tools && data.tools.length > 1) score += 0.1;

    // Tool quality
    if (data.tools) {
      data.tools.forEach((tool: any) => {
        if (tool.parameters) score += 0.05;
        if (tool.description && tool.description.length > 20) score += 0.05;
      });
    }

    // URL quality
    if (url.includes('github.com')) score += 0.1;
    if (url.includes('.mcp.')) score += 0.1;

    return Math.min(score, 1.0);
  }

  async searchAll(query: string, limit: number = 20): Promise<ScrapedMCP[]> {
    console.log(`Starting comprehensive web search for: ${query}`);
    
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
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
    }
  }
}

export const webScraperService = new WebScraperService();