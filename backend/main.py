from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
import json
import yaml
import time
import uuid
import asyncio
import csv
import io
from datetime import datetime
import sqlite3
import os
import re
import aiohttp
import urllib.parse
from contextlib import asynccontextmanager
import logging

# Import the enhanced MCP explorer with web scraping
from enhanced_mcp_explorer import enhanced_mcp_explorer, MCPSearchResult

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
DATABASE_PATH = "mcp_playground.db"

def init_db():
    """Initialize SQLite database with required tables"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # MCPs table with enhanced fields
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
            author TEXT,
            last_updated TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Playground sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            prompt TEXT NOT NULL,
            document TEXT,
            mcp_schema TEXT,
            results TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Comparison results table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS comparisons (
            id TEXT PRIMARY KEY,
            prompt TEXT NOT NULL,
            document TEXT,
            protocols TEXT NOT NULL,
            results TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Enhanced search cache table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS search_cache (
            id TEXT PRIMARY KEY,
            query TEXT NOT NULL,
            source_platform TEXT DEFAULT 'all',
            results TEXT NOT NULL,
            confidence_score REAL DEFAULT 0.0,
            search_method TEXT DEFAULT 'api',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP DEFAULT (datetime('now', '+1 hour'))
        )
    ''')
    
    # Search analytics table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS search_analytics (
            id TEXT PRIMARY KEY,
            query TEXT NOT NULL,
            results_count INTEGER DEFAULT 0,
            search_duration_ms INTEGER DEFAULT 0,
            sources_used TEXT,
            search_method TEXT DEFAULT 'api',
            success_rate REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Web scraping logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scraping_logs (
            id TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            status_code INTEGER,
            content_type TEXT,
            content_length INTEGER,
            success BOOLEAN DEFAULT FALSE,
            error_message TEXT,
            scraped_mcps INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    logger.info("MCP Playground API started with enhanced web scraping capabilities")
    yield
    # Shutdown
    logger.info("MCP Playground API shutting down")

# FastAPI app
app = FastAPI(
    title="MCP.playground API",
    description="Enhanced Backend API for Model Context Protocol testing with advanced web scraping",
    version="3.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class MCPSchema(BaseModel):
    name: str
    version: str = "1.0.0"
    description: Optional[str] = None
    tools: List[Dict[str, Any]]
    
    @validator('tools')
    def validate_tools(cls, v):
        for tool in v:
            if 'name' not in tool or 'description' not in tool:
                raise ValueError('Each tool must have name and description')
        return v

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
    source_platform: str = "unknown"
    confidence_score: float = 0.0

class EnhancedSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=200)
    limit: int = Field(20, ge=1, le=100)
    sources: List[str] = Field(default=["github", "huggingface", "web", "scraping"], description="Search sources to use")
    min_confidence: float = Field(0.0, ge=0.0, le=1.0, description="Minimum confidence score")
    domains: Optional[List[str]] = Field(None, description="Filter by specific domains")
    use_web_scraping: bool = Field(True, description="Enable web scraping for broader search")

class AgentRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000)
    document: Optional[str] = Field(None, max_length=100000)
    mcp_schema: MCPSchema

class CompareRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000)
    document: Optional[str] = Field(None, max_length=100000)
    protocols: List[str] = Field(..., min_items=1, max_items=10)
    
    @validator('protocols')
    def validate_protocols(cls, v):
        valid_protocols = ['raw', 'chain', 'tree', 'rag', 'custom']
        for protocol in v:
            if protocol not in valid_protocols:
                raise ValueError(f'Invalid protocol: {protocol}. Valid options: {valid_protocols}')
        return v

class MCPImportRequest(BaseModel):
    name: str
    description: Optional[str] = None
    schema_content: Union[str, Dict[str, Any]]
    tags: Optional[List[str]] = []
    domain: Optional[str] = "general"
    source_url: Optional[str] = None

class ToolCall(BaseModel):
    tool: str
    input: Dict[str, Any]
    output: Dict[str, Any]
    latency_ms: int
    tokens_used: int

class AgentResponse(BaseModel):
    output: str
    tool_calls: List[ToolCall]
    tokens_used: int
    latency_ms: int
    model_used: str = "gpt-4"
    session_id: str

class ProtocolResult(BaseModel):
    protocol: str
    response: str
    latency_ms: int
    tokens_used: int
    quality_score: float

class CompareResponse(BaseModel):
    results: List[ProtocolResult]
    total_latency_ms: int
    comparison_id: str

class MCPListItem(BaseModel):
    id: str
    name: str
    description: str
    tags: List[str]
    domain: str
    validated: bool
    popularity: int
    source_url: Optional[str] = None
    source_platform: str = "local"
    confidence_score: float = 0.0
    file_type: str = "json"
    repository: Optional[str] = None
    stars: int = 0
    created_at: str

# Mock tool implementations (existing code)
async def mock_weather_tool(location: str, units: str = "metric") -> Dict[str, Any]:
    """Mock weather API call"""
    await asyncio.sleep(0.2)  # Simulate API latency
    
    mock_data = {
        "paris": {"temp": 22, "condition": "Sunny", "humidity": 65},
        "london": {"temp": 18, "condition": "Cloudy", "humidity": 78},
        "new york": {"temp": 25, "condition": "Partly Cloudy", "humidity": 60},
        "tokyo": {"temp": 28, "condition": "Rainy", "humidity": 85}
    }
    
    location_lower = location.lower()
    if location_lower in mock_data:
        data = mock_data[location_lower]
    else:
        data = {"temp": 20, "condition": "Unknown", "humidity": 50}
    
    return {
        "location": location,
        "temperature": data["temp"],
        "condition": data["condition"],
        "humidity": data["humidity"],
        "units": units
    }

async def mock_search_tool(query: str, limit: int = 5) -> Dict[str, Any]:
    """Mock search API call"""
    await asyncio.sleep(0.3)
    
    mock_results = [
        {"title": f"Search result for '{query}' - Article {i+1}", 
         "url": f"https://example.com/article-{i+1}",
         "snippet": f"This is a mock search result snippet for {query}..."} 
        for i in range(min(limit, 5))
    ]
    
    return {
        "query": query,
        "results": mock_results,
        "total": len(mock_results)
    }

async def mock_calculator_tool(expression: str) -> Dict[str, Any]:
    """Mock calculator tool"""
    await asyncio.sleep(0.1)
    
    try:
        # Simple expression evaluation (be careful in production!)
        result = eval(expression.replace('^', '**'))
        return {
            "expression": expression,
            "result": result,
            "success": True
        }
    except Exception as e:
        return {
            "expression": expression,
            "error": str(e),
            "success": False
        }

async def execute_tool(tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a tool based on its name and parameters"""
    
    if "weather" in tool_name.lower():
        location = parameters.get("location", "Unknown")
        units = parameters.get("units", "metric")
        return await mock_weather_tool(location, units)
    
    elif "search" in tool_name.lower():
        query = parameters.get("query", "")
        limit = parameters.get("limit", 5)
        return await mock_search_tool(query, limit)
    
    elif "calc" in tool_name.lower() or "math" in tool_name.lower():
        expression = parameters.get("expression", "1+1")
        return await mock_calculator_tool(expression)
    
    else:
        # Generic mock response
        return {
            "tool": tool_name,
            "input": parameters,
            "result": f"Mock result from {tool_name}",
            "success": True
        }

