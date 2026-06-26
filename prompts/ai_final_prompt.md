# AI Service — Complete Rebuild Prompt (Version 3.0)
**Role:** Senior GenAI Engineer + Backend Developer  
**Task:** Tear down v1/v2 ai_service completely. Build fresh from scratch.  
**Domain:** Real estate agent for Dobariya & Reneev developer groups  
**Date:** June 2026

> Read every section before writing a single line of code.
> This is a ground-up rebuild — do NOT reuse v1/v2 patterns unless explicitly stated.

---

## What You Are Building

A single intelligent WhatsApp AI agent that:
- Initiates outbound conversations with leads (from Excel uploads)
- Responds to inbound queries about Dobariya & Reneev real estate projects
- Answers from a structured knowledge base built from brochures, web pages, PDFs
- Falls back to live web search when KB has no answer
- Sends text + brochure links + relevant web images in WhatsApp messages
- Streams responses token-by-token to the frontend via SSE
- Handles out-of-scope questions gracefully without breaking character
- NEVER provides wrong or fabricated information

---

## Folder Structure — Build Exactly This

```
/ai-service
├── agents/
│   ├── __init__.py
│   ├── state.py                  LangGraph state definition
│   ├── graph.py                  Main agent graph
│   ├── nodes.py                  All node functions
│   └── tools.py                  All @tool functions
├── kb/
│   ├── __init__.py
│   ├── ingestion/
│   │   ├── __init__.py
│   │   ├── pdf_ingestor.py       PDF → text chunks → ChromaDB
│   │   ├── web_ingestor.py       URL → scraped text → ChromaDB
│   │   └── chunker.py            Smart paragraph-aware chunker
│   ├── retriever.py              MMR retrieval from ChromaDB
│   └── manager.py                KB CRUD — create, delete, list collections
├── search/
│   ├── __init__.py
│   ├── web_search.py             DuckDuckGo search + result formatting
│   └── image_search.py           Web image search for project photos
├── whatsapp/
│   ├── __init__.py
│   ├── sender.py                 Send text, media, template messages via Twilio
│   └── webhook_handler.py        Parse incoming Twilio webhook payloads
├── streaming/
│   ├── __init__.py
│   └── sse_handler.py            SSE token streaming to frontend
├── testing/
│   ├── __init__.py
│   ├── agent_tester.py           CLI test harness for agent responses
│   └── test_cases.py             Predefined test scenarios
├── config/
│   ├── __init__.py
│   └── settings.py               Pydantic settings from .env
├── utils/
│   ├── __init__.py
│   ├── prompts.py                All system prompt templates
│   ├── memory.py                 Conversation window + summary logic
│   ├── cache.py                  In-memory KB result cache
│   ├── formatters.py             WhatsApp message formatter
│   └── validators.py             Input validation helpers
├── schemas/
│   ├── __init__.py
│   ├── agent.py                  Pydantic request/response models
│   └── kb.py                     KB ingestion models
├── checkpointer.py               PostgresSaver setup
├── main.py                       FastAPI app — all endpoints
├── requirements.txt
└── .env
```

---

## Tech Stack

```python
# LLM — PRIMARY
from langchain_groq import ChatGroq
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    groq_api_key=settings.groq_api_key,
    temperature=0.3,
    max_tokens=1024
)

# LLM — FAST (background tasks: qualify, summarize)
llm_fast = ChatGroq(
    model="llama-3.1-8b-instant",
    groq_api_key=settings.groq_api_key,
    temperature=0,
    max_tokens=256
)

# LLM — FALLBACK (when Groq hits rate limits)
from langchain_openai import ChatOpenAI
llm_fallback = ChatOpenAI(
    model="meta-llama/llama-3.3-70b-instruct:free",
    api_key=settings.openrouter_api_key,
    base_url="https://openrouter.ai/api/v1",
    temperature=0.3
)

# EMBEDDINGS — Mistral (keep, do not replace)
from langchain_mistralai import MistralAIEmbeddings
embeddings = MistralAIEmbeddings(
    model="mistral-embed",
    mistral_api_key=settings.mistral_api_key
)

# VECTOR DB
import chromadb
chroma_client = chromadb.PersistentClient(path=settings.chroma_persist_path)

# WHATSAPP
from twilio.rest import Client as TwilioClient
twilio_client = TwilioClient(settings.twilio_account_sid, settings.twilio_auth_token)
```

### NEVER USE
```python
# These are BANNED — will cause silent failures
from langchain_community import ...   # NEVER
from langchain_community.llms import ...   # NEVER
from langchain_community.embeddings import ...   # NEVER
from langchain_community.vectorstores import ...   # NEVER
```

### Always Use Direct Imports
```python
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres import PostgresSaver
from pypdf import PdfReader
```

---

## Environment Variables

```env
# LLM
GROQ_API_KEY=                      # console.groq.com — free, no card
MISTRAL_API_KEY=                   # embeddings only
OPENROUTER_API_KEY=                # fallback — openrouter.ai free

# Database
DATABASE_URL=postgresql://...      # Supabase free tier

# Vector DB
CHROMA_PERSIST_PATH=./chroma_db

# WhatsApp — Twilio (already configured)
TWILIO_ACCOUNT_SID=                # already set
TWILIO_AUTH_TOKEN=                 # already set
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Twilio sandbox number

# Storage
CLOUDINARY_URL=                    # for brochure PDF hosting

# App
PORT=8000
BACKEND_URL=http://localhost:3001  # Node.js backend URL
```

---

## Section 1 — Agent State

```python
# agents/state.py

from typing import TypedDict, List, Annotated, Optional
import operator

class AgentState(TypedDict):
    # Lead identity
    lead_id:        str
    lead_name:      str
    lead_phone:     str          # E.164 format: +919876543210
    business_id:    str
    kb_id:          str          # which KB collection to search

    # Campaign config
    agent_name:     str          # e.g. "Priya" — configured per business
    agent_tone:     str          # friendly | professional | hinglish
    language:       str          # en | hi | gu | hinglish

    # Conversation memory
    # Annotated with operator.add — APPENDS, never overwrites
    messages:               Annotated[List[dict], operator.add]
    conversation_summary:   str      # cached summary of older messages
    last_summary_at:        int      # index of last message when summary was made
    last_agent_message:     str      # last reply sent to lead
    images_to_send:         List[str]  # web image URLs to attach in WhatsApp
    brochure_url:           Optional[str]  # brochure download link if found

    # Intelligence
    qualification_score:    int          # 0–4
    intent_signals:         List[str]    # signals detected so far
    stage:                  str          # opener|nurturing|objection|qualified|cold|handoff
    sentiment:              str          # positive|neutral|negative|frustrated|angry
    confidence:             float        # 0.0–1.0 agent confidence in last answer
    out_of_scope_count:     int          # track repeated off-topic attempts

    # Control
    human_handoff:  bool
    handoff_reason: str
    task_complete:  bool
    web_search_used: bool   # flag if web search was used in this turn
```

---

## Section 2 — Tools

