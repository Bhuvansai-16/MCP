from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import asyncio
import aiohttp
import json
import yaml
import re
import time
import logging
from datetime import datetime
import sqlite3
import os
from urllib.parse import urljoin, urlparse, quote
from bs4 import BeautifulSoup
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
DATABASE_PATH = "mcp_playground.db"

def init_db():
    """Initialize SQLite database"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # MCPs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mcps (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            schema_content TEXT NOT NULL,
            tags TEXT,
            domain TEXT,
            validated BOOLEAN DEFAULT FALSE,
            popularity INTEGER DEFAULT 0,
            source_url TEXT,
            source_platform TEXT DEFAULT 'local',
            confidence_score REAL DEFAULT 0.0,
            file_type TEXT DEFAULT 'json',
            repository TEXT,
            stars INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Web search cache
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS search_cache (
            id TEXT PRIMARY KEY,
            query TEXT NOT NULL,
            results TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP DEFAULT (datetime('now', '+1 hour'))
        )
    ''')
    
    conn.commit()
    conn.close()

# FastAPI app
app = FastAPI(
    title="MCP.playground API",
    description="Backend API for Model Context Protocol testing with web scraping",
    version="3.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class WebMCPResult(BaseModel):
    name: str
    description: str
    source_url: str
    tags: List[str]
    domain: str
    validated: bool
    schema: Optional[Dict[str, Any]] = None
    file_type: str
    repository: Optional[str] = None
    stars: Optional[int] = None
    source_platform: str
    confidence_score: float

class MCPListItem(BaseModel):
    id: str
    name: str
    description: str
    tags: List[str]
    domain: str
    validated: bool
    popularity: int
    source_url: Optional[str] = None
    source_platform: str
    confidence_score: float
    file_type: str
    repository: Optional[str] = None
    stars: int
    created_at: str

# Web scraper class
class MCPWebScraper:
    def __init__(self):
        self.session_timeout = aiohttp.ClientTimeout(total=30, connect=10)
        self.max_concurrent_requests = 5
        self.request_delay = 1.0
        
        # Known MCP file patterns
        self.mcp_file_patterns = [
            r'\.mcp\.json$',
            r'\.mcp\.yaml$',
            r'\.mcp\.yml$',
            r'mcp[-_]?schema\.json$',
            r'mcp[-_]?config\.json$',
            r'tools\.json$',
            r'schema\.json$'
        ]
        
        # Content patterns that suggest MCP content
        self.mcp_content_patterns = [
            r'"name"\s*:\s*"[^"]*"',
            r'"tools"\s*:\s*\[',
            r'"version"\s*:\s*"[\d\.]+"',
            r'class.*MCP.*Tool',
            r'def.*mcp.*tool'
        ]

    async def search_web_mcps(self, query: str, limit: int = 20) -> List[WebMCPResult]:
        """Main web scraping search function"""
        logger.info(f"Starting web scrape search for: {query}")
        
        results = []
        
        async with aiohttp.ClientSession(
            timeout=self.session_timeout,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        ) as session:
            
            # Search GitHub
            github_results = await self._search_github(session, query, limit // 3)
            results.extend(github_results)
            
            # Search general web
            web_results = await self._search_general_web(session, query, limit // 3)
            results.extend(web_results)
            
            # Search awesome lists
            awesome_results = await self._search_awesome_lists(session, query, limit // 3)
            results.extend(awesome_results)
        
        # Deduplicate and rank results
        unique_results = self._deduplicate_results(results)
        ranked_results = self._rank_results(unique_results, query)
        
        logger.info(f"Found {len(ranked_results)} unique MCPs")
        return ranked_results[:limit]

    async def _search_github(self, session: aiohttp.ClientSession, query: str, limit: int) -> List[WebMCPResult]:
        """Search GitHub for MCP content"""
        results = []
        
        try:
            # GitHub search URLs
            search_urls = [
                f"https://github.com/search?q={quote(query)}+filename%3A.mcp.json&type=code",
                f"https://github.com/search?q={quote(query)}+filename%3A.mcp.yaml&type=code",
                f"https://github.com/search?q={quote(query)}+model+context+protocol&type=repositories"
            ]
            
            for search_url in search_urls[:2]:  # Limit to avoid rate limits
                try:
                    await asyncio.sleep(self.request_delay)
                    
                    async with session.get(search_url) as response:
                        if response.status == 200:
                            html = await response.text()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            # Parse GitHub search results
                            search_results = soup.select('.search-result-item, .Box-row')
                            
                            for result_elem in search_results[:limit]:
                                mcp = await self._parse_github_result(session, result_elem, query)
                                if mcp:
                                    results.append(mcp)
                        
                        elif response.status == 429:
                            logger.warning("GitHub rate limit hit")
                            break
                            
                except Exception as e:
                    logger.error(f"Error searching GitHub: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"GitHub search failed: {e}")
        
        return results

    async def _parse_github_result(self, session: aiohttp.ClientSession, result_elem, query: str) -> Optional[WebMCPResult]:
        """Parse a GitHub search result"""
        try:
            # Extract basic info from search result
            title_elem = result_elem.select_one('a[href*="/blob/"]')
            if not title_elem:
                return None
                
            href = title_elem.get('href', '')
            if not href:
                return None
                
            url = urljoin('https://github.com', href)
            
            # Extract repository info
            repo_match = re.search(r'github\.com/([^/]+/[^/]+)', url)
            repository = repo_match.group(1) if repo_match else None
            
            # Get raw file URL
            raw_url = url.replace('/blob/', '/raw/')
            
            # Fetch file content
            content = await self._fetch_file_content(session, raw_url)
            if not content or not self._is_valid_mcp_content(content):
                return None
            
            # Extract metadata
            name = self._extract_name_from_content(content) or f"mcp-{repository.split('/')[-1] if repository else 'unknown'}"
            description = self._extract_description_from_content(content) or f"MCP from {repository}"
            domain = self._extract_domain_from_content(content)
            tags = self._extract_tags_from_content(content, name, description)
            confidence = self._calculate_confidence_score(content, url, name, description)
            
            # Parse schema
            schema = None
            file_type = 'json' if url.endswith('.json') else 'yaml'
            try:
                if file_type == 'json':
                    schema = json.loads(content)
                else:
                    schema = yaml.safe_load(content)
            except:
                pass
            
            return WebMCPResult(
                name=name,
                description=description,
                source_url=url,
                tags=tags,
                domain=domain,
                validated=schema is not None,
                schema=schema,
                file_type=file_type,
                repository=repository,
                stars=None,  # Would need GitHub API for this
                source_platform="github",
                confidence_score=confidence
            )
            
        except Exception as e:
            logger.error(f"Error parsing GitHub result: {e}")
            return None

    async def _search_general_web(self, session: aiohttp.ClientSession, query: str, limit: int) -> List[WebMCPResult]:
        """Search general web for MCP content"""
        results = []
        
        try:
            # Use DuckDuckGo as it's more scraping-friendly
            search_url = f"https://duckduckgo.com/html/?q={quote(query)}+mcp+json+filetype%3Ajson"
            
            await asyncio.sleep(self.request_delay)
            
            async with session.get(search_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Extract search result links
                    links = soup.select('a[href*="http"]')
                    
                    for link in links[:limit]:
                        href = link.get('href', '')
                        if any(pattern in href for pattern in ['.json', '.yaml', 'mcp']):
                            mcp = await self._fetch_and_validate_mcp(session, href, "", query)
                            if mcp:
                                results.append(mcp)
                                
        except Exception as e:
            logger.error(f"General web search failed: {e}")
        
        return results

    async def _search_awesome_lists(self, session: aiohttp.ClientSession, query: str, limit: int) -> List[WebMCPResult]:
        """Search awesome lists for MCP content"""
        results = []
        
        awesome_urls = [
            'https://raw.githubusercontent.com/modelcontextprotocol/servers/main/README.md',
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
                                if 'github.com' in link_url:
                                    mcp = await self._fetch_and_validate_mcp(session, link_url, title, query)
                                    if mcp:
                                        results.append(mcp)
                                        if len(results) >= limit:
                                            break
                        else:
                            # Parse HTML for repository links
                            soup = BeautifulSoup(content, 'html.parser')
                            repo_links = soup.select('a[href*="github.com"]')
                            
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

    async def _fetch_and_validate_mcp(self, session: aiohttp.ClientSession, url: str, title: str, query: str) -> Optional[WebMCPResult]:
        """Fetch content from URL and validate if it's a valid MCP"""
        try:
            content = await self._fetch_file_content(session, url)
            
            if content and self._is_valid_mcp_content(content):
                file_type = 'json' if url.endswith('.json') else 'yaml'
                domain = self._extract_domain_from_content(content)
                tags = self._extract_tags_from_content(content, title, "")
                confidence = self._calculate_confidence_score(content, url, title, "")
                
                # Parse schema
                schema = None
                try:
                    if file_type == 'json':
                        schema = json.loads(content)
                    else:
                        schema = yaml.safe_load(content)
                except:
                    pass
                
                return WebMCPResult(
                    name=self._extract_name_from_content(content) or title or "Unknown MCP",
                    description=self._extract_description_from_content(content) or f"MCP found at {url}",
                    source_url=url,
                    tags=tags,
                    domain=domain,
                    validated=schema is not None,
                    schema=schema,
                    file_type=file_type,
                    repository=None,
                    stars=None,
                    source_platform="web",
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

    def _deduplicate_results(self, results: List[WebMCPResult]) -> List[WebMCPResult]:
        """Remove duplicate results based on content hash"""
        seen_hashes = set()
        unique_results = []
        
        for result in results:
            # Create hash from content and URL
            content_hash = hashlib.md5(f"{result.name}{result.source_url}".encode()).hexdigest()
            
            if content_hash not in seen_hashes:
                seen_hashes.add(content_hash)
                unique_results.append(result)
        
        return unique_results

    def _rank_results(self, results: List[WebMCPResult], query: str) -> List[WebMCPResult]:
        """Rank results by relevance and quality"""
        query_lower = query.lower()
        
        def relevance_score(result: WebMCPResult) -> float:
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

# Initialize scraper
web_scraper = MCPWebScraper()

# Sample MCPs for local library
SAMPLE_MCPS = [
    {
        "id": "weather-001",
        "name": "weather-forecast",
        "description": "Real-time weather data and forecasting with global coverage",
        "schema_content": json.dumps({
            "name": "weather-forecast",
            "version": "1.0.0",
            "description": "Real-time weather data and forecasting",
            "tools": [
                {
                    "name": "get_current_weather",
                    "description": "Get current weather for a location",
                    "parameters": {
                        "location": "string",
                        "units": "string"
                    }
                }
            ]
        }),
        "tags": json.dumps(["weather", "forecast", "api"]),
        "domain": "weather",
        "validated": True,
        "popularity": 95,
        "source_url": "https://github.com/modelcontextprotocol/servers/tree/main/src/weather",
        "source_platform": "github",
        "confidence_score": 0.95,
        "file_type": "typescript",
        "repository": "modelcontextprotocol/servers",
        "stars": 1250
    },
    {
        "id": "filesystem-002",
        "name": "filesystem-operations",
        "description": "Secure file system operations with read/write capabilities",
        "schema_content": json.dumps({
            "name": "filesystem-operations",
            "version": "1.0.0",
            "description": "File system operations",
            "tools": [
                {
                    "name": "read_file",
                    "description": "Read file contents",
                    "parameters": {
                        "path": "string"
                    }
                },
                {
                    "name": "write_file",
                    "description": "Write file contents",
                    "parameters": {
                        "path": "string",
                        "content": "string"
                    }
                }
            ]
        }),
        "tags": json.dumps(["filesystem", "files", "io"]),
        "domain": "development",
        "validated": True,
        "popularity": 88,
        "source_url": "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
        "source_platform": "github",
        "confidence_score": 0.92,
        "file_type": "typescript",
        "repository": "modelcontextprotocol/servers",
        "stars": 1250
    }
]

def populate_sample_data():
    """Populate database with sample MCP data"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    for mcp in SAMPLE_MCPS:
        cursor.execute('''
            INSERT OR REPLACE INTO mcps (id, name, description, schema_content, tags, domain, validated, popularity, source_url, source_platform, confidence_score, file_type, repository, stars)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            mcp["id"],
            mcp["name"],
            mcp["description"],
            mcp["schema_content"],
            mcp["tags"],
            mcp["domain"],
            mcp["validated"],
            mcp["popularity"],
            mcp["source_url"],
            mcp["source_platform"],
            mcp["confidence_score"],
            mcp["file_type"],
            mcp["repository"],
            mcp["stars"]
        ))
    
    conn.commit()
    conn.close()

# API Endpoints
@app.on_event("startup")
async def startup_event():
    init_db()
    populate_sample_data()
    logger.info("MCP Playground API started with web scraping capabilities")

@app.get("/")
async def root():
    return {
        "message": "MCP.playground API with Web Scraping",
        "version": "3.0.0",
        "features": [
            "Web scraping with BeautifulSoup4",
            "GitHub MCP discovery",
            "Real-time web content extraction",
            "MCP validation and confidence scoring"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected" if os.path.exists(DATABASE_PATH) else "disconnected",
        "scraping_enabled": True,
        "supported_platforms": ["GitHub", "General Web", "Awesome Lists"],
        "version": "3.0.0",
        "features": [
            "web_scraping",
            "mcp_validation",
            "confidence_scoring",
            "beautifulsoup4_integration"
        ]
    }

@app.get("/mcps", response_model=List[MCPListItem])
async def get_mcps(
    domain: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    validated: Optional[bool] = Query(None),
    sort_by: str = Query("popularity"),
    limit: int = Query(50, ge=1, le=100)
):
    """Get local MCPs with filtering"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    query = "SELECT * FROM mcps WHERE 1=1"
    params = []
    
    if domain and domain != 'all':
        query += " AND domain = ?"
        params.append(domain)
    
    if validated is not None:
        query += " AND validated = ?"
        params.append(validated)
    
    if tags:
        query += " AND tags LIKE ?"
        params.append(f"%{tags}%")
    
    # Add sorting
    if sort_by == "name":
        query += " ORDER BY name"
    elif sort_by == "created_at":
        query += " ORDER BY created_at DESC"
    elif sort_by == "confidence_score":
        query += " ORDER BY confidence_score DESC"
    else:
        query += " ORDER BY popularity DESC"
    
    query += f" LIMIT {limit}"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    mcps = []
    for row in rows:
        mcps.append(MCPListItem(
            id=row[0],
            name=row[1],
            description=row[2] or "",
            tags=json.loads(row[4]) if row[4] else [],
            domain=row[5] or "general",
            validated=bool(row[6]),
            popularity=row[7] or 0,
            source_url=row[8],
            source_platform=row[9] or "local",
            confidence_score=row[10] or 0.0,
            file_type=row[11] or "json",
            repository=row[12],
            stars=row[13] or 0,
            created_at=row[14] or datetime.now().isoformat()
        ))
    
    return mcps

@app.get("/mcps/search", response_model=List[WebMCPResult])
async def search_web_mcps(
    query: str = Query(..., description="Search query for MCPs"),
    limit: int = Query(20, ge=1, le=100),
    sources: str = Query("github,web,awesome", description="Comma-separated list of sources"),
    min_confidence: float = Query(0.0, ge=0.0, le=1.0),
    use_scraping: bool = Query(True, description="Enable web scraping")
):
    """Enhanced web search for MCPs with real scraping"""
    try:
        start_time = time.time()
        
        # Check cache first
        cache_key = f"search:{query}:{limit}:{sources}:{min_confidence}"
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT results FROM search_cache WHERE query = ? AND expires_at > datetime('now')",
            (cache_key,)
        )
        cached_result = cursor.fetchone()
        
        if cached_result:
            conn.close()
            cached_data = json.loads(cached_result[0])
            logger.info(f"Returning cached results for query: {query}")
            return [WebMCPResult(**item) for item in cached_data[:limit]]
        
        # Perform web scraping search
        if use_scraping:
            logger.info(f"Starting web scraping search for: {query}")
            results = await web_scraper.search_web_mcps(query, limit)
        else:
            logger.info(f"Scraping disabled, returning empty results")
            results = []
        
        # Filter by confidence score
        filtered_results = [r for r in results if r.confidence_score >= min_confidence]
        
        # Cache results
        cache_id = f"cache_{int(time.time())}"
        search_duration = int((time.time() - start_time) * 1000)
        
        cursor.execute(
            "INSERT INTO search_cache (id, query, results, created_at, expires_at) VALUES (?, ?, ?, datetime('now'), datetime('now', '+1 hour'))",
            (cache_id, cache_key, json.dumps([r.dict() for r in filtered_results]))
        )
        
        conn.commit()
        conn.close()
        
        logger.info(f"Web scraping search completed for '{query}': {len(filtered_results)} results in {search_duration}ms")
        return filtered_results
        
    except Exception as e:
        logger.error(f"Web search failed for query '{query}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Web search failed: {str(e)}")

@app.post("/mcps/search/enhanced", response_model=List[WebMCPResult])
async def enhanced_search_mcps(request: dict):
    """Advanced MCP search with detailed options"""
    try:
        query = request.get("query", "")
        limit = request.get("limit", 20)
        use_web_scraping = request.get("use_web_scraping", True)
        min_confidence = request.get("min_confidence", 0.0)
        
        if use_web_scraping:
            results = await web_scraper.search_web_mcps(query, limit)
        else:
            results = []
        
        # Apply confidence filter
        filtered_results = [r for r in results if r.confidence_score >= min_confidence]
        
        return filtered_results
        
    except Exception as e:
        logger.error(f"Enhanced search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Enhanced search failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)