async def simulate_agent_execution(prompt: str, mcp_schema: MCPSchema, document: Optional[str] = None) -> AgentResponse:
    """Simulate agent execution with MCP tools"""
    start_time = time.time()
    session_id = str(uuid.uuid4())
    
    # Analyze prompt to determine which tools to use
    prompt_lower = prompt.lower()
    tool_calls = []
    total_tokens = 0
    
    # Simulate tool selection based on prompt content
    for tool in mcp_schema.tools:
        tool_name = tool["name"].lower()
        
        # Simple keyword matching to determine tool usage
        should_use_tool = False
        if "weather" in tool_name and ("weather" in prompt_lower or "temperature" in prompt_lower):
            should_use_tool = True
        elif "search" in tool_name and ("search" in prompt_lower or "find" in prompt_lower):
            should_use_tool = True
        elif "calc" in tool_name and any(op in prompt_lower for op in ["+", "-", "*", "/", "calculate"]):
            should_use_tool = True
        
        if should_use_tool:
            # Generate mock parameters based on tool definition
            mock_params = {}
            if "parameters" in tool:
                for param_name, param_type in tool["parameters"].items():
                    if param_name == "location":
                        mock_params[param_name] = "Paris"  # Extract from prompt in real implementation
                    elif param_name == "query":
                        mock_params[param_name] = prompt[:50]
                    elif param_name == "expression":
                        mock_params[param_name] = "2+2"
                    else:
                        mock_params[param_name] = f"mock_{param_name}"
            
            # Execute tool
            tool_start = time.time()
            tool_output = await execute_tool(tool["name"], mock_params)
            tool_latency = int((time.time() - tool_start) * 1000)
            tool_tokens = len(json.dumps(tool_output)) // 4  # Rough token estimation
            
            tool_calls.append(ToolCall(
                tool=tool["name"],
                input=mock_params,
                output=tool_output,
                latency_ms=tool_latency,
                tokens_used=tool_tokens
            ))
            total_tokens += tool_tokens
    
    # Generate agent response
    if tool_calls:
        response_parts = [f"I've executed {len(tool_calls)} tool(s) to help answer your question:\n"]
        for tool_call in tool_calls:
            response_parts.append(f"• {tool_call.tool}: {json.dumps(tool_call.output)[:100]}...")
        response_parts.append(f"\nBased on these results, here's my response to '{prompt}':")
        response_parts.append("This is a simulated agent response that would incorporate the tool results above.")
    else:
        response_parts = [f"I understand your request: '{prompt}'. However, none of the available tools in the MCP schema are suitable for this task."]
        response_parts.append(f"Available tools: {', '.join([tool['name'] for tool in mcp_schema.tools])}")
    
    agent_output = "\n".join(response_parts)
    total_latency = int((time.time() - start_time) * 1000)
    total_tokens += len(agent_output) // 4  # Add response tokens
    
    return AgentResponse(
        output=agent_output,
        tool_calls=tool_calls,
        tokens_used=total_tokens,
        latency_ms=total_latency,
        model_used="gpt-4",
        session_id=session_id
    )