```python
# agents/tools.py

from langchain_core.tools import tool
from kb.retriever import mmr_retrieval
from search.web_search import search_web
from search.image_search import search_project_images
from typing import Optional

@tool
def search_knowledge_base(query: str, kb_id: str) -> str:
    """
    PRIMARY tool. ALWAYS call this first for ANY question about:
    - Dobariya or Reneev projects, locations, configurations
    - Pricing, payment plans, EMI options
    - Amenities, specifications, possession dates
    - Developer group information, RERA details
    - Any factual claim about projects or developers

    Returns relevant text from the knowledge base.
    If returns 'No relevant information found' → call search_web next.
    """
    from kb.retriever import retrieve_context
    context, sources = retrieve_context(query=query, kb_id=kb_id)
    if sources:
        return f"{context}\n\n[Retrieved from KB — {len(sources)} sources]"
    return "No relevant information found in knowledge base."


@tool
def search_web(query: str, developer_context: str = "Dobariya Reneev real estate") -> str:
    """
    ONLY call this if search_knowledge_base returns 'No relevant information found'.
    Always append developer context to query for relevance.
    Used for: project news, RERA verification, location details, market info.
    Prefix all web results with 'Based on publicly available information:'
    NEVER use this to answer questions about competitor developers.
    """
    from search.web_search import search_web as _search
    full_query = f"{query} {developer_context}"
    results = _search(full_query, max_results=3)
    if not results:
        return "No relevant web results found."
    return "Based on publicly available information:\n\n" + results


@tool
def get_project_images(project_name: str) -> str:
    """
    Call this when lead asks to SEE the project, wants photos,
    or asks 'how does it look', 'show me images', 'exterior photos'.
    Returns comma-separated public image URLs from the web.
    Only search for Dobariya or Reneev projects.
    """
    from search.image_search import search_project_images as _search
    urls = _search(project_name)
    if not urls:
        return "NO_IMAGES_FOUND"
    return ",".join(urls[:3])  # max 3 images


@tool
def get_brochure_link(project_name: str) -> str:
    """
    Call this when:
    - Lead asks for brochure, floor plans, detailed specs
    - Lead says 'send me details', 'share more info'
    - After giving pricing info to follow up with brochure offer
    Searches developer websites for official brochure PDF links.
    """
    from search.web_search import find_brochure_link as _find
    url = _find(project_name)
    if not url:
        return "BROCHURE_NOT_FOUND"
    return url


@tool
def flag_human_handoff(lead_id: str, reason: str) -> str:
    """
    Call this when:
    - Lead explicitly asks to speak to a human/agent/manager
    - Lead is frustrated or angry (sentiment check)
    - Question is too specific/sensitive for agent to handle
    - Lead is ready to visit site or sign agreement
    """
    return f"HANDOFF_REQUESTED|{reason}"


@tool
def get_available_slots(preference: str) -> str:
    """
    Call when lead asks to schedule a site visit, meeting or callback.
    Returns available time slots.
    """
    # In real implementation: call backend calendar API
    return "Available slots: Monday 10am, Tuesday 2pm, Wednesday 11am, Thursday 3pm"


@tool
def book_site_visit(lead_name: str, phone: str, slot: str, project: str) -> str:
    """
    Call after lead confirms a specific slot for site visit.
    Books the appointment and returns confirmation.
    """
    # In real implementation: call backend to create calendar event
    return f"BOOKED|{slot}|{project}"
```

---

## Section 3 — Nodes

