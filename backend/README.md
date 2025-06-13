# MCP.playground Backend API

A FastAPI backend for the Model Context Protocol playground application.

## Features

- **Agent Execution**: Run LLM agents with custom MCP schemas
- **Protocol Comparison**: Benchmark different LLM processing strategies
- **MCP Management**: Import, validate, and store MCP schemas
- **Tool Simulation**: Mock implementations of common tools (weather, search, calculator)
- **Data Export**: CSV export of comparison results
- **Sharing**: Generate shareable links for results

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the Server

```bash
python main.py
```

Or with uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Access the API

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Root Endpoint**: http://localhost:8000/

## API Endpoints

### Core Functionality

#### `POST /run-agent`
Execute a prompt using a user-defined MCP schema.

**Request:**
```json
{
  "prompt": "What's the weather in Paris?",
  "document": "Optional context document...",
  "mcp_schema": {
    "name": "weather-agent",
    "version": "1.0.0",
    "tools": [
      {
        "name": "get_weather",
        "description": "Get current weather",
        "parameters": {
          "location": "string",
          "units": "string"
        }
      }
    ]
  }
}
```

**Response:**
```json
{
  "output": "Agent response text...",
  "tool_calls": [
    {
      "tool": "get_weather",
      "input": {"location": "Paris", "units": "metric"},
      "output": {"temperature": 22, "condition": "Sunny"},
      "latency_ms": 200,
      "tokens_used": 50
    }
  ],
  "tokens_used": 150,
  "latency_ms": 800,
  "model_used": "gpt-4",
  "session_id": "uuid-here"
}
```

#### `POST /compare-protocols`
Benchmark multiple LLM processing protocols.

**Request:**
```json
{
  "prompt": "Analyze this document",
  "document": "Document content...",
  "protocols": ["raw", "chain", "tree", "rag"]
}
```

**Response:**
```json
{
  "results": [
    {
      "protocol": "raw",
      "response": "Analysis result...",
      "latency_ms": 500,
      "tokens_used": 200,
      "quality_score": 0.85
    }
  ],
  "total_latency_ms": 2000,
  "comparison_id": "uuid-here"
}
```

### MCP Management

#### `GET /mcps`
List available MCPs with filtering and sorting.

**Query Parameters:**
- `domain`: Filter by domain (e.g., "weather", "search")
- `tags`: Comma-separated tags to filter by
- `validated`: Filter by validation status (true/false)
- `sort_by`: Sort by "popularity", "name", or "created_at"
- `limit`: Number of results (1-100, default 50)

#### `POST /mcp/import`
Import a new MCP schema.

**Request:**
```json
{
  "name": "Weather MCP",
  "description": "Weather data tools",
  "schema_content": "{\"name\": \"weather\", \"tools\": [...]}",
  "tags": ["weather", "api"],
  "domain": "weather"
}
```

#### `GET /mcp/{id}`
Get detailed information about a specific MCP.

### Utility Endpoints

#### `POST /share`
Generate a shareable link for results.

#### `GET /export/csv?comparison_id={id}`
Export comparison results as CSV.

### Tool Simulation

#### `GET /tools/weather?location=Paris&units=metric`
Mock weather API.

#### `GET /tools/search?query=python&limit=5`
Mock search API.

#### `GET /tools/calc?expression=2+2`
Mock calculator API.

## Database Schema

The backend uses SQLite with the following tables:

### `mcps`
- `id`: Unique identifier
- `name`: MCP name
- `description`: Description
- `schema_content`: JSON schema
- `tags`: JSON array of tags
- `domain`: Category
- `validated`: Boolean validation status
- `popularity`: Usage count
- `created_at`, `updated_at`: Timestamps

### `sessions`
- `id`: Session identifier
- `prompt`: User prompt
- `document`: Optional document
- `mcp_schema`: Used MCP schema
- `results`: Execution results
- `created_at`: Timestamp

### `comparisons`
- `id`: Comparison identifier
- `prompt`: User prompt
- `document`: Optional document
- `protocols`: List of protocols used
- `results`: Comparison results
- `created_at`: Timestamp

## Configuration

### Environment Variables

- `DATABASE_PATH`: SQLite database file path (default: "mcp_playground.db")
- `HOST`: Server host (default: "0.0.0.0")
- `PORT`: Server port (default: 8000)

### CORS

The API is configured to allow all origins for development. In production, update the CORS settings in `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

## Development

### Adding New Tools

To add a new mock tool:

1. Create a function in `main.py`:
```python
async def mock_new_tool(param1: str, param2: int) -> Dict[str, Any]:
    # Implementation
    return {"result": "mock data"}
```

2. Add it to the `execute_tool` function:
```python
elif "newtool" in tool_name.lower():
    return await mock_new_tool(parameters.get("param1"), parameters.get("param2"))
```

3. Add an endpoint:
```python
@app.get("/tools/newtool")
async def new_tool_endpoint(param1: str, param2: int = 0):
    return await mock_new_tool(param1, param2)
```

### Adding New Protocols

To add a new comparison protocol:

1. Add it to the `protocol_configs` in `compare_protocols`:
```python
"new_protocol": {"base_latency": 600, "token_multiplier": 1.0, "quality_base": 0.80}
```

2. Update the validator in `CompareRequest`:
```python
valid_protocols = ['raw', 'chain', 'tree', 'rag', 'custom', 'new_protocol']
```

## Production Deployment

### Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Using Gunicorn

```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Testing

The API includes comprehensive error handling and validation. Test the endpoints using:

- **Interactive Docs**: http://localhost:8000/docs
- **curl**: `curl -X POST http://localhost:8000/run-agent -H "Content-Type: application/json" -d @test_request.json`
- **Python requests**: See the interactive documentation for examples

## Security Notes

- Input validation using Pydantic models
- SQL injection protection with parameterized queries
- File upload size limits
- Rate limiting should be added for production use
- Authentication/authorization should be implemented for production

## License

MIT License - see LICENSE file for details.