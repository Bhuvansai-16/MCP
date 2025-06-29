"""
Enhanced Web Scraper for MCP Discovery
Scrapes various websites and repositories for MCP schemas
"""

import asyncio
import aiohttp
import json
import yaml
import re
import time
import logging
from typing import List, Dict, Any, Optional, Set
from urllib.parse import urljoin, urlparse, quote
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from dataclasses import dataclass
import hashlib

logger = logging.getLogger(__name__)

@dataclass
class ScrapedMCP:
    name: str
    description: str
    source_url: str
    content: str
    file_type: str
    domain: str
    tags: List[str]
    confidence_score: float
    repository: Optional[str] = None
    stars: Optional[int] = None
    last_updated: Optional[str] = None
    author: Optional[str] = None

class MCPWebScraper:
    """Advanced web scraper for discovering MCPs across the internet"""
    
    def __init__(self):
        self.ua = UserAgent()
        self.session_timeout = aiohttp.ClientTimeout(total=30, connect=10)
        self.max_concurrent_requests = 10
        self.request_delay = 1.0  # Delay between requests to be respectful
        
        # Known MCP hosting platforms and their patterns
        self.mcp_sources = {
            'github': {
                'base_urls': [
                    'https://github.com/search?q=mcp+extension%3Ajson&type=code',
                    'https://github.com/search?q=model+context+protocol&type=repositories',
                    'https://github.com/search?q=filename%3A.mcp.json&type=code',
                    'https://github.com/search?q=filename%3A.mcp.yaml&type=code'
                ],
                'selectors': {
                    'results': '.search-result-item, .Box-row',
                    'title': '.search-title a, .f4 a',
                    'description': '.search-result-description, .color-fg-muted',
                    'url': '.search-title a, .f4 a',
                    'metadata': '.text-small'
                }
            },
            'gitlab': {
                'base_urls': [
                    'https://gitlab.com/search?search=mcp.json',
                    'https://gitlab.com/search?search=model+context+protocol'
                ],
                'selectors': {
                    'results': '.search-result',
                    'title': '.search-result-title a',
                    'description': '.search-result-description',
                    'url': '.search-result-title a'
                }
            },
            'huggingface': {
                'base_urls': [
                    'https://huggingface.co/search/full-text?q=mcp',
                    'https://huggingface.co/search/full-text?q=model+context+protocol'
                ],
                'selectors': {
                    'results': '.overview-card-wrapper',
                    'title': '.overview-card-title a',
                    'description': '.overview-card-description',
                    'url': '.overview-card-title a'
                }
            },
            'awesome_lists': {
                'base_urls': [
                    'https://github.com/topics/awesome-mcp',
                    'https://github.com/topics/model-context-protocol',
                    'https://raw.githubusercontent.com/awesome-lists/awesome-mcp/main/README.md'
                ],
                'selectors': {
                    'results': 'li a[href*="github.com"], li a[href*="gitlab.com"]',
                    'title': 'text',
                    'url': 'href'
                }
            }
        }
        
        # File patterns that might contain MCPs
        self.mcp_file_patterns = [
            r'\.mcp\.json$',
            r'\.mcp\.yaml$',
            r'\.mcp\.yml$',
            r'mcp[-_]?schema\.json$',
            r'mcp[-_]?config\.json$',
            r'model[-_]?context[-_]?protocol\.json$',
            r'tools\.json$',
            r'schema\.json$'
        ]
        
        # Content patterns that suggest MCP content
        self.mcp_content_patterns = [
            r'"name"\s*:\s*"[^"]*mcp[^"]*"',
            r'"tools"\s*:\s*\[',
            r'"model[-_]?context[-_]?protocol"',
            r'"version"\s*:\s*"[\d\.]+".*"tools"',
            r'class.*MCP.*Tool',
            r'def.*mcp.*tool'
        ]

    async def search_web_mcps(self, query: str, max_results: int = 50) -> List[ScrapedMCP]:
        """Main entry point for web scraping MCP search"""
        logger.info(f"Starting web scrape search for: {query}")
        
        all_results = []
        
        async with aiohttp.ClientSession(
            timeout=self.session_timeout,
            headers={'User-Agent': self.ua.random}
        ) as session:
            
            # Search across different platforms
            search_tasks = []
            
            # GitHub search
            search_tasks.append(self._search_github(session, query, max_results // 4))
            
            # GitLab search
            search_tasks.append(self._search_gitlab(session, query, max_results // 4))
            
            # Hugging Face search
            search_tasks.append(self._search_huggingface(session, query, max_results // 4))
            
            # Awesome lists and curated sources
            search_tasks.append(self._search_awesome_lists(session, query, max_results // 4))
            
            # General web search for MCP-related content
            search_tasks.append(self._search_general_web(session, query, max_results // 4))
            
            # Execute searches concurrently
            results = await asyncio.gather(*search_tasks, return_exceptions=True)
            
            # Combine results
            for result in results:
                if isinstance(result, list):
                    all_results.extend(result)
                elif isinstance(result, Exception):
                    logger.error(f"Search task failed: {result}")
        
        # Deduplicate and rank results
        unique_results = self._deduplicate_results(all_results)
        ranked_results = self._rank_results(unique_results, query)
        
        logger.info(f"Found {len(ranked_results)} unique MCPs")
        return ranked_results[:max_results]

    async def _search_github(self, session: aiohttp.ClientSession, query: str, limit: int) -> List[ScrapedMCP]:
        """Search GitHub for MCP-related content"""
        results = []
        
        try:
            # Search for files with MCP patterns
            search_urls = [
                f"https://github.com/search?q={quote(query)}+filename%3A.mcp.json&type=code",
                f"https://github.com/search?q={quote(query)}+filename%3A.mcp.yaml&type=code",
                f"https://github.com/search?q={quote(query)}+model+context+protocol&type=code",
                f"https://github.com/search?q={quote(query)}+mcp+tools&type=repositories"
            ]
            
            for search_url in search_urls:
                try:
                    await asyncio.sleep(self.request_delay)
                    
                    async with session.get(search_url) as response:
                        if response.status == 200:
                            html = await response.text()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            # Parse search results
                            search_results = soup.select('.search-result-item, .Box-row')
                            
                            for result_elem in search_results[:limit]:
                                mcp = await self._parse_github_result(session, result_elem, query)
                                if mcp:
                                    results.append(mcp)
                        
                        elif response.status == 429:
                            logger.warning("GitHub rate limit hit, waiting...")
                            await asyncio.sleep(60)
                            
                except Exception as e:
                    logger.error(f"Error searching GitHub URL {search_url}: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"GitHub search failed: {e}")
        
        return results

    async def _parse_github_result(self, session: aiohttp.ClientSession, result_elem, query: str) -> Optional[ScrapedMCP]:
        """Parse a GitHub search result element"""
        try:
            # Extract basic info
            title_elem = result_elem.select_one('.search-title a, .f4 a, .Link--primary')
            if not title_elem:
                return None
                
            title = title_elem.get_text(strip=True)
            url = urljoin('https://github.com', title_elem.get('href', ''))
            
            # Get description
            desc_elem = result_elem.select_one('.search-result-description, .color-fg-muted')
            description = desc_elem.get_text(strip=True) if desc_elem else ""
            
            # Extract repository info
            repo_match = re.search(r'github\.com/([^/]+/[^/]+)', url)
            repository = repo_match.group(1) if repo_match else None
            
            # Try to get the raw file content if it's a direct file link
            if '/blob/' in url:
                raw_url = url.replace('/blob/', '/raw/')
                content = await self._fetch_file_content(session, raw_url)
                
                if content and self._is_valid_mcp_content(content):
                    file_type = 'json' if url.endswith('.json') else 'yaml'
                    
                    # Extract additional metadata
                    domain = self._extract_domain_from_content(content)
                    tags = self._extract_tags_from_content(content, title, description)
                    confidence = self._calculate_confidence_score(content, url, title, description)
                    
                    return ScrapedMCP(
                        name=self._extract_name_from_content(content) or title,
                        description=description or self._extract_description_from_content(content),
                        source_url=url,
                        content=content,
                        file_type=file_type,
                        domain=domain,
                        tags=tags,
                        confidence_score=confidence,
                        repository=repository
                    )
            
            # If not a direct file, try to find MCP files in the repository
            elif repository:
                mcp_files = await self._find_mcp_files_in_repo(session, repository)
                if mcp_files:
                    # Return the first valid MCP found
                    for mcp_file in mcp_files:
                        content = await self._fetch_file_content(session, mcp_file['raw_url'])
                        if content and self._is_valid_mcp_content(content):
                            file_type = 'json' if mcp_file['name'].endswith('.json') else 'yaml'
                            domain = self._extract_domain_from_content(content)
                            tags = self._extract_tags_from_content(content, title, description)
                            confidence = self._calculate_confidence_score(content, url, title, description)
                            
                            return ScrapedMCP(
                                name=self._extract_name_from_content(content) or title,
                                description=description or self._extract_description_from_content(content),
                                source_url=mcp_file['html_url'],
                                content=content,
                                file_type=file_type,
                                domain=domain,
                                tags=tags,
                                confidence_score=confidence,
                                repository=repository
                            )
                            
        except Exception as e:
            logger.error(f"Error parsing GitHub result: {e}")
            
        return None

    async def _find_mcp_files_in_repo(self, session: aiohttp.ClientSession, repository: str) -> List[Dict]:
        """Find MCP files in a GitHub repository"""
        try:
            # Search for common MCP file patterns
            api_url = f"https://api.github.com/search/code?q=repo:{repository}+filename:.mcp"
            
            await asyncio.sleep(self.request_delay)
            
            async with session.get(api_url) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('items', [])
                elif response.status == 403:
                    # API rate limit, try alternative approach
                    return await self._scrape_repo_files(session, repository)
                    
        except Exception as e:
            logger.error(f"Error finding MCP files in repo {repository}: {e}")
            
        return []

    async def _scrape_repo_files(self, session: aiohttp.ClientSession, repository: str) -> List[Dict]:
        """Scrape repository files when API is not available"""
        try:
            repo_url = f"https://github.com/{repository}"
            
            await asyncio.sleep(self.request_delay)
            
            async with session.get(repo_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    files = []
                    # Look for file links that match MCP patterns
                    file_links = soup.select('a[href*="/blob/"]')
                    
                    for link in file_links:
                        href = link.get('href', '')
                        filename = href.split('/')[-1]
                        
                        # Check if filename matches MCP patterns
                        if any(re.search(pattern, filename) for pattern in self.mcp_file_patterns):
                            files.append({
                                'name': filename,
                                'html_url': urljoin('https://github.com', href),
                                'raw_url': urljoin('https://github.com', href.replace('/blob/', '/raw/'))
                            })
                    
                    return files
                    
        except Exception as e:
            logger.error(f"Error scraping repo files for {repository}: {e}")
            
        return []

    async def _search_gitlab(self, session: aiohttp.ClientSession, query: str, limit: int) -> List[ScrapedMCP]:
        """Search GitLab for MCP content"""
        results = []
        
        try:
            search_url = f"https://gitlab.com/search?search={quote(query)}+mcp"
            
            await asyncio.sleep(self.request_delay)
            
            async with session.get(search_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    search_results = soup.select('.search-result')
                    
                    for result_elem in search_results[:limit]:
                        mcp = await self._parse_gitlab_result(session, result_elem, query)
                        if mcp:
                            results.append(mcp)
                            
        except Exception as e:
            logger.error(f"GitLab search failed: {e}")
        
        return results

    async def _parse_gitlab_result(self, session: aiohttp.ClientSession, result_elem, query: str) -> Optional[ScrapedMCP]:
        """Parse GitLab search result"""
        try:
            title_elem = result_elem.select_one('.search-result-title a')
            if not title_elem:
                return None
                
            title = title_elem.get_text(strip=True)
            url = urljoin('https://gitlab.com', title_elem.get('href', ''))
            
            desc_elem = result_elem.select_one('.search-result-description')
            description = desc_elem.get_text(strip=True) if desc_elem else ""
            
            # Try to fetch and validate content
            if '/blob/' in url:
                raw_url = url.replace('/blob/', '/raw/')
                content = await self._fetch_file_content(session, raw_url)
                
                if content and self._is_valid_mcp_content(content):
                    file_type = 'json' if url.endswith('.json') else 'yaml'
                    domain = self._extract_domain_from_content(content)
                    tags = self._extract_tags_from_content(content, title, description)
                    confidence = self._calculate_confidence_score(content, url, title, description)
                    
                    return ScrapedMCP(
                        name=self._extract_name_from_content(content) or title,
                        description=description or self._extract_description_from_content(content),
                        source_url=url,
                        content=content,
                        file_type=file_type,
                        domain=domain,
                        tags=tags,
                        confidence_score=confidence
                    )
                    
        except Exception as e:
            logger.error(f"Error parsing GitLab result: {e}")
            
        return None

    async def _search_huggingface(self, session: aiohttp.ClientSession, query: str, limit: int) -> List[ScrapedMCP]:
        """Search Hugging Face for MCP content"""
        results = []
        
        try:
            search_url = f"https://huggingface.co/search/full-text?q={quote(query)}+mcp"
            
            await asyncio.sleep(self.request_delay)
            
            async with session.get(search_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    search_results = soup.select('.overview-card-wrapper')
                    
                    for result_elem in search_results[:limit]:
                        mcp = await self._parse_huggingface_result(session, result_elem, query)
                        if mcp:
                            results.append(mcp)
                            
        except Exception as e:
            logger.error(f"Hugging Face search failed: {e}")
        
        return results

    async def _parse_huggingface_result(self, session: aiohttp.ClientSession, result_elem, query: str) -> Optional[ScrapedMCP]:
        """Parse Hugging Face search result"""
        try:
            title_elem = result_elem.select_one('.overview-card-title a')
            if not title_elem:
                return None
                
            title = title_elem.get_text(strip=True)
            url = urljoin('https://huggingface.co', title_elem.get('href', ''))
            
            desc_elem = result_elem.select_one('.overview-card-description')
            description = desc_elem.get_text(strip=True) if desc_elem else ""
            
            # Look for MCP files in the repository
            files_url = f"{url}/tree/main"
            
            await asyncio.sleep(self.request_delay)
            
            async with session.get(files_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Look for MCP files
                    file_links = soup.select('a[href*="/blob/"]')
                    
                    for link in file_links:
                        href = link.get('href', '')
                        filename = href.split('/')[-1]
                        
                        if any(re.search(pattern, filename) for pattern in self.mcp_file_patterns):
                            raw_url = urljoin('https://huggingface.co', href.replace('/blob/', '/raw/'))
                            content = await self._fetch_file_content(session, raw_url)
                            
                            if content and self._is_valid_mcp_content(content):
                                file_type = 'json' if filename.endswith('.json') else 'yaml'
                                domain = self._extract_domain_from_content(content)
                                tags = self._extract_tags_from_content(content, title, description)
                                confidence = self._calculate_confidence_score(content, url, title, description)
                                
                                return ScrapedMCP(
                                    name=self._extract_name_from_content(content) or title,
                                    description=description or self._extract_description_from_content(content),
                                    source_url=urljoin('https://huggingface.co', href),
                                    content=content,
                                    file_type=file_type,
                                    domain=domain,
                                    tags=tags,
                                    confidence_score=confidence
                                )
                                
        except Exception as e:
            logger.error(f"Error parsing Hugging Face result: {e}")
            
        return None

    async def _search_awesome_lists(self, session: aiohttp.ClientSession, query: str, limit: int) -> List[ScrapedMCP]:
        """Search awesome lists and curated MCP collections"""
        results = []
        
        awesome_urls = [
            'https://raw.githubusercontent.com/awesome-lists/awesome-mcp/main/README.md',
            'https://raw.githubusercontent.com/modelcontextprotocol/awesome-mcp/main/README.md',
            'https://github.com/topics/mcp',
            'https://github.com/topics/model-context-protocol'
        ]
        
        for url in awesome_urls:
            try:
                await asyncio.sleep(self.request_delay)
                
                async with session.get(url) as response:
                    if response.status == 200:
                        content = await response.text()
                        
                        if url.endswith('.md'):
                            # Parse markdown for links
                            links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)
                            
                            for title, link_url in links:
                                if 'github.com' in link_url or 'gitlab.com' in link_url:
                                    mcp = await self._fetch_and_validate_mcp(session, link_url, title, query)
                                    if mcp:
                                        results.append(mcp)
                                        if len(results) >= limit:
                                            break
                        else:
                            # Parse HTML for repository links
                            soup = BeautifulSoup(content, 'html.parser')
                            repo_links = soup.select('a[href*="github.com"], a[href*="gitlab.com"]')
                            
                            for link in repo_links[:limit]:
                                href = link.get('href', '')
                                title = link.get_text(strip=True)
                                
                                mcp = await self._fetch_and_validate_mcp(session, href, title, query)
                                if mcp:
                                    results.append(mcp)
                                    
            except Exception as e:
                logger.error(f"Error searching awesome list {url}: {e}")
                continue
        
        return results

    async def _search_general_web(self, session: aiohttp.ClientSession, query: str, limit: int) -> List[ScrapedMCP]:
        """General web search for MCP content using search engines"""
        results = []
        
        # Search engines and their query formats
        search_engines = [
            f"https://www.google.com/search?q={quote(query)}+mcp+filetype:json",
            f"https://www.bing.com/search?q={quote(query)}+mcp+filetype:json",
            f"https://duckduckgo.com/?q={quote(query)}+mcp+json"
        ]
        
        for search_url in search_engines:
            try:
                await asyncio.sleep(self.request_delay * 2)  # Be more respectful to search engines
                
                headers = {
                    'User-Agent': self.ua.random,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                }
                
                async with session.get(search_url, headers=headers) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # Extract search result links
                        if 'google.com' in search_url:
                            links = soup.select('a[href*="/url?q="]')
                            for link in links[:limit]:
                                href = link.get('href', '')
                                # Extract actual URL from Google's redirect
                                match = re.search(r'/url\?q=([^&]+)', href)
                                if match:
                                    actual_url = match.group(1)
                                    if any(pattern in actual_url for pattern in ['.json', '.yaml', 'mcp']):
                                        mcp = await self._fetch_and_validate_mcp(session, actual_url, "", query)
                                        if mcp:
                                            results.append(mcp)
                        
                        elif 'bing.com' in search_url:
                            links = soup.select('h2 a')
                            for link in links[:limit]:
                                href = link.get('href', '')
                                if any(pattern in href for pattern in ['.json', '.yaml', 'mcp']):
                                    mcp = await self._fetch_and_validate_mcp(session, href, "", query)
                                    if mcp:
                                        results.append(mcp)
                        
                        elif 'duckduckgo.com' in search_url:
                            links = soup.select('a[href*="http"]')
                            for link in links[:limit]:
                                href = link.get('href', '')
                                if any(pattern in href for pattern in ['.json', '.yaml', 'mcp']):
                                    mcp = await self._fetch_and_validate_mcp(session, href, "", query)
                                    if mcp:
                                        results.append(mcp)
                                        
            except Exception as e:
                logger.error(f"Error in general web search {search_url}: {e}")
                continue
        
        return results

    async def _fetch_and_validate_mcp(self, session: aiohttp.ClientSession, url: str, title: str, query: str) -> Optional[ScrapedMCP]:
        """Fetch content from URL and validate if it's a valid MCP"""
        try:
            content = await self._fetch_file_content(session, url)
            
            if content and self._is_valid_mcp_content(content):
                file_type = 'json' if url.endswith('.json') else 'yaml'
                domain = self._extract_domain_from_content(content)
                tags = self._extract_tags_from_content(content, title, "")
                confidence = self._calculate_confidence_score(content, url, title, "")
                
                return ScrapedMCP(
                    name=self._extract_name_from_content(content) or title or "Unknown MCP",
                    description=self._extract_description_from_content(content) or f"MCP found at {url}",
                    source_url=url,
                    content=content,
                    file_type=file_type,
                    domain=domain,
                    tags=tags,
                    confidence_score=confidence
                )
                
        except Exception as e:
            logger.error(f"Error fetching and validating MCP from {url}: {e}")
            
        return None

    async def _fetch_file_content(self, session: aiohttp.ClientSession, url: str) -> Optional[str]:
        """Fetch file content from URL"""
        try:
            await asyncio.sleep(self.request_delay)
            
            async with session.get(url) as response:
                if response.status == 200:
                    content = await response.text()
                    return content
                    
        except Exception as e:
            logger.error(f"Error fetching content from {url}: {e}")
            
        return None

    def _is_valid_mcp_content(self, content: str) -> bool:
        """Check if content appears to be a valid MCP schema"""
        try:
            # Try to parse as JSON first
            try:
                data = json.loads(content)
            except json.JSONDecodeError:
                # Try YAML
                try:
                    data = yaml.safe_load(content)
                except yaml.YAMLError:
                    return False
            
            # Check for MCP-like structure
            if not isinstance(data, dict):
                return False
            
            # Must have name and tools
            if 'name' not in data or 'tools' not in data:
                return False
            
            # Tools must be a list
            if not isinstance(data['tools'], list):
                return False
            
            # Each tool must have name and description
            for tool in data['tools']:
                if not isinstance(tool, dict):
                    return False
                if 'name' not in tool or 'description' not in tool:
                    return False
            
            return True
            
        except Exception:
            return False

    def _extract_name_from_content(self, content: str) -> Optional[str]:
        """Extract MCP name from content"""
        try:
            try:
                data = json.loads(content)
            except json.JSONDecodeError:
                data = yaml.safe_load(content)
            
            return data.get('name')
            
        except Exception:
            return None

    def _extract_description_from_content(self, content: str) -> Optional[str]:
        """Extract MCP description from content"""
        try:
            try:
                data = json.loads(content)
            except json.JSONDecodeError:
                data = yaml.safe_load(content)
            
            return data.get('description')
            
        except Exception:
            return None

    def _extract_domain_from_content(self, content: str) -> str:
        """Extract domain/category from MCP content"""
        try:
            try:
                data = json.loads(content)
            except json.JSONDecodeError:
                data = yaml.safe_load(content)
            
            # Check for explicit domain
            if 'domain' in data:
                return data['domain']
            
            # Infer from name or description
            text = f"{data.get('name', '')} {data.get('description', '')}".lower()
            
            domain_keywords = {
                'weather': ['weather', 'climate', 'forecast', 'temperature'],
                'finance': ['finance', 'trading', 'stock', 'crypto', 'payment'],
                'travel': ['travel', 'booking', 'hotel', 'flight', 'airbnb'],
                'productivity': ['calendar', 'task', 'note', 'email', 'schedule'],
                'development': ['code', 'git', 'github', 'deploy', 'api'],
                'social': ['social', 'twitter', 'facebook', 'instagram', 'post'],
                'ecommerce': ['shop', 'store', 'product', 'cart', 'order'],
                'data': ['data', 'analytics', 'database', 'query', 'search'],
                'ai': ['ai', 'ml', 'llm', 'gpt', 'model'],
                'communication': ['chat', 'message', 'slack', 'discord', 'teams']
            }
            
            for domain, keywords in domain_keywords.items():
                if any(keyword in text for keyword in keywords):
                    return domain
            
            return 'general'
            
        except Exception:
            return 'general'

    def _extract_tags_from_content(self, content: str, title: str, description: str) -> List[str]:
        """Extract tags from MCP content and metadata"""
        tags = set()
        
        try:
            # Parse content
            try:
                data = json.loads(content)
            except json.JSONDecodeError:
                data = yaml.safe_load(content)
            
            # Add explicit tags if present
            if 'tags' in data:
                tags.update(data['tags'])
            
            # Extract from tool names
            for tool in data.get('tools', []):
                tool_name = tool.get('name', '').lower()
                tags.add(tool_name.split('_')[0])  # First part of tool name
            
            # Extract from text content
            text = f"{title} {description} {data.get('name', '')} {data.get('description', '')}".lower()
            
            # Common MCP-related tags
            tag_patterns = {
                'api': ['api', 'rest', 'endpoint'],
                'web': ['web', 'http', 'url', 'browser'],
                'database': ['db', 'database', 'sql'],
                'cloud': ['aws', 'azure', 'gcp', 'cloud'],
                'automation': ['auto', 'script', 'workflow'],
                'integration': ['integrate', 'connect', 'sync'],
                'realtime': ['realtime', 'live', 'stream'],
                'security': ['auth', 'security', 'encrypt'],
                'monitoring': ['monitor', 'log', 'metric']
            }
            
            for tag, patterns in tag_patterns.items():
                if any(pattern in text for pattern in patterns):
                    tags.add(tag)
            
        except Exception:
            pass
        
        return list(tags)

    def _calculate_confidence_score(self, content: str, url: str, title: str, description: str) -> float:
        """Calculate confidence score for MCP result"""
        score = 0.5  # Base score
        
        try:
            # Parse content for quality assessment
            try:
                data = json.loads(content)
            except json.JSONDecodeError:
                data = yaml.safe_load(content)
            
            # Schema completeness
            if data.get('description'):
                score += 0.1
            if data.get('version'):
                score += 0.1
            if len(data.get('tools', [])) > 1:
                score += 0.1
            
            # Tool quality
            for tool in data.get('tools', []):
                if tool.get('parameters'):
                    score += 0.05
                if len(tool.get('description', '')) > 20:
                    score += 0.05
            
            # URL quality
            if 'github.com' in url:
                score += 0.1
            if '.mcp.' in url:
                score += 0.1
            
            # Title/description quality
            if 'mcp' in title.lower() or 'model context protocol' in title.lower():
                score += 0.1
            
        except Exception:
            pass
        
        return min(score, 1.0)

    def _deduplicate_results(self, results: List[ScrapedMCP]) -> List[ScrapedMCP]:
        """Remove duplicate results based on content hash"""
        seen_hashes = set()
        unique_results = []
        
        for result in results:
            # Create hash from content and URL
            content_hash = hashlib.md5(f"{result.content}{result.source_url}".encode()).hexdigest()
            
            if content_hash not in seen_hashes:
                seen_hashes.add(content_hash)
                unique_results.append(result)
        
        return unique_results

    def _rank_results(self, results: List[ScrapedMCP], query: str) -> List[ScrapedMCP]:
        """Rank results by relevance and quality"""
        query_lower = query.lower()
        
        def relevance_score(result: ScrapedMCP) -> float:
            score = result.confidence_score
            
            # Boost if query terms appear in name/description
            if query_lower in result.name.lower():
                score += 0.2
            if query_lower in result.description.lower():
                score += 0.1
            
            # Boost for certain domains
            if result.domain in ['ai', 'development', 'productivity']:
                score += 0.05
            
            return score
        
        return sorted(results, key=relevance_score, reverse=True)