```python
# agents/nodes.py

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_groq import ChatGroq
from pydantic import BaseModel
from typing import List
from agents.state import AgentState
from agents.tools import (
    search_knowledge_base, search_web, get_project_images,
    get_brochure_link, flag_human_handoff,
    get_available_slots, book_site_visit
)
from utils.prompts import build_system_prompt
from utils.memory import prepare_conversation_context
from config.settings import settings

# ── LLM SETUP ────────────────────────────────────────────────────────────────

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    groq_api_key=settings.groq_api_key,
    temperature=0.3,
    max_tokens=1024
)

llm_fast = ChatGroq(
    model="llama-3.1-8b-instant",
    groq_api_key=settings.groq_api_key,
    temperature=0,
    max_tokens=256
)

tools = [
    search_knowledge_base,
    search_web,
    get_project_images,
    get_brochure_link,
    flag_human_handoff,
    get_available_slots,
    book_site_visit
]

# Structured output schema — single LLM call returns everything
class AgentResponse(BaseModel):
    reply: str                        # WhatsApp message to send
    qualification_signals: List[str]  # ["asked_price", "mentioned_timeline"]
    detected_stage: str               # opener|nurturing|objection|qualified|cold
    wants_human: bool
    sentiment: str                    # positive|neutral|negative|frustrated|angry
    confidence: float                 # 0.0–1.0
    is_out_of_scope: bool             # true if question was not about D&R projects
    searched_web: bool                # true if web search was needed
    images_requested: bool            # true if lead asked for photos
    brochure_requested: bool          # true if lead asked for brochure/details

llm_with_tools = llm.bind_tools(tools)
llm_structured = llm.with_structured_output(AgentResponse)


# ── NODE 1: MAIN CONVERSATION NODE ───────────────────────────────────────────

def conversation_node(state: AgentState) -> dict:
    """
    Core node. Single LLM call handles:
    - Generating reply
    - Tool calls (KB search, web search, images, brochure)
    - Qualification scoring
    - Sentiment detection
    - Out-of-scope handling
    """

    # Prepare conversation window (last 8 messages + cached summary)
    recent_messages, summary = prepare_conversation_context(
        messages=state["messages"],
        window_size=8,
        summary=state.get("conversation_summary", "")
    )

    # Build system prompt
    system_prompt = build_system_prompt(
        agent_name=state.get("agent_name", "Priya"),
        agent_tone=state.get("agent_tone", "friendly"),
        language=state.get("language", "en"),
        conversation_summary=summary,
        qualification_score=state.get("qualification_score", 0),
        stage=state.get("stage", "opener"),
        sentiment=state.get("sentiment", "neutral"),
        intent_signals=state.get("intent_signals", []),
        kb_id=state.get("kb_id", ""),
        lead_name=state.get("lead_name", "")
    )

    # Build message list
    lc_messages = [SystemMessage(content=system_prompt)]
    for msg in recent_messages:
        if msg["role"] == "lead":
            lc_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] in ["agent", "human"]:
            lc_messages.append(AIMessage(content=msg["content"]))

    # ── INVOKE WITH TOOLS ─────────────────────────────────────────────────────
    # Exponential backoff for rate limits
    import time
    max_retries = 3
    response = None

    for attempt in range(max_retries):
        try:
            response = llm_with_tools.invoke(lc_messages)
            break
        except Exception as e:
            if "429" in str(e) or "rate" in str(e).lower():
                wait = 2 ** attempt  # 1s, 2s, 4s
                time.sleep(wait)
                if attempt == max_retries - 1:
                    # Fallback to OpenRouter
                    from langchain_openai import ChatOpenAI
                    fallback_llm = ChatOpenAI(
                        model="meta-llama/llama-3.3-70b-instruct:free",
                        api_key=settings.openrouter_api_key,
                        base_url="https://openrouter.ai/api/v1"
                    )
                    response = fallback_llm.bind_tools(tools).invoke(lc_messages)
            else:
                raise e

    # ── HANDLE TOOL CALLS ─────────────────────────────────────────────────────
    images_found = []
    brochure_found = None
    web_used = False
    final_reply = response.content if response.content else ""

    if hasattr(response, "tool_calls") and response.tool_calls:
        from langchain_core.messages import ToolMessage
        tool_results = []

        for tool_call in response.tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]

            # Execute tool
            result = execute_tool(tool_name, tool_args)
            tool_results.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))

            # Parse special results
            if tool_name == "get_project_images" and result != "NO_IMAGES_FOUND":
                images_found = [url.strip() for url in result.split(",") if url.strip()]
            elif tool_name == "get_brochure_link" and result != "BROCHURE_NOT_FOUND":
                brochure_found = result
            elif tool_name == "search_web":
                web_used = True
            elif tool_name == "flag_human_handoff":
                return {
                    "human_handoff": True,
                    "handoff_reason": tool_args.get("reason", "Lead requested human"),
                    "last_agent_message": "Let me connect you with one of our senior consultants right away. They'll be in touch shortly! 🙏",
                    "messages": [{"role": "agent", "content": "Let me connect you with one of our senior consultants right away. They'll be in touch shortly! 🙏"}],
                    "stage": "handoff",
                    "task_complete": True
                }

        # Second LLM call with tool results to generate final reply
        lc_messages_with_tools = lc_messages + [response] + tool_results
        for attempt in range(max_retries):
            try:
                final_response = llm.invoke(lc_messages_with_tools)
                final_reply = final_response.content
                break
            except Exception as e:
                if "429" in str(e) and attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                else:
                    final_reply = "I'm looking into that for you. Could you give me just a moment? 🙏"

    # ── QUALIFICATION SCORING (no extra LLM call) ─────────────────────────────
    signal_map = {
        "asked_price": 1, "mentioned_budget": 1, "mentioned_timeline": 1,
        "is_decision_maker": 1, "specific_project_interest": 1,
        "asked_floor_plan": 0, "asked_location": 0  # interest signals, not score
    }

    # Simple rule-based signal detection from last message
    last_msg = state["messages"][-1]["content"].lower() if state["messages"] else ""
    new_signals = list(state.get("intent_signals", []))

    signal_keywords = {
        "asked_price": ["price", "cost", "rate", "budget", "how much", "kitna"],
        "mentioned_timeline": ["when", "possession", "ready", "move in", "kab"],
        "is_decision_maker": ["i will buy", "we will buy", "my decision", "i decide"],
        "specific_project_interest": ["interested in", "tell me about", "this project", "this flat"],
        "mentioned_budget": ["budget is", "can spend", "have budget", "afford"]
    }

    for signal, keywords in signal_keywords.items():
        if signal not in new_signals:
            if any(kw in last_msg for kw in keywords):
                new_signals.append(signal)

    score = sum(1 for s in new_signals if s in signal_map and signal_map[s] > 0)
    score = min(score, 4)

    # ── FORMAT REPLY FOR WHATSAPP ─────────────────────────────────────────────
    from utils.formatters import format_for_whatsapp
    formatted_reply = format_for_whatsapp(
        reply=final_reply,
        brochure_url=brochure_found,
        has_images=len(images_found) > 0
    )

    return {
        "messages": [{"role": "agent", "content": formatted_reply}],
        "last_agent_message": formatted_reply,
        "qualification_score": score,
        "intent_signals": new_signals,
        "stage": determine_stage(score, state.get("stage", "opener")),
        "human_handoff": False,
        "images_to_send": images_found,
        "brochure_url": brochure_found,
        "web_search_used": web_used,
        "task_complete": False
    }


def execute_tool(tool_name: str, tool_args: dict) -> str:
    """Execute a tool by name with given arguments."""
    tool_map = {
        "search_knowledge_base": search_knowledge_base,
        "search_web": search_web,
        "get_project_images": get_project_images,
        "get_brochure_link": get_brochure_link,
        "flag_human_handoff": flag_human_handoff,
        "get_available_slots": get_available_slots,
        "book_site_visit": book_site_visit
    }
    tool_fn = tool_map.get(tool_name)
    if not tool_fn:
        return f"Unknown tool: {tool_name}"
    try:
        return tool_fn.invoke(tool_args)
    except Exception as e:
        return f"Tool error: {str(e)}"


def determine_stage(score: int, current_stage: str) -> str:
    if score >= 3:
        return "qualified"
    if score >= 1:
        return "nurturing"
    if current_stage == "opener":
        return "nurturing"
    return current_stage


# ── NODE 2: ESCALATION NODE ───────────────────────────────────────────────────

def escalation_node(state: AgentState) -> dict:
    """Fires when lead qualifies or requests human."""
    farewell = (
        f"Thank you {state.get('lead_name', 'for your interest')}! 🙏\n"
        f"Our senior consultant will reach out to you shortly "
        f"to discuss further. Have a great day!"
    )
    return {
        "messages": [{"role": "agent", "content": farewell}],
        "last_agent_message": farewell,
        "stage": "handoff",
        "task_complete": True
    }
```

---

## Section 4 — Graph

```python
# agents/graph.py

from langgraph.graph import StateGraph, END
from agents.state import AgentState
from agents.nodes import conversation_node, escalation_node
from checkpointer import get_checkpointer


def route_after_conversation(state: AgentState) -> str:
    """Decides next node after conversation_node runs."""
    if state.get("human_handoff"):
        return "escalate"
    if state.get("stage") == "qualified":
        return "escalate"
    if state.get("sentiment") in ["frustrated", "angry"]:
        return "escalate"
    if state.get("confidence", 1.0) < 0.3:
        return "escalate"
    return "end"


def build_agent_graph(checkpointer=None):
    graph = StateGraph(AgentState)

    graph.add_node("conversation", conversation_node)
    graph.add_node("escalation", escalation_node)

    graph.set_entry_point("conversation")

    graph.add_conditional_edges(
        "conversation",
        route_after_conversation,
        {
            "escalate": "escalation",
            "end": END
        }
    )

    graph.add_edge("escalation", END)

    cp = checkpointer or get_checkpointer()
    return graph.compile(checkpointer=cp)
```

---

## Section 5 — System Prompts

