from langchain_chroma import Chroma
import chromadb
import os

def delete_collection(kb_id: str):
    """Deletes an entire collection from ChromaDB."""
    safe_kb_id = f"kb_{kb_id.replace('-', '_')}"
    try:
        db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "chroma_db"))
        client = chromadb.PersistentClient(path=db_path)
        client.delete_collection(safe_kb_id)
    except Exception as e:
        print(f"Error deleting collection: {e}")
