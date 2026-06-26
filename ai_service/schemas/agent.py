from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class AgentMessageRequest(BaseModel):
    thread_id:       str
    business_id:     str
    lead_id:         str
    lead_name:       str
    message:         str
    kb_id:           Optional[str] = None
    campaign_id:     Optional[str] = None
    campaign_config: Dict[str, Any] = {}
    
class AgentMessageResponse(BaseModel):
    reply:               str
    stage:               str
    qualification_score: int
    needs_human:         bool
    intent_signals:      List[str]
    images_to_send:      List[Any]
    brochure_url:        Optional[str]
