# AI Service Development Prompt
**Service:** `/ai-service`  
**Stack:** Python 3.11 + FastAPI + LangGraph + LangChain Core + ChromaDB  
**Language:** Python

> Always read `00_MASTER_PROMPT.md` first for full project context.

---

## Your Role

You are a senior AI/ML engineer specialising in LangGraph multi-agent systems and RAG pipelines. You build production-quality Python AI services — clean module separation, typed FastAPI endpoints, stateful LangGraph agents with persistent memory, and robust RAG pipelines. You never use `langchain_community` — always direct library imports.

---

## Folder Structure

```
/ai-service
├── agents/
│   ├── __init__.py
│   ├── lead_agent/
│   │   ├── __init__.py
│   │   ├── graph.py          LangGraph graph definition
│   │   ├── state.py          TypedDict state
│   │   ├── nodes.py          All node functions
│   │   └── tools.py          @tool decorated functions
│   ├── conversation_agent/
│   │   ├── graph.py
│   │   ├── state.py
│   │   ├── nodes.py
│   │   └── tools.py
│   └── supervisor.py         Routes incoming message to right agent
├── kb/
│   ├── __init__.py
│   ├── embedder.py           PDF/doc → chunks → ChromaDB
│   ├── retriever.py          Query ChromaDB, return context
│   └── cleaner.py            Delete stale collections
├── schemas/
│   ├── __init__.py
│   ├── agent.py              Pydantic request/response models
│   └── kb.py
├── config/
│   ├── __init__.py
│   └── settings.py           Pydantic settings from .env
├── utils/
│   ├── __init__.py
│   ├── chunker.py            Text chunking strategies
│   └── prompts.py            System prompt templates
├── checkpointer.py           PostgresSaver setup
├── main.py                   FastAPI app
├── requirements.txt
└── .env
```

---

## Critical Import Rules

**NEVER use `langchain_community`.**

```python
# ✅ ALWAYS use these
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_mistralai import MistralAIEmbeddings
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.prebuilt import create_react_agent
import chromadb                           # direct chromadb import
from pypdf import PdfReader               # direct pypdf import

# ❌ NEVER use these
from langchain_community.llms import ...
from langchain_community.embeddings import ...
from langchain_community.vectorstores import ...
from langchain_community.document_loaders import ...
```

---

## LLM & Embeddings Setup

```python
# config/settings.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str
    mistral_api_key: str
    database_url: str
    chroma_persist_path: str = "./chroma_db"
    port: int = 8000

    class Config:
        env_file = ".env"

settings = Settings()
```

```python
# Shared LLM instances — initialise once, import everywhere
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_mistralai import MistralAIEmbeddings
from config.settings import settings

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.gemini_api_key,
    temperature=0.3
)

embeddings = MistralAIEmbeddings(
    model="mistral-embed",
    mistral_api_key=settings.mistral_api_key
)
```

---

## Lead Agent — Full Implementation

### State
```python
# agents/lead_agent/state.py
from typing import TypedDict, List, Annotated
import operator

class LeadState(TypedDict):
    # Identity
    lead_id:        str
    lead_name:      str
    lead_phone:     str
    business_id:    str
    kb_id:          str
    campaign_id:    str
    agent_tone:     str   # friendly | professional | hinglish
    language:       str   # en | hi | gu

    # Conversation — Annotated with operator.add so messages APPEND not overwrite
    messages:           Annotated[List[dict], operator.add]
    last_agent_message: str
    follow_up_count:    int

    # Intelligence
    qualification_score: int        # 0–4
    intent_signals:      List[str]
    stage:               str        # opener|nurturing|objection|qualified|cold|handoff
    company_context:     str        # retrieved from KB — injected per turn

    # Control
    human_handoff:  bool
    handoff_reason: str
    task_complete:  bool
```