# API Endpoints

@app.get("/")
async def root():
    return {
        "message": "Enhanced MCP.playground API with Web Scraping",
        "version": "3.0.0",
        "features": [
            "Advanced web scraping with BeautifulSoup4",
            "Multi-platform MCP discovery (GitHub, GitLab, HuggingFace)",
            "Enhanced schema validation and confidence scoring",
            "Robust caching and rate limiting",
            "Comprehensive search analytics",
            "Real-time web content extraction"
        ],
        "endpoints": [
            "/run-agent",
            "/compare-protocols", 
            "/mcps",
            "/mcps/search",
            "/mcps/search/enhanced",
            "/mcps/search/scrape",
            "/mcp/import",
            "/mcp/{id}",
            "/share",
            "/export/csv",
            "/analytics/search",
            "/analytics/scraping",
            "/tools/weather",
            "/tools/search",
            "/tools/calc",
            "/health"
        ]
    }

@app.get("/mcps/search", response_model=List[WebMCPResult])
async def search_web_mcps(
    query: str = Query(..., description="Search query for MCPs"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    sources: str = Query("github,huggingface,web,scraping", description="Comma-separated list of sources"),
    min_confidence: float = Query(0.0, ge=0.0, le=1.0, description="Minimum confidence score"),
    use_scraping: bool = Query(True, description="Enable web scraping for broader search")
):
    """Enhanced web search for MCPs with web scraping capabilities"""
    try:
        start_time = time.time()
        
        # Parse sources
        source_list = [s.strip() for s in sources.split(',') if s.strip()]
        
        # Check cache first
        cache_key = f"search:{query}:{limit}:{sources}:{min_confidence}:{use_scraping}"
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
        
        # Perform enhanced web search with scraping
        if use_scraping:
            logger.info(f"Starting web scraping search for: {query}")
            results = await enhanced_mcp_explorer.search_web_mcps(query, limit)
            search_method = "scraping"
        else:
            logger.info(f"Starting API-only search for: {query}")
            results = await enhanced_mcp_explorer._search_api_sources(query, limit)
            search_method = "api"
        
        # Filter by confidence score
        filtered_results = [r for r in results if r.confidence_score >= min_confidence]
        
        # Convert to WebMCPResult format
        web_results = []
        for result in filtered_results:
            web_results.append(WebMCPResult(
                name=result.name,
                description=result.description,
                source_url=result.source_url,
                tags=result.tags,
                domain=result.domain,
                validated=result.validated,
                schema=result.schema,
                file_type=result.file_type,
                repository=result.repository,
                stars=result.stars,
                source_platform=result.source_platform,
                confidence_score=result.confidence_score
            ))
        
        # Cache results
        cache_id = str(uuid.uuid4())
        search_duration = int((time.time() - start_time) * 1000)
        
        cursor.execute(
            "INSERT INTO search_cache (id, query, results, confidence_score, search_method, created_at, expires_at) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now', '+1 hour'))",
            (cache_id, cache_key, json.dumps([r.dict() for r in web_results]), min_confidence, search_method)
        )
        
        # Store analytics
        analytics_id = str(uuid.uuid4())
        success_rate = len(web_results) / max(len(results), 1) if results else 0
        cursor.execute(
            "INSERT INTO search_analytics (id, query, results_count, search_duration_ms, sources_used, search_method, success_rate) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (analytics_id, query, len(web_results), search_duration, sources, search_method, success_rate)
        )
        
        conn.commit()
        conn.close()
        
        logger.info(f"Enhanced search completed for '{query}': {len(web_results)} results in {search_duration}ms using {search_method}")
        return web_results
        
    except Exception as e:
        logger.error(f"Enhanced search failed for query '{query}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Enhanced search failed: {str(e)}")

@app.post("/mcps/search/enhanced", response_model=List[WebMCPResult])
async def enhanced_search_mcps(request: EnhancedSearchRequest):
    """Advanced MCP search with detailed filtering and web scraping options"""
    try:
        start_time = time.time()
        
        # Perform enhanced search with scraping if enabled
        if request.use_web_scraping:
            results = await enhanced_mcp_explorer.search_web_mcps(request.query, request.limit)
            search_method = "scraping"
        else:
            results = await enhanced_mcp_explorer._search_api_sources(request.query, request.limit)
            search_method = "api"
        
        # Apply filters
        filtered_results = []
        for result in results:
            # Confidence filter
            if result.confidence_score < request.min_confidence:
                continue
                
            # Domain filter
            if request.domains and result.domain not in request.domains:
                continue
                
            # Source filter
            if request.sources and result.source_platform not in request.sources:
                continue
                
            filtered_results.append(result)
        
        # Convert to response format
        web_results = [WebMCPResult(
            name=r.name,
            description=r.description,
            source_url=r.source_url,
            tags=r.tags,
            domain=r.domain,
            validated=r.validated,
            schema=r.schema,
            file_type=r.file_type,
            repository=r.repository,
            stars=r.stars,
            source_platform=r.source_platform,
            confidence_score=r.confidence_score
        ) for r in filtered_results]
        
        search_duration = int((time.time() - start_time) * 1000)
        
        # Store analytics
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        analytics_id = str(uuid.uuid4())
        success_rate = len(web_results) / max(len(results), 1) if results else 0
        cursor.execute(
            "INSERT INTO search_analytics (id, query, results_count, search_duration_ms, sources_used, search_method, success_rate) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (analytics_id, request.query, len(web_results), search_duration, ','.join(request.sources), search_method, success_rate)
        )
        conn.commit()
        conn.close()
        
        logger.info(f"Enhanced search completed: {len(web_results)} results in {search_duration}ms using {search_method}")
        
        return web_results
        
    except Exception as e:
        logger.error(f"Enhanced search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Enhanced search failed: {str(e)}")

@app.get("/mcps/search/scrape")
async def scrape_specific_url(
    url: str = Query(..., description="Specific URL to scrape for MCP content"),
    validate: bool = Query(True, description="Validate the scraped MCP schema")
):
    """Scrape a specific URL for MCP content"""
    try:
        start_time = time.time()
        
        # Use the web scraper to fetch and validate content
        scraper = enhanced_mcp_explorer.web_scraper
        
        async with aiohttp.ClientSession() as session:
            content = await scraper._fetch_file_content(session, url)
            
            if not content:
                raise HTTPException(status_code=404, detail="Could not fetch content from URL")
            
            if not scraper._is_valid_mcp_content(content):
                raise HTTPException(status_code=400, detail="URL does not contain valid MCP content")
            
            # Extract MCP information
            name = scraper._extract_name_from_content(content) or "Unknown MCP"
            description = scraper._extract_description_from_content(content) or f"MCP from {url}"
            domain = scraper._extract_domain_from_content(content)
            tags = scraper._extract_tags_from_content(content, name, description)
            confidence = scraper._calculate_confidence_score(content, url, name, description)
            
            # Parse schema if validation is requested
            schema = None
            if validate:
                try:
                    if url.endswith('.json'):
                        schema = json.loads(content)
                    else:
                        schema = yaml.safe_load(content)
                    
                    is_valid, error_msg = enhanced_mcp_explorer.validator.validate_schema(schema)
                    if not is_valid:
                        raise HTTPException(status_code=400, detail=f"Invalid MCP schema: {error_msg}")
                        
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Schema parsing failed: {str(e)}")
            
            # Log scraping activity
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()
            log_id = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO scraping_logs (id, url, status_code, content_type, content_length, success, scraped_mcps) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (log_id, url, 200, "application/json" if url.endswith('.json') else "application/yaml", len(content), True, 1)
            )
            conn.commit()
            conn.close()
            
            duration = int((time.time() - start_time) * 1000)
            
            return {
                "success": True,
                "url": url,
                "name": name,
                "description": description,
                "domain": domain,
                "tags": tags,
                "confidence_score": confidence,
                "validated": validate,
                "schema": schema if validate else None,
                "content_length": len(content),
                "scrape_duration_ms": duration
            }
            
    except HTTPException:
        raise
    except Exception as e:
        # Log failed scraping attempt
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        log_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO scraping_logs (id, url, status_code, success, error_message, scraped_mcps) VALUES (?, ?, ?, ?, ?, ?)",
            (log_id, url, 0, False, str(e), 0)
        )
        conn.commit()
        conn.close()
        
        logger.error(f"URL scraping failed for {url}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")

