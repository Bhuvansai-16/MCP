# MCP.playground

A comprehensive platform for testing and comparing different Model Context Protocol (MCP) implementations with real-time metrics and analytics.

## 🚀 Features

### Frontend
- **Modern React UI** with TypeScript and Tailwind CSS
- **Three-Tab Navigation System**:
  - 🔍 **Compare MCPs** – Benchmark multiple LLM protocols side-by-side
  - 🧪 **Playground** – Interactive agent chat with MCP editor
  - 🌎 **Explore MCPs** – Searchable grid of open-source MCPs
- **Dark/Light Mode** with system preference detection
- **Interactive Protocol Selection** with detailed descriptions
- **Real-time Progress Tracking** during protocol execution
- **Interactive Charts** using Chart.js for metrics visualization
- **Export Functionality** (CSV, JSON, shareable links)
- **Responsive Design** for all device sizes

### Backend (FastAPI)
- **Agent Execution** with custom MCP schemas
- **Protocol Comparison** with multiple strategies
- **MCP Management** (import, validate, store)
- **Tool Simulation** (weather, search, calculator)
- **Data Export** and sharing capabilities
- **SQLite Database** for persistence
- **Comprehensive API** with automatic documentation

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- Chart.js for data visualization
- Monaco Editor for code editing
- React Tabs for tabbed interface

### Backend
- Python + FastAPI
- Pydantic for data validation
- SQLite for data persistence
- Uvicorn ASGI server
- CORS enabled for frontend integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- npm or yarn

### Installation

1. **Clone and install frontend dependencies**:
```bash
git clone <repository-url>
cd mcp-playground
npm install
```

2. **Install backend dependencies**:
```bash
npm run backend:install
# or manually:
cd backend
pip install -r requirements.txt
```

3. **Populate sample data**:
```bash
npm run backend:populate
```

4. **Start both frontend and backend**:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Alternative: Start Services Separately

**Frontend only**:
```bash
npm run dev:client
```

**Backend only**:
```bash
npm run dev:server
# or
cd backend && python run_server.py
```

## 📡 API Endpoints

### Core Functionality

#### `POST /run-agent`
Execute a prompt using a user-defined MCP schema.

#### `POST /compare-protocols`
Benchmark multiple LLM processing protocols.

#### `GET /mcps`
List available MCPs with filtering and sorting.

#### `POST /mcp/import`
Import and validate new MCP schemas.

#### `GET /mcp/{id}`
Get detailed MCP information.

### Utility Endpoints

#### `POST /share`
Generate shareable links for results.

#### `GET /export/csv`
Export comparison results as CSV.

#### Tool Simulation
- `GET /tools/weather` - Mock weather API
- `GET /tools/search` - Mock search API  
- `GET /tools/calc` - Mock calculator API

## 🧪 Protocol Strategies

### 1. Raw Processing
- **Description**: Single pass with full context
- **Best for**: Small documents, high accuracy requirements
- **Parameters**: `max_tokens`, `temperature`

### 2. Chain Processing
- **Description**: Sequential chunk processing with context flow
- **Best for**: Large documents, detailed analysis
- **Parameters**: `chunk_size`, `overlap`, `max_tokens`

### 3. Tree Processing
- **Description**: Parallel branching with multiple perspectives
- **Best for**: Complex documents, comprehensive analysis
- **Parameters**: `branch_factor`, `max_depth`, `aggregation_method`

### 4. RAG Processing
- **Description**: Retrieval-augmented generation with vector search
- **Best for**: Large knowledge bases, specific queries
- **Parameters**: `top_k`, `similarity_threshold`, `embedding_model`

## 🎮 Usage Guide

### Compare MCPs Tab
1. Enter your analysis prompt
2. Provide a test document
3. Select protocols to compare (Raw, Chain, Tree, RAG)
4. Click "Run Comparison"
5. View side-by-side results with metrics

### Playground Tab
1. **Left Panel**: Write or import MCP schema (JSON/YAML)
2. **Right Panel**: Chat with the agent using natural language
3. Click "Start Agent" when MCP is valid
4. Ask questions that utilize the MCP tools
5. View execution logs and tool calls

### Explore MCPs Tab
1. Browse the searchable grid of MCPs
2. Filter by domain, tags, or validation status
3. Click "Try in Playground" to test an MCP
4. Click "Compare" to add to comparison

## 📊 Metrics & Analytics

The platform tracks comprehensive metrics:

- **Performance**: Latency, token usage, throughput
- **Quality Scores**: AI-evaluated response quality (1-10 scale)
- **Protocol Comparison**: Side-by-side performance analysis
- **Tool Execution**: Individual tool call metrics

## 🔧 Configuration

### Environment Variables

**Frontend** (optional):
```env
VITE_BACKEND_URL=http://localhost:8000
```

**Backend**:
```env
HOST=0.0.0.0
PORT=8000
DATABASE_PATH=mcp_playground.db
RELOAD=true
```

### Database

The backend uses SQLite with automatic schema creation. Sample data includes:
- Weather forecasting MCP
- Web search MCP
- Math calculator MCP
- E-commerce MCP
- Calendar management MCP
- Social media MCP

## 🚀 Deployment

### Frontend (Vite Build)
```bash
npm run build
# Deploy the 'dist' folder to your hosting service
```

### Backend (Production)
```bash
cd backend
pip install -r requirements.txt
python main.py
# or with gunicorn:
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker Deployment
```dockerfile
# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **Frontend**: Follow React best practices, use TypeScript
- **Backend**: Follow FastAPI conventions, add proper validation
- **Testing**: Test both API endpoints and UI components
- **Documentation**: Update README and API docs for new features

## 📝 API Documentation

When the backend is running, visit:
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🐛 Troubleshooting

### Common Issues

1. **Backend not starting**: Check Python version and dependencies
2. **Frontend can't connect**: Verify backend URL in browser console
3. **Database errors**: Delete `mcp_playground.db` and restart
4. **CORS issues**: Check backend CORS configuration

### Debug Mode

Enable debug logging:
```bash
cd backend
python -c "import logging; logging.basicConfig(level=logging.DEBUG)"
python main.py
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the specification
- FastAPI for the excellent Python web framework
- React and the frontend ecosystem for powerful UI tools
- The open-source community for excellent tools and libraries

---

**Happy MCP Testing! 🚀**