```python
# utils/prompts.py

SCOPE_RULES = """
SCOPE — STRICTLY FOLLOW:

You represent ONLY Dobariya Developer Group and Reneev Developer Group.
These are real estate developers building residential and commercial projects.

ALLOWED topics:
✅ Any Dobariya or Reneev project details
✅ Pricing, configurations, amenities, possession for their projects
✅ General real estate questions (loan, RERA, registration process)
✅ Location/area queries (schools, hospitals, metro near their projects)
✅ Booking process, site visit scheduling

NOT ALLOWED topics:
❌ Other developer groups (Godrej, Lodha, Prestige, Sobha, etc.)
❌ Competitor project comparisons
❌ Stock market, finance unrelated to property
❌ Completely unrelated topics (politics, entertainment, etc.)

HANDLING OUT-OF-SCOPE:
- If asked about another developer: "I specialize in Dobariya and Reneev projects — I'd be happy to share what makes their projects stand out. Would you like to know more?"
- If asked completely unrelated topic: "That's a bit outside my area! I'm here to help with Dobariya and Reneev real estate projects. Is there anything about their projects I can help you with?"
- Track out_of_scope_count — after 2 off-topic attempts, redirect firmly but politely
- NEVER answer questions about competitor projects even if you know the answer
"""

ANTI_HALLUCINATION_RULES = """
FACTUAL ACCURACY — NON-NEGOTIABLE:

1. NEVER state a fact not present in KB or web search results
2. NEVER associate projects with developer groups unless KB confirms it
3. NEVER invent pricing — only quote from KB
4. NEVER guess RERA numbers — if asked, say "Let me get the official RERA number for you"
5. NEVER compare with competitor projects
6. If KB has partial info → share what you know, flag what needs verification
7. NEVER say "I think" or "I believe" about facts — either you know or you don't
8. If unsure → "Let me check on that specific detail for you"

DEVELOPER GROUP RULE (CRITICAL):
Never say "This is a Godrej project" or associate Dobariya/Reneev projects
with any other group unless the KB document explicitly states the relationship.
"""

WHATSAPP_FORMATTING_RULES = """
WHATSAPP MESSAGE FORMATTING — FOLLOW EXACTLY:

MEDIUM (default for most replies):
- 3-5 lines max
- Use line breaks between distinct points
- ONE emoji per message maximum — only when natural, never forced

LISTS (when sharing multiple items):
- Use bullet format: • item one
- Max 5 bullets per message
- No sub-bullets

PRICING FORMAT:
₹85L – ₹1.2Cr (2BHK – 3BHK)
Always mention what's included (parking, GST etc.)
Always mention payment plan in same message

NEVER USE:
❌ Markdown headers (## or **)
❌ Bold text (**text**)  
❌ More than 1 emoji
❌ "Certainly!", "Absolutely!", "Great question!"
❌ "As an AI..." — you are a human consultant
❌ Stacking 3+ questions in one message — ask ONE question
❌ Ending every message with "Is there anything else I can help you with?"

LANGUAGE ADAPTATION:
- en: Pure English
- hi: Hindi with English project/technical terms
- hinglish: Natural Hindi-English mix ("Ye project bahut achha hai — 2BHK starts at ₹85L")
- gu: Gujarati with English technical terms
- Always match the language the lead is writing in
"""

TOOL_SEQUENCE_RULES = """
TOOL USE — MANDATORY SEQUENCE:

1. For ANY factual question → call search_knowledge_base FIRST
2. If KB returns "No relevant information found" → call search_web
3. If lead asks for photos/images → call get_project_images
4. If lead asks for brochure/details → call get_brochure_link
5. If lead wants human → call flag_human_handoff
6. If lead wants site visit → call get_available_slots, then book_site_visit

NEVER answer factual questions from memory alone.
NEVER skip KB search and go directly to web search.
ALWAYS use KB first, web second.
"""

QUALIFICATION_COACHING = """
QUALIFICATION GOAL (do subtly — never interrogate):

Naturally discover through conversation:
• Budget range (don't ask directly — infer from project interest)
• Purchase timeline ("Are you looking to move in soon or planning for later?")
• Decision authority ("Will anyone else be involved in the decision?")
• Specific project interest (which project, which configuration)

Score updates automatically. Focus on being helpful — qualification happens naturally.
"""

def build_system_prompt(
    agent_name: str,
    agent_tone: str,
    language: str,
    conversation_summary: str,
    qualification_score: int,
    stage: str,
    sentiment: str,
    intent_signals: list,
    kb_id: str,
    lead_name: str
) -> str:

    tone_map = {
        "friendly":     "Warm, conversational, approachable. Like a knowledgeable friend.",
        "professional": "Polite, formal, precise. Trustworthy and credible.",
        "hinglish":     "Natural Hindi-English mix. Warm and relatable to Indian buyers."
    }

    return f"""You are {agent_name}, a senior sales consultant at Dobariya and Reneev Developer Groups.

YOUR IDENTITY:
- Name: {agent_name}
- Role: Senior Sales Consultant — real estate expert
- You are a HUMAN consultant, not a bot
- If asked "are you a bot/AI?" → "I'm a sales consultant here to help you find your perfect property 😊"
- Tone: {tone_map.get(agent_tone, tone_map['friendly'])}
- Language: {language}

CONVERSATION HISTORY SUMMARY:
{conversation_summary or "This is the start of the conversation."}

CURRENT LEAD:
- Name: {lead_name or "the prospect"}
- Score: {qualification_score}/4
- Stage: {stage}
- Sentiment: {sentiment}
- Signals detected: {', '.join(intent_signals) if intent_signals else 'none yet'}
- KB ID: {kb_id}

{SCOPE_RULES}

{TOOL_SEQUENCE_RULES}

{ANTI_HALLUCINATION_RULES}

{WHATSAPP_FORMATTING_RULES}

{QUALIFICATION_COACHING}

CURRENT TASK:
Respond to the lead's latest WhatsApp message.
Be helpful, honest, and human. Never sound scripted.
"""
```

---

## Section 6 — WhatsApp Sender

```python
# whatsapp/sender.py

from twilio.rest import Client
from config.settings import settings
import time

twilio_client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
FROM_NUMBER = f"whatsapp:{settings.twilio_whatsapp_number}"


def send_text_message(to_phone: str, message: str) -> dict:
    """Send plain text WhatsApp message."""
    to = f"whatsapp:{to_phone}"
    try:
        msg = twilio_client.messages.create(
            from_=FROM_NUMBER,
            to=to,
            body=message
        )
        return {"success": True, "sid": msg.sid}
    except Exception as e:
        return {"success": False, "error": str(e)}


def send_image_message(to_phone: str, image_url: str, caption: str = "") -> dict:
    """Send image with optional caption via WhatsApp."""
    to = f"whatsapp:{to_phone}"
    try:
        msg = twilio_client.messages.create(
            from_=FROM_NUMBER,
            to=to,
            body=caption,
            media_url=[image_url]
        )
        return {"success": True, "sid": msg.sid}
    except Exception as e:
        return {"success": False, "error": str(e)}


def send_template_message(to_phone: str, template_body: str) -> dict:
    """
    Send pre-approved template message (for first outbound contact).
    Twilio Sandbox allows free-form messages for testing.
    In production: use Meta-approved templates.
    """
    return send_text_message(to_phone, template_body)


def send_full_agent_response(
    to_phone: str,
    text_reply: str,
    images: list = None,
    brochure_url: str = None
) -> dict:
    """
    Send complete agent response:
    1. Text message first
    2. Images (if any) with small delay
    3. Brochure link (if any) as separate message
    """
    results = []

    # 1. Send text reply
    result = send_text_message(to_phone, text_reply)
    results.append(result)

    # 2. Send images (max 2, with delay to avoid spam)
    if images:
        for i, img_url in enumerate(images[:2]):
            time.sleep(0.8)
            caption = f"📸 Project Photo {i+1}" if i > 0 else "📸 Project Photo"
            result = send_image_message(to_phone, img_url, caption)
            results.append(result)

    # 3. Send brochure link as separate message
    if brochure_url:
        time.sleep(0.5)
        brochure_msg = (
            f"📋 Here's the complete project brochure with floor plans, "
            f"pricing & specifications:\n{brochure_url}"
        )
        result = send_text_message(to_phone, brochure_msg)
        results.append(result)

    return {"success": all(r.get("success") for r in results), "results": results}
```

