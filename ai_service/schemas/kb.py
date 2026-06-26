from pydantic import BaseModel
from typing import Optional

class EmbedRequest(BaseModel):
    kb_id: str
    
class UrlEmbedRequest(BaseModel):
    url: str
    kb_id: str

class EmbedResponse(BaseModel):
    success: bool
    collection_name: str
    chunk_count: int
    error: Optional[str] = None
