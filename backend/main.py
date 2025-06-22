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

# Import the enhanced MCP explorer
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    logger.info("MCP Playground API started with enhanced search capabilities")
    yield
    # Shutdown
    logger.info("MCP Playground API shutting down")

# FastAPI app
app = FastAPI(
    title="MCP.playground API",
    description="Enhanced Backend API for Model Context Protocol testing and comparison with advanced web search",
    version="2.0.0",
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
    sources: List[str] = Field(default=["github", "huggingface", "web"], description="Search sources to use")
    min_confidence: float = Field(0.0, ge=0.0, le=1.0, description="Minimum confidence score")
    domains: Optional[List[str]] = Field(None, description="Filter by specific domains")

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
        "message": "Enhanced MCP.playground API",
        "version": "2.0.0",
        "features": [
            "Enhanced web search across multiple platforms",
            "Advanced MCP schema validation",
            "Robust caching and rate limiting",
            "Multi-source MCP discovery",
            "Confidence scoring for search results"
        ],
        "endpoints": [
            "/run-agent",
            "/compare-protocols", 
            "/mcps",
            "/mcps/search",
            "/mcps/search/enhanced",
            "/mcp/import",
            "/mcp/{id}",
            "/share",
            "/export/csv",
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
    sources: str = Query("github,huggingface,web", description="Comma-separated list of sources"),
    min_confidence: float = Query(0.0, ge=0.0, le=1.0, description="Minimum confidence score")
):
    """Enhanced web search for MCPs across multiple platforms"""
    try:
        start_time = time.time()
        
        # Parse sources
        source_list = [s.strip() for s in sources.split(',') if s.strip()]
        
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
        
        # Perform enhanced web search
        results = await enhanced_mcp_explorer.search_web_mcps(query, limit)
        
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
            "INSERT INTO search_cache (id, query, results, confidence_score, created_at, expires_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now', '+1 hour'))",
            (cache_id, cache_key, json.dumps([r.dict() for r in web_results]), min_confidence)
        )
        
        # Store analytics
        analytics_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO search_analytics (id, query, results_count, search_duration_ms, sources_used) VALUES (?, ?, ?, ?, ?)",
            (analytics_id, query, len(web_results), search_duration, sources)
        )
        
        conn.commit()
        conn.close()
        
        logger.info(f"Enhanced search completed for '{query}': {len(web_results)} results in {search_duration}ms")
        return web_results
        
    except Exception as e:
        logger.error(f"Enhanced search failed for query '{query}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Enhanced search failed: {str(e)}")

@app.post("/mcps/search/enhanced", response_model=List[WebMCPResult])
async def enhanced_search_mcps(request: EnhancedSearchRequest):
    """Advanced MCP search with detailed filtering options"""
    try:
        start_time = time.time()
        
        # Perform enhanced search
        results = await enhanced_mcp_explorer.search_web_mcps(request.query, request.limit)
        
        # Apply filters
        filtered_results = []
        for result in results:
            # Confidence filter
            if result.confidence_score < request.min_confidence:
                continue
                
            # Domain filter
            if request.domains and result.domain not in request.domains:
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
        logger.info(f"Enhanced search completed: {len(web_results)} results in {search_duration}ms")
        
        return web_results
        
    except Exception as e:
        logger.error(f"Enhanced search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Enhanced search failed: {str(e)}")