---

## Section 7 — WhatsApp Free Integration Guide

### Current Setup — Twilio Sandbox (Free for Development)

```
Twilio WhatsApp Sandbox is completely free.
No Meta business verification needed.
No template approval needed.
Perfect for internship demo.

Limitation: Only users who opt-in to your sandbox can receive messages.
For demo: you + testers join sandbox, everything works.

How to join sandbox:
  Lead sends "join <sandbox-keyword>" to +14155238886 on WhatsApp
  After joining → agent can send/receive freely
```

### Webhook Setup
```python
# whatsapp/webhook_handler.py

from fastapi import Request
from urllib.parse import unquote

async def parse_twilio_webhook(request: Request) -> dict:
    """Parse incoming Twilio WhatsApp webhook."""
    form_data = await request.form()

    return {
        "from_phone": str(form_data.get("From", "")).replace("whatsapp:", ""),
        "to_phone": str(form_data.get("To", "")).replace("whatsapp:", ""),
        "message_body": str(form_data.get("Body", "")),
        "message_sid": str(form_data.get("MessageSid", "")),
        "num_media": int(form_data.get("NumMedia", 0)),
        "media_url": str(form_data.get("MediaUrl0", "")) if int(form_data.get("NumMedia", 0)) > 0 else None
    }
```

### Moving to Production (Free Alternative to Twilio)
```
When Twilio paid tier is needed in production, use:

Option 1: Meta Cloud API (free — you pay only per conversation)
  - Direct Meta API — no BSP middleman fee
  - Marketing conversations: ~₹0.58 each
  - Service conversations: FREE
  - Setup: business.facebook.com → WhatsApp → API Setup
  - Takes 3-5 days for business verification

Option 2: AiSensy BSP (₹999/month)
  - Cheapest BSP available in India
  - Handles template management
  - Good webhooks and dashboard

For internship demo: Twilio Sandbox is perfectly sufficient.
```

---

## Section 8 — KB Ingestion

```python
# kb/ingestion/pdf_ingestor.py

from pypdf import PdfReader
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_mistralai import MistralAIEmbeddings
from kb.ingestion.chunker import chunk_text_smart
from config.settings import settings
import shutil, os

embeddings_model = MistralAIEmbeddings(
    model="mistral-embed",
    mistral_api_key=settings.mistral_api_key
)


def _get_persist_path(kb_id: str) -> str:
    collection_name = f"kb_{kb_id.replace('-', '_')}"
    return os.path.join(settings.chroma_persist_path, collection_name)


def _delete_existing_collection(kb_id: str):
    """Delete old collection directory — always fresh on re-ingest."""
    persist_path = _get_persist_path(kb_id)
    if os.path.exists(persist_path):
        shutil.rmtree(persist_path)


def ingest_pdf(file_path: str, kb_id: str, source_label: str = "brochure") -> dict:
    """
    Extract text from PDF → smart chunk → embed via Mistral → store in Chroma.
    Uses LangChain Chroma wrapper — compatible with as_retriever(search_type='mmr').
    NO image extraction — text content only.
    """
    reader = PdfReader(file_path)
    documents = []

    for page_num, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        if not text.strip():
            continue
        chunks = chunk_text_smart(text)
        for chunk in chunks:
            documents.append(Document(
                page_content=chunk,
                metadata={
                    "page":   page_num + 1,
                    "source": source_label,
                    "kb_id":  kb_id
                }
            ))

    if not documents:
        return {"collection": f"kb_{kb_id.replace('-','_')}", "chunks_stored": 0}

    return _embed_and_store(documents, kb_id)


def ingest_url(url: str, kb_id: str) -> dict:
    """Scrape URL → extract text → chunk → embed → store."""
    from kb.ingestion.web_ingestor import scrape_url
    text, _ = scrape_url(url)
    chunks = chunk_text_smart(text)
    documents = [
        Document(
            page_content=chunk,
            metadata={"page": 0, "source": url, "kb_id": kb_id}
        )
        for chunk in chunks
    ]
    return _embed_and_store(documents, kb_id)


def _embed_and_store(documents: list, kb_id: str) -> dict:
    """
    Embed and store LangChain Documents into Chroma.
    Uses Chroma.from_documents() — handles batching internally.
    Always deletes old collection first to avoid stale data.
    """
    collection_name = f"kb_{kb_id.replace('-', '_')}"
    persist_path = _get_persist_path(kb_id)

    # Always delete old collection — never append stale chunks
    _delete_existing_collection(kb_id)

    # LangChain handles embedding + storing in one call
    Chroma.from_documents(
        documents=documents,
        embedding=embeddings_model,
        collection_name=collection_name,
        persist_directory=persist_path
    )

    return {
        "collection":    collection_name,
        "chunks_stored": len(documents)
    }
```

```python
# kb/ingestion/chunker.py

import re

def chunk_text_smart(text: str, max_words: int = 400, overlap_words: int = 40) -> list[str]:
    """
    Paragraph-aware chunker.
    Splits on paragraph boundaries to keep sentences whole.
    Never splits mid-sentence.
    """
    # Normalize whitespace
    text = re.sub(r'\n{3,}', '\n\n', text.strip())

    # Split on paragraph boundaries
    paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]

    chunks = []
    current_chunk = []
    current_word_count = 0

    for para in paragraphs:
        para_words = len(para.split())

        if current_word_count + para_words > max_words and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            # Overlap: carry last paragraph into next chunk
            overlap_para = current_chunk[-1] if current_chunk else ""
            current_chunk = [overlap_para, para] if overlap_para else [para]
            current_word_count = len(overlap_para.split()) + para_words
        else:
            current_chunk.append(para)
            current_word_count += para_words

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return [c for c in chunks if c.strip()]
```

---

## Section 9 — MMR Retrieval (LangChain Native)

Use LangChain's built-in MMR via `as_retriever()` — no manual cosine loops needed.
Install: `pip install langchain-chroma`

