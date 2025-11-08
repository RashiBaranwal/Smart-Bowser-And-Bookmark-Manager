#!/usr/bin/env python3
"""Simple ChromaDB Server"""

print("Starting ChromaDB Server on http://localhost:8000...")
print("Press Ctrl+C to stop")
print("-" * 50)

try:
    import uvicorn
    from chromadb.app import app

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
except ImportError as e:
    print(f"\nError: {e}")
    print("\nTrying alternative method...")
    try:
        from chromadb.server.fastapi import app
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    except Exception as e2:
        print(f"\nError: {e2}")
        print("\n" + "=" * 50)
        print("ChromaDB server couldn't start.")
        print("Try using Docker instead:")
        print("  docker run -p 8000:8000 chromadb/chroma")
        print("=" * 50)
