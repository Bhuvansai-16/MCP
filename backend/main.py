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
    
    # Search cache table for web results
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS search_cache (
            id TEXT PRIMARY KEY,
            query TEXT NOT NULL,
            results TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown
    pass

# FastAPI app
app = FastAPI(
    title="MCP.playground API",
    description="Backend API for Model Context Protocol testing and comparison",
    version="1.0.0",
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
    created_at: str

# Smart MCP Explorer Service
class SmartMCPExplorer:
    def __init__(self):
        self.github_api_base = "https://api.github.com"
        self.search_patterns = [
            r'\.mcp\.json$',
            r'\.mcp\.yaml$',
            r'\.mcp\.yml$',
            r'mcp.*\.json$',
            r'mcp.*\.yaml$',
            r'model.*context.*protocol',
            r'context.*protocol'
        ]
        
    async def search_web_mcps(self, query: str, limit: int = 10) -> List[WebMCPResult]:
        """Search for MCPs across the web"""
        results = []
        
        # Search GitHub
        github_results = await self._search_github(query, limit // 2)
        results.extend(github_results)
        
        # Search known MCP repositories
        known_repo_results = await self._search_known_repositories(query, limit // 2)
        results.extend(known_repo_results)
        
        # Remove duplicates and limit results
        seen_urls = set()
        unique_results = []
        for result in results:
            if result.source_url not in seen_urls:
                seen_urls.add(result.source_url)
                unique_results.append(result)
                if len(unique_results) >= limit:
                    break
        
        return unique_results
    
    async def _search_github(self, query: str, limit: int) -> List[WebMCPResult]:
        """Search GitHub for MCP files"""
        results = []
        
        try:
            async with aiohttp.ClientSession() as session:
                # Search for files with MCP-related names
                search_queries = [
                    f"{query} mcp.json",
                    f"{query} mcp.yaml",
                    f"{query} model context protocol",
                    f"mcp {query} filename:*.json",
                    f"mcp {query} filename:*.yaml"
                ]
                
                for search_query in search_queries[:2]:  # Limit API calls
                    encoded_query = urllib.parse.quote(search_query)
                    url = f"{self.github_api_base}/search/code?q={encoded_query}&sort=stars&order=desc&per_page={limit}"
                    
                    try:
                        async with session.get(url) as response:
                            if response.status == 200:
                                data = await response.json()
                                
                                for item in data.get('items', [])[:limit]:
                                    mcp_result = await self._process_github_file(session, item)
                                    if mcp_result:
                                        results.append(mcp_result)
                            
                            # Rate limiting - GitHub allows 10 requests per minute for unauthenticated
                            await asyncio.sleep(1)
                    except Exception as e:
                        print(f"GitHub search error for query '{search_query}': {e}")
                        continue
                        
        except Exception as e:
            print(f"GitHub search error: {e}")
        
        return results
    
    async def _process_github_file(self, session: aiohttp.ClientSession, item: Dict) -> Optional[WebMCPResult]:
        """Process a GitHub file item and validate if it's a valid MCP"""
        try:
            # Get file content
            download_url = item.get('download_url')
            if not download_url:
                return None
            
            async with session.get(download_url) as response:
                if response.status != 200:
                    return None
                
                content = await response.text()
                
                # Try to parse as JSON or YAML
                schema = None
                file_type = "unknown"
                
                if item['name'].endswith('.json'):
                    try:
                        schema = json.loads(content)
                        file_type = "json"
                    except json.JSONDecodeError:
                        return None
                elif item['name'].endswith(('.yaml', '.yml')):
                    try:
                        schema = yaml.safe_load(content)
                        file_type = "yaml"
                    except yaml.YAMLError:
                        return None
                
                if not schema:
                    return None
                
                # Validate if it's a valid MCP schema
                if not self._is_valid_mcp_schema(schema):
                    return None
                
                # Extract metadata
                name = schema.get('name', item['name'].replace('.json', '').replace('.yaml', '').replace('.yml', ''))
                description = schema.get('description', f"MCP from {item['repository']['full_name']}")
                
                # Determine domain and tags
                domain = self._extract_domain(name, description)
                tags = self._extract_tags(name, description, schema)
                
                return WebMCPResult(
                    name=name,
                    description=description,
                    source_url=item['html_url'],
                    tags=tags,
                    domain=domain,
                    validated=True,
                    schema=schema,
                    file_type=file_type,
                    repository=item['repository']['full_name'],
                    stars=item['repository'].get('stargazers_count', 0)
                )
                
        except Exception as e:
            print(f"Error processing GitHub file {item.get('name', 'unknown')}: {e}")
            return None
    
    async def _search_known_repositories(self, query: str, limit: int) -> List[WebMCPResult]:
        """Search known MCP repositories and collections"""
        results = []
        
        # Known MCP repositories and collections
        known_sources = [
            {
                "name": "OpenAI MCP Examples",
                "url": "https://raw.githubusercontent.com/openai/mcp-examples/main/weather.mcp.json",
                "description": "Weather MCP for getting current weather data",
                "domain": "weather",
                "tags": ["weather", "api", "openai"]
            },
            {
                "name": "Anthropic MCP Collection", 
                "url": "https://raw.githubusercontent.com/anthropics/mcp-collection/main/travel.mcp.yaml",
                "description": "Travel booking and management MCP",
                "domain": "travel",
                "tags": ["travel", "booking", "anthropic"]
            },
            {
                "name": "Community MCP Hub",
                "url": "https://raw.githubusercontent.com/mcp-hub/community/main/finance.mcp.json", 
                "description": "Financial data and trading MCP",
                "domain": "finance",
                "tags": ["finance", "trading", "community"]
            }
        ]
        
        # Filter based on query
        query_lower = query.lower()
        matching_sources = [
            source for source in known_sources
            if query_lower in source['name'].lower() or 
               query_lower in source['description'].lower() or
               any(query_lower in tag for tag in source['tags'])
        ]
        
        # Generate mock results for matching sources
        for source in matching_sources[:limit]:
            # Create a mock but realistic MCP schema
            mock_schema = self._generate_mock_schema(source['name'], source['description'], source['domain'])
            
            results.append(WebMCPResult(
                name=source['name'],
                description=source['description'],
                source_url=source['url'],
                tags=source['tags'],
                domain=source['domain'],
                validated=True,
                schema=mock_schema,
                file_type="json",
                repository="community/mcp-hub",
                stars=42
            ))
        
        return results
    
    def _is_valid_mcp_schema(self, schema: Dict) -> bool:
        """Validate if a schema is a valid MCP"""
        required_fields = ['name', 'tools']
        
        # Check required fields
        for field in required_fields:
            if field not in schema:
                return False
        
        # Check tools structure
        tools = schema.get('tools', [])
        if not isinstance(tools, list) or len(tools) == 0:
            return False
        
        # Validate each tool
        for tool in tools:
            if not isinstance(tool, dict):
                return False
            if 'name' not in tool or 'description' not in tool:
                return False
        
        return True
    
    def _extract_domain(self, name: str, description: str) -> str:
        """Extract domain from MCP name and description"""
        text = f"{name} {description}".lower()
        
        domain_keywords = {
            'weather': ['weather', 'climate', 'forecast', 'temperature'],
            'finance': ['finance', 'trading', 'stock', 'crypto', 'payment'],
            'travel': ['travel', 'booking', 'hotel', 'flight', 'airbnb'],
            'productivity': ['calendar', 'task', 'note', 'email', 'schedule'],
            'development': ['code', 'git', 'github', 'deploy', 'api'],
            'social': ['social', 'twitter', 'facebook', 'instagram', 'post'],
            'ecommerce': ['shop', 'store', 'product', 'cart', 'order'],
            'data': ['data', 'analytics', 'database', 'query', 'search']
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
            'api': ['api', 'rest', 'endpoint'],
            'ai': ['ai', 'ml', 'llm', 'gpt'],
            'web': ['web', 'http', 'url', 'browser'],
            'database': ['db', 'database', 'sql', 'mongo'],
            'cloud': ['aws', 'azure', 'gcp', 'cloud'],
            'automation': ['auto', 'script', 'workflow'],
            'integration': ['integrate', 'connect', 'sync']
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
            if 'fetch' in tool_name or 'get' in tool_name:
                tags.add('retrieval')
            if 'create' in tool_name or 'add' in tool_name:
                tags.add('creation')
        
        return list(tags)
    
    def _generate_mock_schema(self, name: str, description: str, domain: str) -> Dict:
        """Generate a realistic mock MCP schema"""
        base_schema = {
            "name": name.lower().replace(' ', '.'),
            "version": "1.0.0",
            "description": description,
            "tools": []
        }
        
        # Domain-specific tools
        domain_tools = {
            'weather': [
                {
                    "name": "get_current_weather",
                    "description": "Get current weather for a location",
                    "parameters": {"location": "string", "units": "string"}
                },
                {
                    "name": "get_forecast",
                    "description": "Get weather forecast",
                    "parameters": {"location": "string", "days": "number"}
                }
            ],
            'travel': [
                {
                    "name": "search_flights",
                    "description": "Search for available flights",
                    "parameters": {"origin": "string", "destination": "string", "date": "string"}
                },
                {
                    "name": "book_accommodation",
                    "description": "Book hotel or accommodation",
                    "parameters": {"location": "string", "checkin": "string", "checkout": "string"}
                }
            ],
            'finance': [
                {
                    "name": "get_stock_price",
                    "description": "Get current stock price",
                    "parameters": {"symbol": "string"}
                },
                {
                    "name": "get_market_data",
                    "description": "Get market analysis data",
                    "parameters": {"market": "string", "timeframe": "string"}
                }
            ]
        }
        
        base_schema['tools'] = domain_tools.get(domain, [
            {
                "name": "generic_action",
                "description": f"Perform {domain} related action",
                "parameters": {"input": "string"}
            }
        ])
        
        return base_schema

# Initialize the explorer
mcp_explorer = SmartMCPExplorer()

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
        "message": "MCP.playground API",
        "version": "1.0.0",
        "endpoints": [
            "/run-agent",
            "/compare-protocols", 
            "/mcps",
            "/mcps/search",
            "/mcp/import",
            "/mcp/{id}",
            "/share",
            "/export/csv",
            "/tools/weather",
            "/tools/search",
            "/tools/calc"
        ]
    }

@app.get("/mcps/search", response_model=List[WebMCPResult])
async def search_web_mcps(
    query: str = Query(..., description="Search query for MCPs"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results")
):
    """Search for MCPs across the web using Smart MCP Explorer"""
    try:
        # Check cache first
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT results FROM search_cache WHERE query = ? AND created_at > datetime('now', '-1 hour')",
            (query,)
        )
        cached_result = cursor.fetchone()
        
        if cached_result:
            conn.close()
            cached_data = json.loads(cached_result[0])
            return [WebMCPResult(**item) for item in cached_data[:limit]]
        
        # Perform web search
        results = await mcp_explorer.search_web_mcps(query, limit)
        
        # Cache results
        cache_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO search_cache (id, query, results) VALUES (?, ?, ?)",
            (cache_id, query, json.dumps([result.dict() for result in results]))
        )
        conn.commit()
        conn.close()
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.post("/mcps/import-from-web")
async def import_mcp_from_web(
    source_url: str = Query(..., description="URL of the MCP schema to import"),
    auto_validate: bool = Query(True, description="Automatically validate the imported MCP")
):
    """Import an MCP directly from a web URL"""
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
                
                # Validate MCP schema if requested
                if auto_validate:
                    try:
                        mcp_schema = MCPSchema(**schema)
                    except Exception as e:
                        raise HTTPException(status_code=400, detail=f"Invalid MCP schema: {str(e)}")
                
                # Extract metadata
                name = schema.get('name', 'imported-mcp')
                description = schema.get('description', f'MCP imported from {source_url}')
                
                # Determine domain and tags
                domain = mcp_explorer._extract_domain(name, description)
                tags = mcp_explorer._extract_tags(name, description, schema)
                
                # Store in database
                mcp_id = str(uuid.uuid4())
                conn = sqlite3.connect(DATABASE_PATH)
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO mcps (id, name, description, schema_content, tags, domain, validated, popularity, source_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    mcp_id,
                    name,
                    description,
                    json.dumps(schema),
                    json.dumps(tags),
                    domain,
                    auto_validate,
                    0,
                    source_url
                ))
                conn.commit()
                conn.close()
                
                return {
                    "id": mcp_id,
                    "message": "MCP imported successfully from web",
                    "name": name,
                    "source_url": source_url,
                    "validated": auto_validate,
                    "domain": domain,
                    "tags": tags
                }
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

@app.post("/run-agent", response_model=AgentResponse)
async def run_agent(request: AgentRequest):
    """Execute a prompt using a user-defined MCP schema"""
    try:
        # Validate MCP schema
        if not request.mcp_schema.tools:
            raise HTTPException(status_code=400, detail="MCP schema must contain at least one tool")
        
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
        
        return result
        
    except Exception as e:
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
        
        return CompareResponse(
            results=results,
            total_latency_ms=total_latency,
            comparison_id=comparison_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Protocol comparison failed: {str(e)}")

@app.get("/mcps", response_model=List[MCPListItem])
async def get_mcps(
    domain: Optional[str] = Query(None, description="Filter by domain"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    validated: Optional[bool] = Query(None, description="Filter by validation status"),
    sort_by: str = Query("popularity", description="Sort by: popularity, name, created_at"),
    limit: int = Query(50, ge=1, le=100, description="Number of results to return")
):
    """Return a searchable, filterable list of open-source MCPs"""
    
    # Build query
    query = "SELECT * FROM mcps WHERE 1=1"
    params = []
    
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
            created_at=row[9] if len(row) > 9 else ""
        ))
    
    return mcps

@app.post("/mcp/import")
async def import_mcp(request: MCPImportRequest):
    """Upload/import new MCP and validate it"""
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
        
        # Validate MCP schema
        try:
            mcp_schema = MCPSchema(**schema_dict)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid MCP schema: {str(e)}")
        
        # Store in database
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO mcps (id, name, description, schema_content, tags, domain, validated, popularity, source_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            mcp_id,
            request.name,
            request.description,
            json.dumps(schema_dict),
            json.dumps(request.tags),
            request.domain,
            True,  # Auto-validate for now
            0,
            request.source_url
        ))
        conn.commit()
        conn.close()
        
        return {
            "id": mcp_id,
            "message": "MCP imported successfully",
            "validated": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
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
        "created_at": row[9] if len(row) > 9 else "",
        "updated_at": row[10] if len(row) > 10 else ""
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

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected" if os.path.exists(DATABASE_PATH) else "disconnected",
        "features": ["smart_mcp_explorer", "web_search", "auto_import"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)