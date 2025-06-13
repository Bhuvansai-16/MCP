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
    created_at: str

# Mock tool implementations
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
            "/mcp/import",
            "/mcp/{id}",
            "/share",
            "/export/csv",
            "/tools/weather",
            "/tools/search",
            "/tools/calc"
        ]
    }

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
            created_at=row[8] or ""
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
            INSERT INTO mcps (id, name, description, schema_content, tags, domain, validated, popularity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            mcp_id,
            request.name,
            request.description,
            json.dumps(schema_dict),
            json.dumps(request.tags),
            request.domain,
            True,  # Auto-validate for now
            0
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
        "created_at": row[8],
        "updated_at": row[9]
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
        "database": "connected" if os.path.exists(DATABASE_PATH) else "disconnected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)