```python
# kb/retriever.py

from langchain_chroma import Chroma
from langchain_mistralai import MistralAIEmbeddings
from config.settings import settings

embeddings_model = MistralAIEmbeddings(
    model="mistral-embed",
    mistral_api_key=settings.mistral_api_key
)


def get_vectorstore(kb_id: str) -> Chroma:
    """Get LangChain Chroma vectorstore for a KB collection."""
    collection_name = f"kb_{kb_id.replace('-', '_')}"
    persist_path = f"{settings.chroma_persist_path}/{collection_name}"
    return Chroma(
        collection_name=collection_name,
        embedding_function=embeddings_model,
        persist_directory=persist_path
    )


def get_mmr_retriever(kb_id: str):
    """
    Returns LangChain MMR retriever using as_retriever().
    k=4         → final chunks returned to agent
    fetch_k=10  → candidates fetched before MMR re-ranking
    lambda_mult=0.5 → balanced relevance vs diversity
                      nudge to 0.7 if agent misses specific facts
                      nudge to 0.3 if responses feel repetitive
    """
    vectorstore = get_vectorstore(kb_id)
    return vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 4,
            "fetch_k": 10,
            "lambda_mult": 0.5
        }
    )


def retrieve_context(query: str, kb_id: str) -> tuple[str, list]:
    """
    Retrieve relevant chunks via LangChain native MMR.
    Returns (context_string, sources_list).
    """
    try:
        retriever = get_mmr_retriever(kb_id)
    except Exception:
        return "No knowledge base found.", []

    try:
        docs = retriever.invoke(query)
    except Exception:
        return "No relevant information found in knowledge base.", []

    if not docs:
        return "No relevant information found in knowledge base.", []

    context_parts = []
    sources = []

    for doc in docs:
        page = doc.metadata.get("page", "?")
        source = doc.metadata.get("source", "")
        context_parts.append(
            f"[Source: {source}, Page: {page}]\n{doc.page_content}"
        )
        sources.append({"page": page, "source": source})

    return "\n\n---\n\n".join(context_parts), sources
```

### search_type Options for Reference
```python
# Pure cosine similarity — fast but returns duplicates
search_type="similarity"

# MMR — balanced relevance + diversity ✅ (your choice)
search_type="mmr"

# Similarity with confidence threshold — filters weak matches
search_type="similarity_score_threshold"
search_kwargs={"score_threshold": 0.7}
```

---

## Section 10 — Web Search & Image Search

```python
# search/web_search.py

from duckduckgo_search import DDGS


def search_web(query: str, max_results: int = 3) -> str:
    """Search web, return formatted results."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        if not results:
            return ""
        formatted = []
        for r in results:
            body = r.get("body", "")
            href = r.get("href", "")
            if body:
                formatted.append(f"{body}\nSource: {href}")
        return "\n\n".join(formatted)
    except Exception as e:
        return ""


def find_brochure_link(project_name: str) -> str:
    """
    Search for official brochure PDF link for a project.
    Prioritizes developer official websites.
    """
    query = f"{project_name} Dobariya Reneev brochure PDF download site:dobariya.com OR site:reneev.com"
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=5))
        for r in results:
            href = r.get("href", "")
            body = r.get("body", "")
            # Prioritize PDF links
            if ".pdf" in href.lower():
                return href
            # Then official site links
            if any(domain in href for domain in ["dobariya", "reneev"]):
                return href
        # Fallback: first result URL
        if results:
            return results[0].get("href", "")
        return ""
    except Exception:
        return ""
```

```python
# search/image_search.py

from duckduckgo_search import DDGS


def search_project_images(project_name: str, max_images: int = 3) -> list[str]:
    """
    Search for real project images on the web.
    Only searches for Dobariya and Reneev projects.
    Returns list of direct image URLs.
    """
    query = f"{project_name} Dobariya Reneev residential project photos"
    try:
        with DDGS() as ddgs:
            results = list(ddgs.images(
                query,
                max_results=max_images * 2,  # fetch more, filter down
                type_image="photo",
                size="medium"
            ))

        urls = []
        for r in results:
            url = r.get("image", "")
            # Only include https images (WhatsApp requires https)
            if url.startswith("https://") and len(urls) < max_images:
                urls.append(url)

        return urls
    except Exception:
        return []
```

---

## Section 11 — WhatsApp Message Formatter

```python
# utils/formatters.py

def format_for_whatsapp(
    reply: str,
    brochure_url: str = None,
    has_images: bool = False
) -> str:
    """
    Ensures reply is properly formatted for WhatsApp.
    Strips markdown, limits length, adds appropriate closing.
    """
    import re

    # Remove markdown formatting
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', reply)   # bold
    text = re.sub(r'\*(.*?)\*', r'\1', text)          # italic
    text = re.sub(r'#{1,6}\s', '', text)              # headers
    text = re.sub(r'`(.*?)`', r'\1', text)            # code

    # Normalize line breaks
    text = re.sub(r'\n{3,}', '\n\n', text.strip())

    # Add hint if images are coming
    if has_images:
        if not text.endswith(("!", ".", "?", "🙏", "😊")):
            text += "\n\nSending you some project photos as well! 📸"

    return text
```

---

## Section 12 — SSE Streaming

```python
# streaming/sse_handler.py

import asyncio
import json
from fastapi.responses import StreamingResponse
from agents.graph import build_agent_graph
from agents.state import AgentState


async def stream_agent_response(
    payload: dict,
    agent_graph
) -> StreamingResponse:
    """
    Streams agent response token by token via SSE.
    Frontend receives: thinking → tokens → images → done events.
    """

    async def generate():
        config = {"configurable": {"thread_id": payload["thread_id"]}}

        # Initial thinking event
        yield f"data: {json.dumps({'type': 'thinking', 'text': 'Agent is responding...'})}\n\n"
        await asyncio.sleep(0.05)

        try:
            # Run agent graph
            input_state = build_input_state(payload)
            result = agent_graph.invoke(input_state, config=config)

            reply = result.get("last_agent_message", "")

            # Stream reply word by word (simulate streaming for non-streaming models)
            words = reply.split(" ")
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                yield f"data: {json.dumps({'type': 'token', 'text': chunk})}\n\n"
                await asyncio.sleep(0.03)  # ~30ms per word feels natural

            # Send image URLs
            images = result.get("images_to_send", [])
            if images:
                yield f"data: {json.dumps({'type': 'images', 'urls': images})}\n\n"

            # Send brochure URL
            brochure = result.get("brochure_url")
            if brochure:
                yield f"data: {json.dumps({'type': 'brochure', 'url': brochure})}\n\n"

            # Done event with metadata
            yield f"data: {json.dumps({'type': 'done', 'qualification_score': result.get('qualification_score', 0), 'stage': result.get('stage', ''), 'needs_human': result.get('human_handoff', False)})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'text': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )


def build_input_state(payload: dict) -> dict:
    return {
        "lead_id":              payload.get("lead_id", ""),
        "lead_name":            payload.get("lead_name", ""),
        "lead_phone":           payload.get("thread_id", ""),
        "business_id":          payload.get("business_id", ""),
        "kb_id":                payload.get("kb_id", ""),
        "agent_name":           payload.get("campaign_config", {}).get("agent_name", "Priya"),
        "agent_tone":           payload.get("campaign_config", {}).get("agent_tone", "friendly"),
        "language":             payload.get("campaign_config", {}).get("language", "en"),
        "messages":             [{"role": "lead", "content": payload["message"]}],
        "conversation_summary": "",
        "last_summary_at":      0,
        "last_agent_message":   "",
        "images_to_send":       [],
        "brochure_url":         None,
        "qualification_score":  0,
        "intent_signals":       [],
        "stage":                "opener",
        "sentiment":            "neutral",
        "confidence":           1.0,
        "out_of_scope_count":   0,
        "human_handoff":        False,
        "handoff_reason":       "",
        "task_complete":        False,
        "web_search_used":      False
    }
```

