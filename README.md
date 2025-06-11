# Model Context Protocol Playground

A comprehensive platform for testing and comparing different Model Context Protocol (MCP) implementations with real-time metrics and analytics.

## 🚀 Features

### Frontend
- **Modern React UI** with TypeScript and Tailwind CSS
- **Dark/Light Mode** with system preference detection
- **Interactive Protocol Selection** with detailed descriptions
- **Real-time Progress Tracking** during protocol execution
- **Tabbed Results View** with side-by-side comparison
- **Interactive Charts** using Chart.js for metrics visualization
- **Export Functionality** (CSV, JSON, shareable links)
- **Responsive Design** for all device sizes

### Backend
- **Four MCP Strategies**:
  - **Raw**: Single pass with full context
  - **Chain**: Sequential chunk processing
  - **Tree**: Parallel branching with aggregation
  - **RAG**: Retrieval-augmented generation
- **Vector Store Integration** with Pinecone
- **PostgreSQL Database** for session storage
- **Redis Caching** for performance optimization
- **MCP Server Integration** with reference implementations
- **Quality Scoring** using GPT evaluation
- **Comprehensive Metrics** tracking and analytics

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS for styling
- Chart.js for data visualization
- React Tabs for tabbed interface
- React Toastify for notifications
- File Saver for exports

### Backend
- Node.js + Express + TypeScript
- PostgreSQL for data persistence
- Redis for caching
- Pinecone for vector storage
- OpenAI API for LLM calls and embeddings
- MCP reference servers integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Pinecone account
- OpenAI API key

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd mcp-playground
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up the database**:
```bash
npm run db:setup
```

4. **Start the development servers**:
```bash
npm run dev
```

This will start both the frontend (port 5173) and backend (port 3001) concurrently.

## 🔧 Configuration

### Environment Variables

```env
# Database Configuration
POSTGRES_URL=postgresql://username:password@localhost:5432/mcp_playground
REDIS_URL=redis://localhost:6379

# Vector Store Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENV=your_pinecone_environment_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
```

### Database Setup

The application uses PostgreSQL for storing sessions and metrics. Run the setup script to create the necessary tables:

```bash
npm run db:setup
```

### Pinecone Setup

1. Create a Pinecone account at [pinecone.io](https://pinecone.io)
2. Create a new index named `mcp-playground`
3. Use dimension 1536 (for OpenAI text-embedding-3-small)
4. Add your API key and environment to `.env`

## 📡 API Endpoints

### Core Endpoints
- `POST /api/run` - Execute protocols with prompt and document
- `GET /api/session/:sessionId` - Retrieve session results
- `GET /api/protocols/info` - Get available protocols and parameters
- `GET /api/metrics/summary` - Get aggregated metrics

### MCP Integration
- `GET /api/mcp/status` - Check MCP server status
- `POST /api/mcp/connect/:serverName` - Connect to MCP server
- `GET /api/mcp/:serverName/tools` - List available tools

### Health & Monitoring
- `GET /health` - Health check endpoint
- `GET /` - API information and available endpoints

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

## 📊 Metrics & Analytics

The platform tracks comprehensive metrics for each protocol execution:

- **Performance Metrics**: Latency, token usage, throughput
- **Quality Scores**: GPT-evaluated response quality (1-10 scale)
- **Protocol Comparison**: Side-by-side performance analysis
- **Historical Trends**: Time-series data for optimization

## 🔌 MCP Server Integration

The backend integrates with official MCP reference servers:

- **Filesystem Server**: File operations and document handling
- **Fetch Server**: URL content retrieval
- **Memory Server**: Persistent information storage
- **Sequential Thinking Server**: Chain-of-thought processing

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run server
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure production database URLs
- Set up SSL certificates for HTTPS
- Configure proper CORS origins

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the specification
- OpenAI for GPT and embedding models
- Pinecone for vector database services
- The open-source community for excellent tools and libraries