@app.post("/mcps/import-from-web")
async def import_mcp_from_web(
    source_url: str = Query(..., description="URL of the MCP schema to import"),
    auto_validate: bool = Query(True, description="Automatically validate the imported MCP")
):
    """Import an MCP directly from a web URL with enhanced validation"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(source_url) as response:
                if response.status != 200:
                    raise HTTPException(status_code=400, detail=f"Failed to fetch MCP from URL: {response.status}")
                
                content = await response.text()
                
                # Try to parse as JSON or YAML
                schema = None
                if source_url.endswith('.json'):
                    try:
                        schema = json.loads(content)
                    except json.JSONDecodeError:
                        raise HTTPException(status_code=400, detail="Invalid JSON format")
                elif source_url.endswith(('.yaml', '.yml')):
                    try:
                        schema = yaml.safe_load(content)
                    except yaml.YAMLError:
                        raise HTTPException(status_code=400, detail="Invalid YAML format")
                else:
                    # Try JSON first, then YAML
                    try:
                        schema = json.loads(content)
                    except json.JSONDecodeError:
                        try:
                            schema = yaml.safe_load(content)
                        except yaml.YAMLError:
                            raise HTTPException(status_code=400, detail="Could not parse as JSON or YAML")
                
                if not schema:
                    raise HTTPException(status_code=400, detail="Empty or invalid schema")
                
                # Enhanced validation using the new validator
                if auto_validate:
                    is_valid, error_msg = enhanced_mcp_explorer.validator.validate_schema(schema)
                    if not is_valid:
                        raise HTTPException(status_code=400, detail=f"Invalid MCP schema: {error_msg}")
                
                # Extract metadata
                name = schema.get('name', 'imported-mcp')
                description = schema.get('description', f'MCP imported from {source_url}')
                
                # Determine domain and tags using enhanced methods
                domain = enhanced_mcp_explorer._extract_domain(name, description)
                tags = enhanced_mcp_explorer._extract_tags(name, description, schema)
                
                # Calculate confidence score
                confidence_score = 0.8 if auto_validate else 0.5
                
                # Store in database
                mcp_id = str(uuid.uuid4())
                conn = sqlite3.connect(DATABASE_PATH)
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO mcps (id, name, description, schema_content, tags, domain, validated, popularity, source_url, source_platform, confidence_score)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    mcp_id,
                    name,
                    description,
                    json.dumps(schema),
                    json.dumps(tags),
                    domain,
                    auto_validate,
                    0,
                    source_url,
                    "web_import",
                    confidence_score
                ))
                conn.commit()
                conn.close()
                
                logger.info(f"Successfully imported MCP '{name}' from {source_url}")
                
                return {
                    "id": mcp_id,
                    "message": "MCP imported successfully from web",
                    "name": name,
                    "source_url": source_url,
                    "validated": auto_validate,
                    "domain": domain,
                    "tags": tags,
                    "confidence_score": confidence_score
                }
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Import failed for {source_url}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

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

@app.post("/compare-protocols", response_model=CompareResponse)
async def compare_protocols(request: CompareRequest):
    """Benchmark LLM performance using different protocols"""
    try:
        start_time = time.time()
        comparison_id = str(uuid.uuid4())
        results = []
        
        # Mock protocol implementations
        protocol_configs = {
            "raw": {"base_latency": 500, "token_multiplier": 1.0, "quality_base": 0.85},
            "chain": {"base_latency": 800, "token_multiplier": 1.2, "quality_base": 0.78},
            "tree": {"base_latency": 1200, "token_multiplier": 1.5, "quality_base": 0.82},
            "rag": {"base_latency": 600, "token_multiplier": 0.8, "quality_base": 0.88},
            "custom": {"base_latency": 700, "token_multiplier": 1.1, "quality_base": 0.80}
        }
        
        for protocol in request.protocols:
            config = protocol_configs.get(protocol, protocol_configs["raw"])
            
            # Simulate protocol execution
            await asyncio.sleep(config["base_latency"] / 1000)  # Convert to seconds
            
            # Generate mock response
            response_text = f"This is a {protocol} protocol response to: '{request.prompt}'. "
            if request.document:
                response_text += f"Based on the provided document ({len(request.document)} chars), "
            response_text += f"the {protocol} approach provides a comprehensive analysis with specific insights."
            
            # Calculate metrics
            tokens_used = int(len(response_text) * config["token_multiplier"])
            latency_ms = config["base_latency"] + (len(request.prompt) // 10)
            quality_score = min(config["quality_base"] + (hash(request.prompt) % 20) / 100, 1.0)
            
            results.append(ProtocolResult(
                protocol=protocol,
                response=response_text,
                latency_ms=latency_ms,
                tokens_used=tokens_used,
                quality_score=quality_score
            ))
        
        total_latency = int((time.time() - start_time) * 1000)
        
        # Store comparison in database
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO comparisons (id, prompt, document, protocols, results)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            comparison_id,
            request.prompt,
            request.document,
            json.dumps(request.protocols),
            json.dumps([r.dict() for r in results])
        ))
        conn.commit()
        conn.close()
        
        logger.info(f"Protocol comparison completed: {comparison_id}")
        
        return CompareResponse(
            results=results,
            total_latency_ms=total_latency,
            comparison_id=comparison_id
        )
        
    except Exception as e:
        logger.error(f"Protocol comparison failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Protocol comparison failed: {str(e)}")

@app.get("/mcps", response_model=List[MCPListItem])
async def get_mcps(
    domain: Optional[str] = Query(None, description="Filter by domain"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    validated: Optional[bool] = Query(None, description="Filter by validation status"),
    sort_by: str = Query("popularity", description="Sort by: popularity, name, created_at, confidence_score"),
    limit: int = Query(50, ge=1, le=100, description="Number of results to return"),
    min_confidence: float = Query(0.0, ge=0.0, le=1.0, description="Minimum confidence score")
):
    """Return a searchable, filterable list of MCPs with enhanced filtering"""
    
    # Build query
    query = "SELECT * FROM mcps WHERE confidence_score >= ?"
    params = [min_confidence]
    
    if domain:
        query += " AND domain = ?"
        params.append(domain)
    
    if validated is not None:
        query += " AND validated = ?"
        params.append(validated)
    
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",")]
        for tag in tag_list:
            query += " AND tags LIKE ?"
            params.append(f"%{tag}%")
    
    # Add sorting
    if sort_by == "name":
        query += " ORDER BY name ASC"
    elif sort_by == "created_at":
        query += " ORDER BY created_at DESC"
    elif sort_by == "confidence_score":
        query += " ORDER BY confidence_score DESC"
    else:
        query += " ORDER BY popularity DESC"
    
    query += f" LIMIT {limit}"
    
    # Execute query
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    # Convert to response format
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
            source_url=row[8] if len(row) > 8 else None,
            source_platform=row[9] if len(row) > 9 else "local",
            confidence_score=row[10] if len(row) > 10 else 0.0,
            created_at=row[11] if len(row) > 11 else ""
        ))
    
    return mcps

@app.post("/mcp/import")
async def import_mcp(request: MCPImportRequest):
    """Upload/import new MCP with enhanced validation"""
    try:
        mcp_id = str(uuid.uuid4())
        
        # Parse schema content
        if isinstance(request.schema_content, str):
            try:
                # Try JSON first
                schema_dict = json.loads(request.schema_content)
            except json.JSONDecodeError:
                try:
                    # Try YAML
                    schema_dict = yaml.safe_load(request.schema_content)
                except yaml.YAMLError:
                    raise HTTPException(status_code=400, detail="Invalid JSON/YAML format")
        else:
            schema_dict = request.schema_content
        
        # Enhanced validation
        is_valid, error_msg = enhanced_mcp_explorer.validator.validate_schema(schema_dict)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid MCP schema: {error_msg}")
        
        # Extract enhanced metadata
        domain = enhanced_mcp_explorer._extract_domain(request.name, request.description or "")
        tags = enhanced_mcp_explorer._extract_tags(request.name, request.description or "", schema_dict)
        
        # Merge with provided tags
        if request.tags:
            tags.extend(request.tags)
            tags = list(set(tags))  # Remove duplicates
        
        # Store in database
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO mcps (id, name, description, schema_content, tags, domain, validated, popularity, source_url, source_platform, confidence_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            mcp_id,
            request.name,
            request.description,
            json.dumps(schema_dict),
            json.dumps(tags),
            request.domain or domain,
            True,  # Auto-validate for imports
            0,
            request.source_url,
            "manual_import",
            0.9  # High confidence for manual imports
        ))
        conn.commit()
        conn.close()
        
        logger.info(f"Successfully imported MCP '{request.name}'")
        
        return {
            "id": mcp_id,
            "message": "MCP imported successfully",
            "validated": True,
            "domain": request.domain or domain,
            "tags": tags
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Import failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

@app.get("/mcp/{mcp_id}")
async def get_mcp(mcp_id: str):
    """Return MCP schema, metadata, and tags for one item"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM mcps WHERE id = ?", (mcp_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="MCP not found")
    
    return {
        "id": row[0],
        "name": row[1],
        "description": row[2],
        "schema": json.loads(row[3]),
        "tags": json.loads(row[4]) if row[4] else [],
        "domain": row[5],
        "validated": bool(row[6]),
        "popularity": row[7],
        "source_url": row[8] if len(row) > 8 else None,
        "source_platform": row[9] if len(row) > 9 else "local",
        "confidence_score": row[10] if len(row) > 10 else 0.0,
        "created_at": row[11] if len(row) > 11 else "",
        "updated_at": row[12] if len(row) > 12 else ""
    }

