#!/usr/bin/env python3
"""
Development server runner for MCP.playground backend with web scraping
"""

import uvicorn
import os
import sys
from pathlib import Path

def main():
    """Run the FastAPI development server"""
    
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("RELOAD", "true").lower() == "true"
    
    print(f"""
🚀 Starting MCP.playground Backend API with Web Scraping

📍 Server: http://{host}:{port}
📚 Docs: http://{host}:{port}/docs
🔍 Health: http://{host}:{port}/health

🔧 Configuration:
   - Host: {host}
   - Port: {port}
   - Reload: {reload}
   - Database: mcp_playground.db
   - Web Scraping: Enabled (BeautifulSoup4)

🌐 Scraping Features:
   - GitHub MCP discovery
   - General web search
   - Awesome lists parsing
   - Real-time content extraction

Press Ctrl+C to stop the server
""")
    
    try:
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            reload=reload,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()