### Tools
```python
# agents/lead_agent/tools.py
from langchain_core.tools import tool
from kb.retriever import retrieve_context
import json

@tool
def search_knowledge_base(query: str, kb_id: str) -> str:
    """Search the company's knowledge base for product info, pricing, FAQs, policies."""
    return retrieve_context(query=query, kb_id=kb_id, k=4)

@tool
def update_qualification_signal(signal: str, lead_id: str) -> str:
    """
    Record a qualification signal detected in the conversation.
    Signals: asked_price | mentioned_timeline | is_decision_maker | specific_interest | wants_human
    """
    # In production: update DB. For now return confirmation.
    return f"Signal '{signal}' recorded for lead {lead_id}"

@tool
def flag_human_handoff(lead_id: str, reason: str) -> str:
    """Escalate this lead to a human sales rep. Use when lead asks to speak to a person."""
    return json.dumps({"handoff": True, "reason": reason})

@tool
def get_available_slots(preference: str) -> str:
    """Get available calendar slots for demo or site visit. Call when lead asks to schedule."""
    # Calls Google Calendar API via backend
    return "Available slots: Monday 10am, Tuesday 2pm, Wednesday 11am"

@tool
def book_appointment(lead_name: str, phone: str, slot: str) -> str:
    """Book a confirmed appointment slot."""
    return f"Appointment confirmed for {lead_name} on {slot}. Confirmation will be sent."
```

### Nodes
```python
# agents/lead_agent/nodes.py
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from .state import LeadState
from .tools import search_knowledge_base, flag_human_handoff, get_available_slots, book_appointment
from config.settings import settings
from utils.prompts import build_lead_system_prompt
import json

# LLM with tools bound
from langchain_google_genai import ChatGoogleGenerativeAI
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash",
                              google_api_key=settings.gemini_api_key,
                              temperature=0.3)

tools = [search_knowledge_base, flag_human_handoff, get_available_slots, book_appointment]
llm_with_tools = llm.bind_tools(tools)


def conversation_node(state: LeadState) -> dict:
    """Core node — generates agent reply using conversation history + KB context."""

    system_prompt = build_lead_system_prompt(
        tone=state["agent_tone"],
        language=state["language"],
        company_context=state.get("company_context", ""),
        qualification_score=state["qualification_score"],
        stage=state["stage"]
    )

    lc_messages = [SystemMessage(content=system_prompt)]
    for msg in state["messages"]:
        if msg["role"] == "lead":
            lc_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "agent":
            lc_messages.append(AIMessage(content=msg["content"]))

    response = llm_with_tools.invoke(lc_messages)
    reply = response.content

    return {
        "messages": [{"role": "agent", "content": reply}],
        "last_agent_message": reply
    }


def qualify_node(state: LeadState) -> dict:
    """Silently analyses conversation and updates qualification score."""

    conversation_text = "\n".join([
        f"{m['role'].upper()}: {m['content']}"
        for m in state["messages"][-10:]  # last 10 messages only
    ])

    analysis_prompt = f"""
Analyse this sales conversation and return ONLY a JSON object with:
{{
  "budget_confirmed": true/false,
  "timeline_mentioned": true/false,
  "is_decision_maker": true/false,
  "specific_interest": true/false,
  "wants_human": true/false,
  "detected_stage": "opener|nurturing|objection|qualified|cold"
}}

Conversation:
{conversation_text}

Return ONLY valid JSON. No explanation.
"""
    from langchain_google_genai import ChatGoogleGenerativeAI
    analysis_llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash",
                                           google_api_key=settings.gemini_api_key,
                                           temperature=0)
    response = analysis_llm.invoke([HumanMessage(content=analysis_prompt)])

    try:
        signals = json.loads(response.content)
    except Exception:
        signals = {}

    score = sum([
        signals.get("budget_confirmed", False),
        signals.get("timeline_mentioned", False),
        signals.get("is_decision_maker", False),
        signals.get("specific_interest", False),
    ])

    intent_signals = [k for k, v in signals.items() if v is True and k != "wants_human"]
    needs_handoff = signals.get("wants_human", False) or score >= 3
    new_stage = "qualified" if score >= 3 else signals.get("detected_stage", state["stage"])

    return {
        "qualification_score": score,
        "intent_signals": intent_signals,
        "human_handoff": needs_handoff,
        "stage": new_stage,
        "handoff_reason": "Lead requested human" if signals.get("wants_human") else (
                          "Qualification threshold reached" if score >= 3 else "")
    }


def escalation_node(state: LeadState) -> dict:
    """Fires when lead is qualified or requests human. Sends farewell, marks complete."""
    farewell = (
        f"Great chatting with you, {state['lead_name']}! "
        f"One of our team members will reach out to you shortly. "
        f"Have a great day! 🙏"
    )
    return {
        "messages": [{"role": "agent", "content": farewell}],
        "last_agent_message": farewell,
        "stage": "handoff",
        "task_complete": True
    }
```

