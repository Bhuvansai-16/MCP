import asyncio
import json
import yaml
import time
import uuid
import aiohttp
import urllib.parse
import logging
import hashlib
import re
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
from dataclasses import dataclass
from jsonschema import validate, ValidationError
from ratelimit import limits, sleep_and_retry
import redis
from bs4 import BeautifulSoup

# Import our new web scraper
from web_scraper import MCPWebScraper, ScrapedMCP

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MCPSearchResult:
    name: str
    description: str
    source_url: str
    tags: List[str]
    domain: str
    validated: bool
    schema: Optional[Dict[str, Any]] = None
    file_type: str = "unknown"
    repository: Optional[str] = None
    stars: Optional[int] = None
    source_platform: str = "unknown"
    confidence_score: float = 0.0

class RateLimitedSession:
    """Rate-limited HTTP session for external API calls"""
    
    def __init__(self, calls_per_minute: int = 30):
        self.calls_per_minute = calls_per_minute
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    @sleep_and_retry
    @limits(calls=30, period=60)  # 30 calls per minute
    async def get(self, url: str, **kwargs):
        """Rate-limited GET request"""
        if not self.session:
            raise RuntimeError("Session not initialized")
        return await self.session.get(url, **kwargs)

class MCPSchemaValidator:
    """Validates MCP schemas against a predefined standard"""
    
    # Define the MCP schema standard
    MCP_SCHEMA = {
        "type": "object",
        "required": ["name", "version", "tools"],
        "properties": {
            "name": {
                "type": "string",
                "pattern": "^[a-zA-Z0-9._-]+$",
                "minLength": 1
            },
            "version": {
                "type": "string",
                "pattern": "^\\d+\\.\\d+\\.\\d+$"
            },
            "description": {
                "type": "string"
            },
            "tools": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "required": ["name", "description", "parameters"],
                    "properties": {
                        "name": {
                            "type": "string",
                            "pattern": "^[a-zA-Z0-9._-]+$"
                        },
                        "description": {
                            "type": "string",
                            "minLength": 10
                        },
                        "parameters": {
                            "type": "object"
                        }
                    }
                }
            }
        }
    }
    
    @classmethod
    def validate_schema(cls, schema: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """Validate MCP schema and return (is_valid, error_message)"""
        try:
            validate(instance=schema, schema=cls.MCP_SCHEMA)
            
            # Additional custom validations
            if not cls._validate_tools(schema.get('tools', [])):
                return False, "Invalid tool definitions"
                
            return True, None
            
        except ValidationError as e:
            return False, f"Schema validation error: {e.message}"
        except Exception as e:
            return False, f"Validation error: {str(e)}"
    
    @classmethod
    def _validate_tools(cls, tools: List[Dict]) -> bool:
        """Additional tool validation logic"""
        for tool in tools:
            # Check for reasonable parameter types
            params = tool.get('parameters', {})
            if not isinstance(params, dict):
                return False
                
            # Validate parameter types
            for param_name, param_type in params.items():
                if not isinstance(param_name, str) or not param_name:
                    return False
                    
        return True

class EnhancedMCPExplorer:
    """Enhanced MCP Explorer with web scraping and multiple search sources"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.github_api_base = "https://api.github.com"
        self.huggingface_api_base = "https://huggingface.co/api"
        self.validator = MCPSchemaValidator()
        self.web_scraper = MCPWebScraper()
        
        # Initialize Redis for caching
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            self.redis_client.ping()
            self.cache_enabled = True
            logger.info("Redis cache enabled")
        except Exception as e:
            logger.warning(f"Redis not available, using in-memory cache: {e}")
            self.cache_enabled = False
            self.memory_cache = {}
        
        # Known MCP repositories and registries
        self.known_sources = [
            {
                "name": "OpenAI MCP Examples",
                "url": "https://github.com/openai/mcp-examples",
                "type": "github_repo"
            },
            {
                "name": "Anthropic MCP Collection",
                "url": "https://github.com/anthropics/mcp-collection", 
                "type": "github_repo"
            },
            {
                "name": "Community MCP Hub",
                "url": "https://github.com/mcp-hub/community",
                "type": "github_repo"
            }
        ]

    async def search_web_mcps(self, query: str, limit: int = 20) -> List[MCPSearchResult]:
        """Enhanced web search using BeautifulSoup4 scraping"""
        cache_key = f"mcp_search:{hashlib.md5(f'{query}:{limit}'.encode()).hexdigest()}"
        
        # Check cache first
        cached_results = await self._get_cached_results(cache_key)
        if cached_results:
            logger.info(f"Returning cached results for query: {query}")
            return cached_results
        
        results = []
        
        try:
            logger.info(f"Starting web scraping search for: {query}")
            
            # Use our enhanced web scraper
            scraped_mcps = await self.web_scraper.search_web_mcps(query, limit)
            
            # Convert scraped results to our format
            for scraped_mcp in scraped_mcps:
                # Validate the scraped content
                try:
                    if scraped_mcp.file_type == 'json':
                        schema = json.loads(scraped_mcp.content)
                    else:
                        schema = yaml.safe_load(scraped_mcp.content)
                    
                    is_valid, error_msg = self.validator.validate_schema(schema)
                    
                    result = MCPSearchResult(
                        name=scraped_mcp.name,
                        description=scraped_mcp.description,
                        source_url=scraped_mcp.source_url,
                        tags=scraped_mcp.tags,
                        domain=scraped_mcp.domain,
                        validated=is_valid,
                        schema=schema if is_valid else None,
                        file_type=scraped_mcp.file_type,
                        repository=scraped_mcp.repository,
                        stars=scraped_mcp.stars,
                        source_platform="web_scraping",
                        confidence_score=scraped_mcp.confidence_score
                    )
                    
                    results.append(result)
                    
                except Exception as e:
                    logger.warning(f"Failed to validate scraped MCP {scraped_mcp.name}: {e}")
                    # Still include it but mark as unvalidated
                    result = MCPSearchResult(
                        name=scraped_mcp.name,
                        description=scraped_mcp.description,
                        source_url=scraped_mcp.source_url,
                        tags=scraped_mcp.tags,
                        domain=scraped_mcp.domain,
                        validated=False,
                        schema=None,
                        file_type=scraped_mcp.file_type,
                        repository=scraped_mcp.repository,
                        stars=scraped_mcp.stars,
                        source_platform="web_scraping",
                        confidence_score=scraped_mcp.confidence_score * 0.5  # Reduce confidence for unvalidated
                    )
                    results.append(result)
            
            # Also search using API methods as fallback
            api_results = await self._search_api_sources(query, limit // 2)
            results.extend(api_results)
            
            # Remove duplicates and sort by confidence
            unique_results = self._deduplicate_results(results)
            sorted_results = sorted(unique_results, key=lambda x: x.confidence_score, reverse=True)
            
            # Limit results
            final_results = sorted_results[:limit]
            
            # Cache results
            await self._cache_results(cache_key, final_results)
            
            logger.info(f"Found {len(final_results)} MCPs for query: {query}")
            return final_results
            
        except Exception as e:
            logger.error(f"Web search failed for query '{query}': {e}")
            return []

    async def _search_api_sources(self, query: str, limit: int) -> List[MCPSearchResult]:
        """Search using API methods as fallback"""
        results = []
        
        try:
            # Search across different sources in parallel
            search_tasks = [
                self._search_github_enhanced(query, limit // 3),
                self._search_huggingface(query, limit // 3),
                self._search_known_repositories(query, limit // 3)
            ]
            
            search_results = await asyncio.gather(*search_tasks, return_exceptions=True)
            
            # Combine results from all sources
            for result in search_results:
                if isinstance(result, list):
                    results.extend(result)
                elif isinstance(result, Exception):
                    logger.error(f"API search error: {result}")
            
        except Exception as e:
            logger.error(f"API search failed: {e}")
        
        return results

    async def _search_github_enhanced(self, query: str, limit: int) -> List[MCPSearchResult]:
        """Enhanced GitHub search with better API usage"""
        results = []
        
        try:
            async with RateLimitedSession() as session:
                # Multiple search strategies
                search_queries = [
                    f"{query} filename:.mcp.json",
                    f"{query} filename:.mcp.yaml", 
                    f"{query} filename:mcp.json",
                    f"model context protocol {query}",
                    f"mcp {query} extension:json",
                    f"mcp {query} extension:yaml"
                ]
                
                for search_query in search_queries[:3]:  # Limit to avoid rate limits
                    try:
                        encoded_query = urllib.parse.quote(search_query)
                        url = f"{self.github_api_base}/search/code?q={encoded_query}&sort=stars&order=desc&per_page={limit}"
                        
                        async with session.get(url) as response:
                            if response.status == 200:
                                data = await response.json()
                                
                                for item in data.get('items', [])[:limit]:
                                    mcp_result = await self._process_github_file_enhanced(session, item)
                                    if mcp_result:
                                        results.append(mcp_result)
                            elif response.status == 403:
                                logger.warning("GitHub API rate limit exceeded")
                                break
                            else:
                                logger.warning(f"GitHub search failed with status {response.status}")
                        
                        # Respect rate limits
                        await asyncio.sleep(1)
                        
                    except Exception as e:
                        logger.error(f"GitHub search error for query '{search_query}': {e}")
                        continue
                        
        except Exception as e:
            logger.error(f"GitHub search error: {e}")
        
        return results

    async def _process_github_file_enhanced(self, session: RateLimitedSession, item: Dict) -> Optional[MCPSearchResult]:
        """Enhanced GitHub file processing with better validation"""
        try:
            download_url = item.get('download_url')
            if not download_url:
                return None
            
            async with session.get(download_url) as response:
                if response.status != 200:
                    return None
                
                content = await response.text()
                
                # Parse content based on file type
                schema = None
                file_type = "unknown"
                
                if item['name'].endswith('.json'):
                    try:
                        schema = json.loads(content)
                        file_type = "json"
                    except json.JSONDecodeError as e:
                        logger.warning(f"Invalid JSON in {item['name']}: {e}")
                        return None
                elif item['name'].endswith(('.yaml', '.yml')):
                    try:
                        schema = yaml.safe_load(content)
                        file_type = "yaml"
                    except yaml.YAMLError as e:
                        logger.warning(f"Invalid YAML in {item['name']}: {e}")
                        return None
                
                if not schema:
                    return None
                
                # Enhanced validation
                is_valid, error_msg = self.validator.validate_schema(schema)
                if not is_valid:
                    logger.warning(f"Invalid MCP schema in {item['name']}: {error_msg}")
                    return None
                
                # Extract metadata
                name = schema.get('name', item['name'].replace('.json', '').replace('.yaml', '').replace('.yml', ''))
                description = schema.get('description', f"MCP from {item['repository']['full_name']}")
                
                # Calculate confidence score
                confidence_score = self._calculate_confidence_score(schema, item)
                
                # Determine domain and tags
                domain = self._extract_domain(name, description)
                tags = self._extract_tags(name, description, schema)
                
                return MCPSearchResult(
                    name=name,
                    description=description,
                    source_url=item['html_url'],
                    tags=tags,
                    domain=domain,
                    validated=True,
                    schema=schema,
                    file_type=file_type,
                    repository=item['repository']['full_name'],
                    stars=item['repository'].get('stargazers_count', 0),
                    source_platform="github",
                    confidence_score=confidence_score
                )
                
        except Exception as e:
            logger.error(f"Error processing GitHub file {item.get('name', 'unknown')}: {e}")
            return None

    async def _search_huggingface(self, query: str, limit: int) -> List[MCPSearchResult]:
        """Search Hugging Face Hub for MCP-related content"""
        results = []
        
        try:
            async with RateLimitedSession() as session:
                # Search for datasets and models that might contain MCPs
                search_urls = [
                    f"https://huggingface.co/api/datasets?search={urllib.parse.quote(query + ' mcp')}&limit={limit}",
                    f"https://huggingface.co/api/models?search={urllib.parse.quote(query + ' context protocol')}&limit={limit}"
                ]
                
                for url in search_urls:
                    try:
                        async with session.get(url) as response:
                            if response.status == 200:
                                data = await response.json()
                                
                                for item in data[:limit//2]:
                                    mcp_result = await self._process_huggingface_item(session, item)
                                    if mcp_result:
                                        results.append(mcp_result)
                        
                        await asyncio.sleep(0.5)  # Rate limiting
                        
                    except Exception as e:
                        logger.error(f"Hugging Face search error: {e}")
                        continue
                        
        except Exception as e:
            logger.error(f"Hugging Face search error: {e}")
        
        return results

    async def _process_huggingface_item(self, session: RateLimitedSession, item: Dict) -> Optional[MCPSearchResult]:
        """Process Hugging Face items for MCP content"""
        try:
            # Look for MCP files in the repository
            repo_id = item.get('id')
            if not repo_id:
                return None
            
            # Check for common MCP file names
            mcp_files = ['mcp.json', 'mcp.yaml', 'schema.json', 'tools.json']
            
            for filename in mcp_files:
                try:
                    file_url = f"https://huggingface.co/{repo_id}/raw/main/{filename}"
                    async with session.get(file_url) as response:
                        if response.status == 200:
                            content = await response.text()
                            
                            # Try to parse as JSON or YAML
                            schema = None
                            if filename.endswith('.json'):
                                try:
                                    schema = json.loads(content)
                                except json.JSONDecodeError:
                                    continue
                            elif filename.endswith(('.yaml', '.yml')):
                                try:
                                    schema = yaml.safe_load(content)
                                except yaml.YAMLError:
                                    continue
                            
                            if schema:
                                # Validate schema
                                is_valid, _ = self.validator.validate_schema(schema)
                                if is_valid:
                                    return MCPSearchResult(
                                        name=schema.get('name', repo_id.split('/')[-1]),
                                        description=schema.get('description', item.get('description', '')),
                                        source_url=f"https://huggingface.co/{repo_id}",
                                        tags=self._extract_tags_from_hf_item(item, schema),
                                        domain=self._extract_domain_from_hf_item(item, schema),
                                        validated=True,
                                        schema=schema,
                                        file_type=filename.split('.')[-1],
                                        repository=repo_id,
                                        stars=item.get('likes', 0),
                                        source_platform="huggingface",
                                        confidence_score=0.8
                                    )
                except Exception:
                    continue
            
            return None
            
        except Exception as e:
            logger.error(f"Error processing Hugging Face item: {e}")
            return None

    async def _search_known_repositories(self, query: str, limit: int) -> List[MCPSearchResult]:
        """Search known MCP repositories and registries"""
        results = []
        
        try:
            async with RateLimitedSession() as session:
                for source in self.known_sources:
                    if source['type'] == 'github_repo':
                        repo_results = await self._search_github_repo(session, source['url'], query, limit//len(self.known_sources))
                        results.extend(repo_results)
                        
        except Exception as e:
            logger.error(f"Known repositories search error: {e}")
        
        return results

    async def _search_github_repo(self, session: RateLimitedSession, repo_url: str, query: str, limit: int) -> List[MCPSearchResult]:
        """Search a specific GitHub repository for MCPs"""
        results = []
        
        try:
            # Extract owner and repo from URL
            parts = repo_url.replace('https://github.com/', '').split('/')
            if len(parts) >= 2:
                owner, repo = parts[0], parts[1]
                
                # Search for MCP files in the repository
                search_url = f"{self.github_api_base}/search/code?q={urllib.parse.quote(query)}+repo:{owner}/{repo}+filename:.mcp"
                
                async with session.get(search_url) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        for item in data.get('items', [])[:limit]:
                            mcp_result = await self._process_github_file_enhanced(session, item)
                            if mcp_result:
                                results.append(mcp_result)
                                
        except Exception as e:
            logger.error(f"GitHub repo search error for {repo_url}: {e}")
        
        return results

    def _calculate_confidence_score(self, schema: Dict, item: Dict) -> float:
        """Calculate confidence score for MCP result"""
        score = 0.5  # Base score
        
        # Schema completeness
        if schema.get('description'):
            score += 0.1
        if schema.get('version'):
            score += 0.1
        if len(schema.get('tools', [])) > 1:
            score += 0.1
        
        # Repository metrics (if available)
        if item.get('repository', {}).get('stargazers_count', 0) > 10:
            score += 0.1
        if item.get('repository', {}).get('stargazers_count', 0) > 100:
            score += 0.1
        
        # File naming conventions
        filename = item.get('name', '')
        if '.mcp.' in filename:
            score += 0.1
        
        return min(score, 1.0)

    def _deduplicate_results(self, results: List[MCPSearchResult]) -> List[MCPSearchResult]:
        """Remove duplicate results based on name and source URL"""
        seen = set()
        unique_results = []
        
        for result in results:
            key = (result.name.lower(), result.source_url)
            if key not in seen:
                seen.add(key)
                unique_results.append(result)
        
        return unique_results

    def _extract_domain(self, name: str, description: str) -> str:
        """Extract domain from MCP name and description"""
        text = f"{name} {description}".lower()
        
        domain_keywords = {
            'weather': ['weather', 'climate', 'forecast', 'temperature', 'meteorology'],
            'finance': ['finance', 'trading', 'stock', 'crypto', 'payment', 'banking'],
            'travel': ['travel', 'booking', 'hotel', 'flight', 'airbnb', 'tourism'],
            'productivity': ['calendar', 'task', 'note', 'email', 'schedule', 'todo'],
            'development': ['code', 'git', 'github', 'deploy', 'api', 'programming'],
            'social': ['social', 'twitter', 'facebook', 'instagram', 'post', 'media'],
            'ecommerce': ['shop', 'store', 'product', 'cart', 'order', 'commerce'],
            'data': ['data', 'analytics', 'database', 'query', 'search', 'analysis'],
            'ai': ['ai', 'ml', 'llm', 'gpt', 'model', 'intelligence'],
            'communication': ['chat', 'message', 'slack', 'discord', 'teams']
        }
        
        for domain, keywords in domain_keywords.items():
            if any(keyword in text for keyword in keywords):
                return domain
        
        return 'general'

    def _extract_tags(self, name: str, description: str, schema: Dict) -> List[str]:
        """Extract relevant tags from MCP content"""
        text = f"{name} {description}".lower()
        tags = set()
        
        # Common tag patterns
        tag_patterns = {
            'api': ['api', 'rest', 'endpoint', 'service'],
            'ai': ['ai', 'ml', 'llm', 'gpt', 'model'],
            'web': ['web', 'http', 'url', 'browser', 'scraping'],
            'database': ['db', 'database', 'sql', 'mongo', 'redis'],
            'cloud': ['aws', 'azure', 'gcp', 'cloud', 'serverless'],
            'automation': ['auto', 'script', 'workflow', 'cron'],
            'integration': ['integrate', 'connect', 'sync', 'webhook'],
            'realtime': ['realtime', 'live', 'stream', 'websocket'],
            'security': ['auth', 'security', 'encrypt', 'token'],
            'monitoring': ['monitor', 'log', 'metric', 'alert']
        }
        
        for tag, patterns in tag_patterns.items():
            if any(pattern in text for pattern in patterns):
                tags.add(tag)
        
        # Add tool-based tags
        tools = schema.get('tools', [])
        for tool in tools:
            tool_name = tool.get('name', '').lower()
            if 'search' in tool_name:
                tags.add('search')
            if any(word in tool_name for word in ['fetch', 'get', 'retrieve']):
                tags.add('retrieval')
            if any(word in tool_name for word in ['create', 'add', 'post']):
                tags.add('creation')
            if any(word in tool_name for word in ['update', 'edit', 'modify']):
                tags.add('modification')
        
        return list(tags)

    def _extract_tags_from_hf_item(self, item: Dict, schema: Dict) -> List[str]:
        """Extract tags from Hugging Face item"""
        tags = []
        
        # Use HF tags if available
        if 'tags' in item:
            tags.extend(item['tags'][:5])  # Limit to 5 tags
        
        # Add MCP-specific tags
        tags.extend(self._extract_tags(
            schema.get('name', ''),
            schema.get('description', ''),
            schema
        ))
        
        return list(set(tags))  # Remove duplicates

    def _extract_domain_from_hf_item(self, item: Dict, schema: Dict) -> str:
        """Extract domain from Hugging Face item"""
        # Try to extract from HF tags first
        hf_tags = item.get('tags', [])
        for tag in hf_tags:
            if tag in ['nlp', 'computer-vision', 'audio', 'tabular']:
                return 'ai'
        
        # Fall back to standard domain extraction
        return self._extract_domain(
            schema.get('name', ''),
            schema.get('description', '')
        )

    async def _get_cached_results(self, cache_key: str) -> Optional[List[MCPSearchResult]]:
        """Get cached search results"""
        try:
            if self.cache_enabled:
                cached_data = self.redis_client.get(cache_key)
                if cached_data:
                    data = json.loads(cached_data)
                    return [MCPSearchResult(**item) for item in data]
            else:
                if cache_key in self.memory_cache:
                    cache_entry = self.memory_cache[cache_key]
                    if cache_entry['expires'] > datetime.now():
                        return [MCPSearchResult(**item) for item in cache_entry['data']]
                    else:
                        del self.memory_cache[cache_key]
            
            return None
            
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None

    async def _cache_results(self, cache_key: str, results: List[MCPSearchResult], ttl: int = 3600):
        """Cache search results"""
        try:
            data = [result.__dict__ for result in results]
            
            if self.cache_enabled:
                self.redis_client.setex(cache_key, ttl, json.dumps(data))
            else:
                self.memory_cache[cache_key] = {
                    'data': data,
                    'expires': datetime.now() + timedelta(seconds=ttl)
                }
                
        except Exception as e:
            logger.error(f"Cache set error: {e}")

# Export the enhanced explorer
enhanced_mcp_explorer = EnhancedMCPExplorer()