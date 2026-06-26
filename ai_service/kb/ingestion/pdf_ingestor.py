import os
from pypdf import PdfReader
from langchain_chroma import Chroma
from langchain_mistralai import MistralAIEmbeddings
from kb.ingestion.chunker import chunk_text
from config.settings import settings

def get_chroma_db(kb_id: str) -> Chroma:
    embeddings = MistralAIEmbeddings(
        api_key=settings.mistral_api_key,
        model="mistral-embed"
    )
    # Chroma requires a safe collection name
    safe_kb_id = f"kb_{kb_id.replace('-', '_')}"
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "chroma_db"))
    return Chroma(
        collection_name=safe_kb_id,
        embedding_function=embeddings,
        persist_directory=db_path
    )

def ingest_pdf(file_path: str, kb_id: str, source_label: str = "brochure", description: str = None):
    """Extracts text from PDF, chunks it, and embeds via Mistral -> ChromaDB."""
    import os
    reader = PdfReader(file_path)
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() + "\n\n"

    # Extract dynamic context from filename or description
    filename = os.path.basename(file_path)
    clean_name = os.path.splitext(filename)[0].replace("_", " ").replace("-", " ")
    context_desc = description.strip() if description else clean_name
    context_prefix = f"Project/Document Context: {context_desc}"

    chunks = chunk_text(full_text, source_label, context_prefix=context_prefix)
    
    if not chunks:
        return {"collection_name": f"kb_{kb_id.replace('-', '_')}", "chunk_count": 0}

    vectorstore = get_chroma_db(kb_id)
    vectorstore.add_documents(chunks)

    return {"collection_name": f"kb_{kb_id.replace('-', '_')}", "chunk_count": len(chunks)}