### Graph
```python
# agents/lead_agent/graph.py
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres import PostgresSaver
from .state import LeadState
from .nodes import conversation_node, qualify_node, escalation_node
from checkpointer import get_checkpointer


def route_after_qualify(state: LeadState) -> str:
    if state.get("human_handoff") or state.get("stage") == "qualified":
        return "escalate"
    return "end"


def build_lead_graph(checkpointer=None):
    graph = StateGraph(LeadState)

    graph.add_node("conversation", conversation_node)
    graph.add_node("qualify",      qualify_node)
    graph.add_node("escalation",   escalation_node)

    graph.set_entry_point("conversation")
    graph.add_edge("conversation", "qualify")
    graph.add_conditional_edges("qualify", route_after_qualify, {
        "escalate": "escalation",
        "end":      END
    })
    graph.add_edge("escalation", END)

    cp = checkpointer or get_checkpointer()
    return graph.compile(checkpointer=cp)
```

---

## PostgresSaver Checkpointing

```python
# checkpointer.py
from langgraph.checkpoint.postgres import PostgresSaver
from config.settings import settings

_checkpointer = None

def get_checkpointer():
    global _checkpointer
    if _checkpointer is None:
        _checkpointer = PostgresSaver.from_conn_string(settings.database_url)
        _checkpointer.setup()  # creates checkpoint tables if not exist
    return _checkpointer
```

---

## Knowledge Base Pipeline

```python
# kb/embedder.py
import chromadb
import uuid
from pypdf import PdfReader
from langchain_mistralai import MistralAIEmbeddings
from config.settings import settings
from utils.chunker import chunk_text

embeddings_model = MistralAIEmbeddings(
    model="mistral-embed",
    mistral_api_key=settings.mistral_api_key
)

chroma_client = chromadb.PersistentClient(path=settings.chroma_persist_path)


def embed_pdf(file_path: str, kb_id: str) -> dict:
    """Extract text from PDF, chunk it, embed, store in ChromaDB."""

    # 1. Extract text
    reader = PdfReader(file_path)
    full_text = "\n".join(page.extract_text() or "" for page in reader.pages)

    # 2. Chunk
    chunks = chunk_text(full_text, chunk_size=500, overlap=50)

    # 3. UUID-based collection name — NEVER reuse old collection name
    collection_name = f"kb_{kb_id.replace('-', '_')}"

    # 4. Delete old collection if exists (re-upload scenario)
    try:
        chroma_client.delete_collection(collection_name)
    except Exception:
        pass

    # 5. Create fresh collection
    collection = chroma_client.create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"}
    )

    # 6. Embed in batches of 50
    batch_size = 50
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        vectors = embeddings_model.embed_documents(batch)
        collection.add(
            ids=[f"{kb_id}_{i + j}" for j in range(len(batch))],
            embeddings=vectors,
            documents=batch,
            metadatas=[{"kb_id": kb_id, "chunk_index": i + j} for j in range(len(batch))]
        )

    return {"collection_name": collection_name, "chunk_count": len(chunks)}
```

```python
# kb/retriever.py
import chromadb
from langchain_mistralai import MistralAIEmbeddings
from config.settings import settings

embeddings_model = MistralAIEmbeddings(
    model="mistral-embed",
    mistral_api_key=settings.mistral_api_key
)
chroma_client = chromadb.PersistentClient(path=settings.chroma_persist_path)


def retrieve_context(query: str, kb_id: str, k: int = 4) -> str:
    collection_name = f"kb_{kb_id.replace('-', '_')}"
    try:
        collection = chroma_client.get_collection(collection_name)
    except Exception:
        return "No knowledge base found for this business."

    query_vector = embeddings_model.embed_query(query)
    results = collection.query(query_embeddings=[query_vector], n_results=k)

    if not results["documents"][0]:
        return "No relevant information found."

    return "\n\n".join(results["documents"][0])
```

```python
# utils/chunker.py
def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk.strip())
    return chunks
```

---

## System Prompt Templates

