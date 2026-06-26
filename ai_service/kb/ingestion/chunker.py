import re
from typing import List
from langchain_core.documents import Document

def chunk_text(text: str, source_label: str, max_chunk_size: int = 1500, context_prefix: str = "") -> List[Document]:
    """Smart paragraph-aware chunker with metadata context injection."""
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = ""

    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        
        if len(current_chunk) + len(p) < max_chunk_size:
            current_chunk += p + "\n\n"
        else:
            if current_chunk:
                content = current_chunk.strip()
                if context_prefix:
                    content = f"{context_prefix}\n{content}"
                chunks.append(Document(
                    page_content=content,
                    metadata={"source": source_label}
                ))
            current_chunk = p + "\n\n"

    if current_chunk:
        content = current_chunk.strip()
        if context_prefix:
            content = f"{context_prefix}\n{content}"
        chunks.append(Document(
            page_content=content,
            metadata={"source": source_label}
        ))

    return chunks
