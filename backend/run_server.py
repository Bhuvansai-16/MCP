#!/usr/bin/env python3
"""
Development server runner for MCP.playground backend
"""

import uvicorn
import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Import and populate sample data
try:
    from sample_mcps import populate_sample_data
    populate_sample_data()
    print("✅ Sample MCP data populated")
except Exception as e:
    print(f"⚠️  Warning: Could not populate sample data: {e}")

def main():
    """Run the FastAPI development server"""
    
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("RELOAD", "true").lower() == "true"
    
    print(f"""
🚀 Starting MCP.playground Backend API

📍 Server: http://{host}:{port}
📚 Docs: http://{host}:{port}/docs
🔍 Health: http://{host}:{port}/health

🔧 Configuration:
   - Host: {host}
   - Port: {port}
   - Reload: {reload}
   - Database: mcp_playground.db

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