# Analytics endpoints
@app.get("/analytics/search")
async def get_search_analytics():
    """Get search analytics data"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Get recent search statistics
    cursor.execute("""
        SELECT 
            COUNT(*) as total_searches,
            AVG(results_count) as avg_results,
            AVG(search_duration_ms) as avg_duration,
            COUNT(DISTINCT query) as unique_queries,
            AVG(success_rate) as avg_success_rate,
            search_method,
            COUNT(*) as method_count
        FROM search_analytics 
        WHERE created_at > datetime('now', '-24 hours')
        GROUP BY search_method
    """)
    
    method_stats = cursor.fetchall()
    
    # Get top queries
    cursor.execute("""
        SELECT query, COUNT(*) as count, AVG(results_count) as avg_results
        FROM search_analytics 
        WHERE created_at > datetime('now', '-7 days')
        GROUP BY query 
        ORDER BY count DESC 
        LIMIT 10
    """)
    
    top_queries = cursor.fetchall()
    
    # Get overall stats
    cursor.execute("""
        SELECT 
            COUNT(*) as total_searches,
            AVG(results_count) as avg_results,
            AVG(search_duration_ms) as avg_duration,
            AVG(success_rate) as avg_success_rate
        FROM search_analytics 
        WHERE created_at > datetime('now', '-24 hours')
    """)
    
    overall_stats = cursor.fetchone()
    
    conn.close()
    
    return {
        "overall": {
            "total_searches": overall_stats[0] or 0,
            "avg_results": round(overall_stats[1] or 0, 2),
            "avg_duration_ms": round(overall_stats[2] or 0, 2),
            "avg_success_rate": round(overall_stats[3] or 0, 4)
        },
        "by_method": [
            {
                "method": row[5],
                "searches": row[6],
                "avg_results": round(row[1] or 0, 2),
                "avg_duration_ms": round(row[2] or 0, 2),
                "avg_success_rate": round(row[4] or 0, 4)
            } for row in method_stats
        ],
        "top_queries": [
            {
                "query": q[0], 
                "count": q[1], 
                "avg_results": round(q[2] or 0, 2)
            } for q in top_queries
        ]
    }

@app.get("/analytics/scraping")
async def get_scraping_analytics():
    """Get web scraping analytics data"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Get scraping statistics
    cursor.execute("""
        SELECT 
            COUNT(*) as total_attempts,
            SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_scrapes,
            AVG(content_length) as avg_content_length,
            SUM(scraped_mcps) as total_mcps_found,
            COUNT(DISTINCT url) as unique_urls
        FROM scraping_logs 
        WHERE created_at > datetime('now', '-24 hours')
    """)
    
    stats = cursor.fetchone()
    
    # Get top scraped domains
    cursor.execute("""
        SELECT 
            CASE 
                WHEN url LIKE '%github.com%' THEN 'GitHub'
                WHEN url LIKE '%gitlab.com%' THEN 'GitLab'
                WHEN url LIKE '%huggingface.co%' THEN 'Hugging Face'
                ELSE 'Other'
            END as domain,
            COUNT(*) as scrapes,
            SUM(scraped_mcps) as mcps_found,
            AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) as success_rate
        FROM scraping_logs 
        WHERE created_at > datetime('now', '-7 days')
        GROUP BY domain
        ORDER BY scrapes DESC
    """)
    
    domain_stats = cursor.fetchall()
    
    # Get recent errors
    cursor.execute("""
        SELECT url, error_message, created_at
        FROM scraping_logs 
        WHERE success = 0 AND created_at > datetime('now', '-24 hours')
        ORDER BY created_at DESC
        LIMIT 10
    """)
    
    recent_errors = cursor.fetchall()
    
    conn.close()
    
    success_rate = (stats[1] / stats[0]) if stats[0] > 0 else 0
    
    return {
        "summary": {
            "total_attempts": stats[0] or 0,
            "successful_scrapes": stats[1] or 0,
            "success_rate": round(success_rate, 4),
            "avg_content_length": round(stats[2] or 0, 2),
            "total_mcps_found": stats[3] or 0,
            "unique_urls": stats[4] or 0
        },
        "by_domain": [
            {
                "domain": row[0],
                "scrapes": row[1],
                "mcps_found": row[2],
                "success_rate": round(row[3], 4)
            } for row in domain_stats
        ],
        "recent_errors": [
            {
                "url": error[0],
                "error": error[1],
                "timestamp": error[2]
            } for error in recent_errors
        ]
    }