```python
# utils/prompts.py
def build_lead_system_prompt(tone, language, company_context, qualification_score, stage):
    tone_instructions = {
        "friendly":     "Be warm, conversational, and approachable. Use casual language.",
        "professional": "Be polite, formal, and precise. Maintain professional tone.",
        "hinglish":     "Mix Hindi and English naturally as Indian businesses do. Friendly but professional."
    }

    return f"""You are a sales assistant for this company:

{company_context}

TONE: {tone_instructions.get(tone, tone_instructions['friendly'])}
LANGUAGE: Respond in {language}. Match the language the lead uses.

YOUR GOALS:
- Answer questions naturally and helpfully
- Gather qualification info subtly: budget, timeline, decision authority, specific interest
- Handle objections gracefully
- Never be pushy or salesy
- If you don't know something, say "Let me check on that for you"
- If the lead wants to speak to a human, acknowledge warmly and use the flag_human_handoff tool

CURRENT STATUS:
- Qualification score: {qualification_score}/4
- Conversation stage: {stage}

TOOLS AVAILABLE:
- search_knowledge_base: use for any product, pricing, or policy questions
- flag_human_handoff: use when lead explicitly asks for a human
- get_available_slots: use when lead asks to schedule a meeting/visit
- book_appointment: use after lead confirms a slot

Keep responses concise — under 3 sentences unless the lead asks for detail.
Never mention you are an AI unless directly asked."""
```

---

## FastAPI Endpoints

```python
# main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from agents.lead_agent.graph import build_lead_graph
from agents.conversation_agent.graph import build_conversation_graph
from kb.embedder import embed_pdf
from kb.cleaner import delete_collection
from schemas.agent import AgentMessageRequest, AgentMessageResponse
from schemas.kb import EmbedRequest, EmbedResponse
import tempfile, os

app = FastAPI(title="AI Operations Platform — Agent Service")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3001"],
                   allow_methods=["*"], allow_headers=["*"])

lead_agent = build_lead_graph()
conversation_agent = build_conversation_graph()


@app.post("/agent/message", response_model=AgentMessageResponse)
async def handle_message(payload: AgentMessageRequest):
    config = {"configurable": {"thread_id": payload.thread_id}}

    # Determine which agent based on campaign type
    agent = lead_agent if payload.campaign_config.get("type") == "lead" else conversation_agent

    input_state = {
        "lead_id":      payload.lead_id,
        "lead_name":    payload.lead_name,
        "lead_phone":   payload.thread_id,
        "business_id":  payload.business_id,
        "kb_id":        payload.kb_id,
        "campaign_id":  payload.campaign_id,
        "agent_tone":   payload.campaign_config.get("agent_tone", "friendly"),
        "language":     payload.campaign_config.get("language", "en"),
        "messages":     [{"role": "lead", "content": payload.message}],
        "qualification_score": 0,
        "intent_signals": [],
        "stage":        "opener",
        "human_handoff": False,
        "task_complete": False,
        "last_agent_message": "",
        "company_context": "",
        "follow_up_count": 0,
        "handoff_reason": ""
    }

    result = agent.invoke(input_state, config=config)

    return AgentMessageResponse(
        reply=result["last_agent_message"],
        stage=result["stage"],
        qualification_score=result["qualification_score"],
        needs_human=result["human_handoff"],
        intent_signals=result["intent_signals"]
    )


@app.post("/kb/embed", response_model=EmbedResponse)
async def embed_document(file: UploadFile = File(...), kb_id: str = ""):
    if not kb_id:
        raise HTTPException(status_code=400, detail="kb_id is required")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        result = embed_pdf(tmp_path, kb_id)
        return EmbedResponse(success=True, **result)
    finally:
        os.unlink(tmp_path)


@app.delete("/kb/{kb_id}")
async def delete_kb(kb_id: str):
    delete_collection(kb_id)
    return {"success": True}


@app.get("/agent/state/{thread_id}")
async def get_state(thread_id: str):
    config = {"configurable": {"thread_id": thread_id}}
    state = lead_agent.get_state(config)
    return {"state": state.values if state else None}


@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

## Pydantic Schemas

```python
# schemas/agent.py
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
```

---

## Requirements

```txt
# requirements.txt
fastapi
uvicorn[standard]
python-dotenv
pydantic-settings

# LangChain — direct imports only, never langchain_community
langchain-core
langchain-google-genai
langchain-mistralai
langgraph
langgraph-checkpoint-postgres

# Vector DB & embeddings
chromadb
pypdf

# Utilities
psycopg2-binary
python-multipart
```

---

## Running the Service

```bash
cd ai-service
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```