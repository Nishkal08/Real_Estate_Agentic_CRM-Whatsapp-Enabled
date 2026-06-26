from typing import TypedDict, Annotated, List, Dict, Any
import operator

class AgentState(TypedDict):
    # Context
    lead_id: str
    lead_name: str
    lead_phone: str
    business_id: str
    kb_id: str
    agent_name: str
    agent_tone: str
    language: str
    
    # Core Chat History
    messages: Annotated[List[dict], operator.add]
    
    # Memory & Context
    conversation_summary: str
    last_summary_at: int
    last_agent_message: str
    
    # Payload Deliverables
    images_to_send: List[Any]
    brochure_url: str | None
    
    # State tracking
    qualification_score: int
    intent_signals: List[str]
    stage: str
    sentiment: str
    confidence: float
    
    # Flow Control
    out_of_scope_count: int
    human_handoff: bool
    handoff_reason: str
    task_complete: bool
