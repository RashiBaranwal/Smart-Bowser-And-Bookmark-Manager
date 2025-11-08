#!/usr/bin/env python3
"""
ChromaDB Server Startup Script
Run this to start ChromaDB on localhost:8000
"""

import chromadb
from chromadb.config import Settings

def start_server():
    print("=" * 60)
    print("  Starting ChromaDB Server")
    print("=" * 60)
    print()
    print("Server URL: http://localhost:8000")
    print("Press Ctrl+C to stop the server")
    print()
    print("=" * 60)

    # Start ChromaDB server
    try:
        chromadb.server.fastapi.run(
            host="localhost",
            port=8000,
            log_config=None
        )
    except AttributeError:
        # For newer versions, try alternative approach
        print("\nUsing alternative server startup method...")
        import uvicorn
        from chromadb.server.fastapi import app

        uvicorn.run(
            app,
            host="localhost",
            port=8000,
            log_level="info"
        )

if __name__ == "__main__":
    try:
        start_server()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
    except Exception as e:
        print(f"\nError starting server: {e}")
        print("\nTry using Docker instead:")
        print("  docker run -p 8000:8000 chromadb/chroma")