@app.post("/share")
async def create_share_link(session_id: Optional[str] = None, comparison_id: Optional[str] = None):
    """Generate a shareable link for a saved playground run or comparison"""
    if not session_id and not comparison_id:
        raise HTTPException(status_code=400, detail="Either session_id or comparison_id must be provided")
    
    share_id = str(uuid.uuid4())
    share_data = {
        "share_id": share_id,
        "session_id": session_id,
        "comparison_id": comparison_id,
        "created_at": datetime.now().isoformat()
    }
    
    # In a real implementation, store this in a shares table
    return {
        "share_id": share_id,
        "share_url": f"/shared/{share_id}",
        "expires_at": "2024-12-31T23:59:59Z"  # Mock expiration
    }

@app.get("/export/csv")
async def export_csv(comparison_id: str):
    """Export comparison results as CSV"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM comparisons WHERE id = ?", (comparison_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Comparison not found")
    
    results = json.loads(row[4])  # results column
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow(["Protocol", "Response", "Latency (ms)", "Tokens Used", "Quality Score"])
    
    # Data
    for result in results:
        writer.writerow([
            result["protocol"],
            result["response"][:100] + "..." if len(result["response"]) > 100 else result["response"],
            result["latency_ms"],
            result["tokens_used"],
            result["quality_score"]
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=comparison_results.csv"}
    )

# Tool simulation endpoints
@app.get("/tools/weather")
async def weather_tool(location: str = Query(...), units: str = Query("metric")):
    """Mock weather API endpoint"""
    return await mock_weather_tool(location, units)

@app.get("/tools/search")
async def search_tool(query: str = Query(...), limit: int = Query(5, ge=1, le=20)):
    """Mock search API endpoint"""
    return await mock_search_tool(query, limit)

@app.get("/tools/calc")
async def calc_tool(expr: str = Query(..., alias="expression")):
    """Mock calculator API endpoint"""
    return await mock_calculator_tool(expr)

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
            COUNT(DISTINCT query) as unique_queries
        FROM search_analytics 
        WHERE created_at > datetime('now', '-24 hours')
    """)
    
    stats = cursor.fetchone()
    
    # Get top queries
    cursor.execute("""
        SELECT query, COUNT(*) as count
        FROM search_analytics 
        WHERE created_at > datetime('now', '-7 days')
        GROUP BY query 
        ORDER BY count DESC 
        LIMIT 10
    """)
    
    top_queries = cursor.fetchall()
    
    conn.close()
    
    return {
        "total_searches": stats[0] or 0,
        "avg_results": round(stats[1] or 0, 2),
        "avg_duration_ms": round(stats[2] or 0, 2),
        "unique_queries": stats[3] or 0,
        "top_queries": [{"query": q[0], "count": q[1]} for q in top_queries]
    }

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected" if os.path.exists(DATABASE_PATH) else "disconnected",
        "features": [
            "enhanced_web_search",
            "multi_platform_discovery", 
            "advanced_validation",
            "confidence_scoring",
            "robust_caching",
            "search_analytics"
        ],
        "version": "2.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)