---

## Section 13 — Testing Module

```python
# testing/agent_tester.py

"""
Standalone CLI test harness for the agent.
Run: python -m testing.agent_tester
No WhatsApp needed — test agent responses directly in terminal.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.graph import build_agent_graph
from agents.state import AgentState
from testing.test_cases import TEST_CASES
import json


def run_test_conversation(
    agent_graph,
    thread_id: str,
    messages: list[str],
    kb_id: str = "test_kb",
    agent_name: str = "Priya"
):
    """Run a multi-turn test conversation."""
    print(f"\n{'='*60}")
    print(f"TEST: {thread_id}")
    print(f"{'='*60}")

    config = {"configurable": {"thread_id": f"test_{thread_id}"}}

    for i, user_message in enumerate(messages):
        print(f"\n👤 Lead: {user_message}")

        input_state = {
            "lead_id": "test_lead",
            "lead_name": "Test User",
            "lead_phone": "+919999999999",
            "business_id": "test_business",
            "kb_id": kb_id,
            "agent_name": agent_name,
            "agent_tone": "friendly",
            "language": "en",
            "messages": [{"role": "lead", "content": user_message}],
            "conversation_summary": "",
            "last_summary_at": 0,
            "last_agent_message": "",
            "images_to_send": [],
            "brochure_url": None,
            "qualification_score": 0,
            "intent_signals": [],
            "stage": "opener",
            "sentiment": "neutral",
            "confidence": 1.0,
            "out_of_scope_count": 0,
            "human_handoff": False,
            "handoff_reason": "",
            "task_complete": False,
            "web_search_used": False
        }

        result = agent_graph.invoke(input_state, config=config)

        print(f"\n🤖 Agent ({result.get('stage', '')} | score:{result.get('qualification_score', 0)}/4):")
        print(f"   {result.get('last_agent_message', '')}")

        if result.get("images_to_send"):
            print(f"   📸 Images: {result['images_to_send']}")
        if result.get("brochure_url"):
            print(f"   📋 Brochure: {result['brochure_url']}")
        if result.get("human_handoff"):
            print(f"   🔥 HOT LEAD — Escalating to human")
            break
        if result.get("web_search_used"):
            print(f"   🌐 Web search was used")


def run_all_tests(agent_graph):
    """Run all predefined test cases."""
    print("\n🧪 RUNNING ALL TEST CASES\n")
    for test in TEST_CASES:
        run_test_conversation(
            agent_graph,
            thread_id=test["id"],
            messages=test["messages"],
            kb_id=test.get("kb_id", "test_kb")
        )
    print(f"\n✅ All tests complete")


if __name__ == "__main__":
    print("🚀 Starting Agent Test Harness...")
    agent = build_agent_graph()

    if len(sys.argv) > 1 and sys.argv[1] == "--all":
        run_all_tests(agent)
    else:
        # Interactive mode
        print("Interactive mode — type your messages. 'quit' to exit.\n")
        config = {"configurable": {"thread_id": "interactive_test"}}
        while True:
            user_input = input("👤 You: ").strip()
            if user_input.lower() in ["quit", "exit", "q"]:
                break
            if not user_input:
                continue

            input_state = {
                "lead_id": "interactive",
                "lead_name": "Tester",
                "lead_phone": "+919999999999",
                "business_id": "test",
                "kb_id": "test_kb",
                "agent_name": "Priya",
                "agent_tone": "friendly",
                "language": "en",
                "messages": [{"role": "lead", "content": user_input}],
                "conversation_summary": "",
                "last_summary_at": 0,
                "last_agent_message": "",
                "images_to_send": [],
                "brochure_url": None,
                "qualification_score": 0,
                "intent_signals": [],
                "stage": "opener",
                "sentiment": "neutral",
                "confidence": 1.0,
                "out_of_scope_count": 0,
                "human_handoff": False,
                "handoff_reason": "",
                "task_complete": False,
                "web_search_used": False
            }

            result = agent.invoke(input_state, config=config)
            print(f"\n🤖 Priya: {result.get('last_agent_message', '')}\n")
```

```python
# testing/test_cases.py

TEST_CASES = [
    {
        "id": "basic_inquiry",
        "messages": [
            "Hi, I'm looking for a 2BHK flat in Ahmedabad",
            "What projects do Dobariya have?",
            "What's the price range?"
        ]
    },
    {
        "id": "out_of_scope",
        "messages": [
            "Tell me about Godrej Woods project",
            "What about Lodha properties?",
            "I want to know about DLF"
        ]
    },
    {
        "id": "image_request",
        "messages": [
            "Can you show me photos of the project?",
            "I want to see the exterior"
        ]
    },
    {
        "id": "brochure_request",
        "messages": [
            "Can you send me the brochure?",
            "I want floor plans and detailed specs"
        ]
    },
    {
        "id": "qualification_flow",
        "messages": [
            "Hi I'm interested in buying a flat",
            "My budget is around 80 lakhs",
            "I want to move in within 6 months",
            "I'm the decision maker"
        ]
    },
    {
        "id": "web_search_fallback",
        "messages": [
            "What is the RERA registration number for the project?",
            "What are the current market rates in this area?"
        ]
    },
    {
        "id": "hinglish_conversation",
        "messages": [
            "Bhai, Dobariya ka koi 3BHK project hai?",
            "Price kitna hai?",
            "EMI ka kya option hai?"
        ]
    },
    {
        "id": "site_visit_booking",
        "messages": [
            "I want to visit the site",
            "Saturday would work for me",
            "10am is fine"
        ]
    }
]
```

---

## Section 14 — FastAPI Main App