# Continue with existing endpoints...
@app.post("/run-agent", response_model=AgentResponse)
async def run_agent(request: AgentRequest):
    """Execute a prompt using a user-defined MCP schema"""
    try:
        # Validate MCP schema using enhanced validator
        is_valid, error_msg = enhanced_mcp_explorer.validator.validate_schema(request.mcp_schema.dict())
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid MCP schema: {error_msg}")
        
        # Execute agent
        result = await simulate_agent_execution(
            request.prompt, 
            request.mcp_schema, 
            request.document
        )
        
        # Store session in database
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO sessions (id, prompt, document, mcp_schema, results)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            result.session_id,
            request.prompt,
            request.document,
            json.dumps(request.mcp_schema.dict()),
            json.dumps(result.dict())
        ))
        conn.commit()
        conn.close()
        
        logger.info(f"Agent execution completed for session {result.session_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Agent execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")

# Health check with enhanced status
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected" if os.path.exists(DATABASE_PATH) else "disconnected",
        "features": [
            "enhanced_web_scraping",
            "multi_platform_discovery", 
            "advanced_validation",
            "confidence_scoring",
            "robust_caching",
            "search_analytics",
            "scraping_analytics",
            "beautifulsoup4_integration"
        ],
        "version": "3.0.0",
        "scraping_enabled": True,
        "supported_platforms": [
            "GitHub",
            "GitLab", 
            "Hugging Face",
            "General Web",
            "Awesome Lists"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)