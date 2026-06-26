import os
import sys
# Insert path to allow imports from root of ai_service
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from kb.ingestion.pdf_ingestor import get_chroma_db

def inspect_chroma():
    try:
        vectorstore = get_chroma_db("main-kb")
        collection = vectorstore._collection
        data = collection.get(include=["metadatas", "documents"])
        
        print(f"Total documents/chunks in Chroma 'main-kb': {len(data.get('documents', []))}")
        
        sources = set()
        for meta in data.get("metadatas", []):
            if meta and "source" in meta:
                sources.add(meta["source"])
                
        print("\nIngested Sources:")
        for s in sources:
            print(f" - {s}")
            
        print("\nSample chunks:")
        for i, (doc, meta) in enumerate(zip(data.get("documents", [])[:5], data.get("metadatas", [])[:5])):
            print(f"\nChunk {i+1} (Source: {meta.get('source')}):")
            print(doc[:300] + "...")
            
    except Exception as e:
        print(f"Error inspecting Chroma DB: {e}")

if __name__ == "__main__":
    inspect_chroma()