```python
# main.py

from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import tempfile, os

from agents.graph import build_agent_graph
from kb.ingestion.pdf_ingestor import ingest_pdf, ingest_url
from whatsapp.webhook_handler import parse_twilio_webhook
from whatsapp.sender import send_full_agent_response
from streaming.sse_handler import stream_agent_response, build_input_state
from schemas.agent import AgentMessageRequest
from checkpointer import get_checkpointer

app = FastAPI(title="AI Real Estate Agent — Dobariya & Reneev", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Build agent once at startup
agent_graph = build_agent_graph()


# ── AGENT ENDPOINTS ───────────────────────────────────────────────────────────

@app.post("/agent/message")
async def handle_message(payload: AgentMessageRequest):
    """Standard (non-streaming) agent response. Used by backend."""
    config = {"configurable": {"thread_id": payload.thread_id}}
    input_state = build_input_state(payload.dict())
    result = agent_graph.invoke(input_state, config=config)
    return {
        "reply":               result.get("last_agent_message", ""),
        "stage":               result.get("stage", ""),
        "qualification_score": result.get("qualification_score", 0),
        "needs_human":         result.get("human_handoff", False),
        "intent_signals":      result.get("intent_signals", []),
        "images_to_send":      result.get("images_to_send", []),
        "brochure_url":        result.get("brochure_url")
    }


@app.post("/agent/message/stream")
async def handle_message_stream(payload: AgentMessageRequest):
    """SSE streaming endpoint — token by token response."""
    return await stream_agent_response(payload.dict(), agent_graph)


# ── WHATSAPP WEBHOOK ──────────────────────────────────────────────────────────

@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request):
    """
    Twilio fires this when lead sends a WhatsApp message.
    Processes message → runs agent → sends reply back via WhatsApp.
    """
    from fastapi.responses import Response

    # Twilio needs 200 immediately
    parsed = await parse_twilio_webhook(request)
    phone = parsed["from_phone"]
    message = parsed["message_body"]

    if not phone or not message:
        return Response(content="<Response/>", media_type="application/xml")

    # TODO: Look up lead and campaign config from Node.js backend
    # For now: use defaults
    payload = {
        "thread_id":       phone,
        "lead_id":         phone,
        "lead_name":       "Lead",
        "message":         message,
        "business_id":     "default",
        "kb_id":           "default_kb",
        "campaign_id":     "default",
        "campaign_config": {"agent_name": "Priya", "agent_tone": "friendly", "language": "en"}
    }

    config = {"configurable": {"thread_id": phone}}
    input_state = build_input_state(payload)
    result = agent_graph.invoke(input_state, config=config)

    # Send full response back via WhatsApp
    send_full_agent_response(
        to_phone=phone,
        text_reply=result.get("last_agent_message", ""),
        images=result.get("images_to_send", []),
        brochure_url=result.get("brochure_url")
    )

    return Response(content="<Response/>", media_type="application/xml")


# ── KB ENDPOINTS ──────────────────────────────────────────────────────────────

@app.post("/kb/ingest/pdf")
async def ingest_pdf_endpoint(
    file: UploadFile = File(...),
    kb_id: str = Form(...),
    source_label: str = Form("brochure")
):
    """Upload and ingest PDF into knowledge base."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    try:
        result = ingest_pdf(tmp_path, kb_id, source_label)
        return {"success": True, **result}
    finally:
        os.unlink(tmp_path)


@app.post("/kb/ingest/url")
async def ingest_url_endpoint(url: str, kb_id: str):
    """Scrape URL and ingest into knowledge base."""
    result = ingest_url(url, kb_id)
    return {"success": True, **result}


@app.delete("/kb/{kb_id}")
async def delete_kb(kb_id: str):
    """Delete a knowledge base collection."""
    from kb.manager import delete_collection
    delete_collection(kb_id)
    return {"success": True}


# ── HEALTH & TEST ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "3.0", "agent": "Dobariya & Reneev RE Agent"}


@app.post("/test/agent")
async def test_agent(message: str, kb_id: str = "test_kb", lead_name: str = "Tester"):
    """Quick test endpoint — no WhatsApp needed."""
    payload = {
        "thread_id":       f"test_{lead_name.lower().replace(' ', '_')}",
        "lead_id":         "test",
        "lead_name":       lead_name,
        "message":         message,
        "business_id":     "test",
        "kb_id":           kb_id,
        "campaign_id":     "test",
        "campaign_config": {"agent_name": "Priya", "agent_tone": "friendly", "language": "en"}
    }
    config = {"configurable": {"thread_id": payload["thread_id"]}}
    input_state = build_input_state(payload)
    result = agent_graph.invoke(input_state, config=config)
    return {
        "reply":          result.get("last_agent_message", ""),
        "score":          result.get("qualification_score", 0),
        "stage":          result.get("stage", ""),
        "images":         result.get("images_to_send", []),
        "brochure":       result.get("brochure_url"),
        "web_used":       result.get("web_search_used", False),
        "needs_human":    result.get("human_handoff", False)
    }
```

---

## Section 15 — Requirements

```txt
# requirements.txt

# Web server
fastapi
uvicorn[standard]
python-dotenv
pydantic-settings
pydantic

# LangChain — DIRECT IMPORTS ONLY, NO langchain_community
langchain-core
langchain-groq
langchain-mistralai
langchain-openai
langgraph
langgraph-checkpoint-postgres

# Vector DB & PDF
chromadb
langchain-chroma        # LangChain Chroma wrapper — required for as_retriever MMR
pypdf

# Web search
duckduckgo-search

# WhatsApp
twilio

# Utilities
psycopg2-binary
python-multipart
httpx
requests
```

---

## Section 16 — Migration Steps (Do In This Exact Order)

```
Step 1: Delete entire old ai_service folder. Start fresh.

Step 2: Create folder structure exactly as specified in Section 0.

Step 3: Copy requirements.txt → pip install -r requirements.txt

Step 4: Set up config/settings.py + .env with all keys
         → Get Groq API key: console.groq.com (free, 30 sec)
         → Get OpenRouter key: openrouter.ai (free fallback)
         → Keep existing Mistral + Twilio keys

Step 5: Build in this order:
         config/settings.py
         checkpointer.py
         kb/ingestion/chunker.py
         kb/ingestion/pdf_ingestor.py
         kb/retriever.py (MMR)
         search/web_search.py
         search/image_search.py
         whatsapp/sender.py
         whatsapp/webhook_handler.py
         utils/prompts.py
         utils/formatters.py
         utils/memory.py
         agents/state.py
         agents/tools.py
         agents/nodes.py
         agents/graph.py
         streaming/sse_handler.py
         main.py
         testing/test_cases.py
         testing/agent_tester.py

Step 6: Test KB ingestion first (no agent needed):
         Upload a sample PDF → verify chunks stored in ChromaDB
         Then test retriever:
           from kb.retriever import retrieve_context
           context, sources = retrieve_context("2BHK pricing", "your_kb_id")
           print(context)  # should return relevant chunks, not duplicates

Step 7: Test agent in CLI (no WhatsApp needed):
         python -m testing.agent_tester
         → Try all 8 test cases

Step 8: Test via FastAPI docs:
         uvicorn main:app --reload
         Go to http://localhost:8000/docs
         Use /test/agent endpoint

Step 9: Test WhatsApp webhook:
         Set up ngrok tunnel: ngrok http 8000
         Set webhook URL in Twilio console
         Send message from WhatsApp to sandbox number

Step 10: Connect to Node.js backend
          → Node.js calls /agent/message on incoming WhatsApp
          → Or /agent/message/stream for SSE frontend
```

---

## What This Achieves vs v1

| Issue | v1 | v3 |
|---|---|---|
| 429 rate limit errors | Every 1-2 messages | Rare — Groq 30 RPM |
| Wrong information | Frequent | LangChain native MMR (`as_retriever`) + anti-hallucination rules |
| Web search not triggering | Broken | Explicit tool sequence rules |
| Images in response | Not implemented | Web image URLs via DuckDuckGo |
| Brochure links | Not implemented | Auto-scraped from developer sites |
| Out-of-scope handling | None | Graceful redirect + count tracking |
| WhatsApp formatting | Markdown leaking | Stripped, WhatsApp-native |
| SSE streaming | Broken | Word-by-word simulation |
| Testing | No test harness | Full CLI tester + 8 test cases |
| Competitor questions | Agent answers them | Hard blocked |
| Agent persona | Generic | Priya — Dobariya & Reneev consultant |
PROMPT_EOF