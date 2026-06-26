# AI Service — Complete Improvement & Overhaul Prompt
**Version:** 2.0  
**Role:** Senior GenAI Engineer + Backend Developer  
**Domain:** Real estate lead engagement agent (current testing) → scalable to any business

> Read this entire document before touching a single line of code.
> This is not a patch prompt — it is a full architectural upgrade directive.

---

## Current State — Honest Diagnosis

### What was built (v1)
- Dual LangGraph agent system (lead_agent + conversation_agent)
- Mistral AI as LLM via ChatMistralAI
- ChromaDB for RAG
- DuckDuckGo web search as fallback
- Conversation summarization (keep last 6 messages, summarize the rest)
- Custom 429 retry loop with exponential backoff
- SSE for streaming

### Root Cause of Every Problem

Every issue traces back to **one architectural mistake: too many sequential LLM calls per user message.**

Current flow per message:
```
user message → main LLM call → tool call → LLM call again
            → qualify_node LLM call (parallel)
            → summarizer LLM call (parallel)
= 3-4 Mistral API calls per single user message
```

Mistral free tier = 1 request/second.
3-4 calls = guaranteed 429 after every 1-2 messages.
This is not a retry problem. This is a design problem.

---

## Fix 1 — LLM Provider Strategy (Most Critical)

### Recommended Stack

**Switch primary LLM from Mistral to Groq (Llama 3.3 70B).**

Why Groq:
- 30 requests/minute free (vs Mistral's 1/second)
- 14,400 requests/day free
- Runs at 300+ tokens/second (fastest inference available free)
- OpenAI-compatible API — drop-in replacement, no LangChain changes needed
- No credit card required

**Keep Mistral ONLY for embeddings** (mistral-embed) — it's excellent at this and the embedding endpoint has a much more generous rate limit (500,000 tokens/minute).

```python
# config/settings.py — updated

# PRIMARY LLM: Groq (Llama 3.3 70B) — high rate limits, fast
from langchain_groq import ChatGroq

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    groq_api_key=settings.groq_api_key,
    temperature=0.3,
    max_tokens=1024,
)

# FAST LLM for background tasks (qualify, summarize) — smaller, faster
llm_fast = ChatGroq(
    model="llama-3.1-8b-instant",   # faster, cheaper on rate limits
    groq_api_key=settings.groq_api_key,
    temperature=0,
    max_tokens=256,
)

# EMBEDDINGS: Keep Mistral — best quality free embeddings
from langchain_mistralai import MistralAIEmbeddings
embeddings = MistralAIEmbeddings(
    model="mistral-embed",
    mistral_api_key=settings.mistral_api_key
)
```

### Fallback Chain (OpenRouter as safety net)

```python
# If Groq hits limits → fallback to OpenRouter free models
from langchain_openai import ChatOpenAI

llm_fallback = ChatOpenAI(
    model="meta-llama/llama-3.3-70b-instruct:free",
    api_key=settings.openrouter_api_key,
    base_url="https://openrouter.ai/api/v1",
    temperature=0.3,
)

# Smart routing
def get_llm(task: str = "main"):
    """Returns appropriate LLM based on task type and current availability."""
    if task == "background":
        return llm_fast          # qualify, summarize — use small fast model
    return llm                   # main conversation — use 70B
```

### Updated .env
```env
GROQ_API_KEY=your_groq_key           # get free at console.groq.com
MISTRAL_API_KEY=your_mistral_key     # keep for embeddings only
OPENROUTER_API_KEY=your_key          # fallback, get free at openrouter.ai
```

### Install
```bash
pip install langchain-groq
```

---

## Fix 2 — Eliminate Redundant LLM Calls (Architecture Fix)

### Current problem
Three separate LLM calls happen per message:
1. Main conversation response
2. Qualification scoring (separate LLM call)
3. Conversation summarization (separate LLM call)

### Fix: Single-pass structured output

Make the main LLM call return BOTH the reply AND the qualification signals in one response using structured output. Zero extra calls.

```python
# nodes.py — single pass approach

from pydantic import BaseModel
from typing import List, Optional

class AgentResponse(BaseModel):
    """Structured output from a single LLM call."""
    reply: str                          # the actual message to send to lead
    qualification_signals: List[str]    # ["asked_price", "mentioned_timeline"]
    detected_stage: str                 # opener|nurturing|objection|qualified|cold
    wants_human: bool                   # true if lead explicitly asks for human
    sentiment: str                      # positive|neutral|negative|frustrated
    kb_search_needed: bool              # hint: should we search KB for next turn?

# Bind structured output to LLM
llm_structured = llm.with_structured_output(AgentResponse)

def conversation_node(state: LeadState) -> dict:
    system_prompt = build_lead_system_prompt(state)

    lc_messages = [SystemMessage(content=system_prompt)]
    for msg in state["messages"][-8:]:  # last 8 messages only
        if msg["role"] == "lead":
            lc_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] in ["agent", "human"]:
            lc_messages.append(AIMessage(content=msg["content"]))

    response: AgentResponse = llm_structured.invoke(lc_messages)

    # Calculate score from signals
    signal_scores = {
        "asked_price": 1, "mentioned_budget": 1,
        "mentioned_timeline": 1, "is_decision_maker": 1,
        "specific_project_interest": 1
    }
    score = sum(signal_scores.get(s, 0) for s in response.qualification_signals)
    score = min(score, 4)

    needs_handoff = response.wants_human or score >= 3

    return {
        "messages": [{"role": "agent", "content": response.reply}],
        "last_agent_message": response.reply,
        "qualification_score": score,
        "intent_signals": response.qualification_signals,
        "stage": response.detected_stage,
        "human_handoff": needs_handoff,
        "sentiment": response.sentiment,
    }
```

**Result: 3-4 LLM calls per message → 1 LLM call per message.**
429 errors drop by 75% immediately.

---

## Fix 3 — Conversation Memory (Replace Summarization)

### Current problem
Summarization requires an extra LLM call. With Mistral's 1 req/sec limit, this kills performance.

### Fix: Sliding window + cached summary (no extra LLM call)

```python
# utils/memory.py

def prepare_conversation_context(
    messages: list,
    window_size: int = 8,
    summary: str = ""
) -> tuple[list, str]:
    """
    Returns last N messages + prepends cached summary.
    Summary is only regenerated every 10 messages (not every turn).
    No extra LLM call unless threshold hit.
    """
    if len(messages) <= window_size:
        return messages, summary

    # Use cached summary — don't regenerate every turn
    recent = messages[-window_size:]
    return recent, summary


def should_update_summary(messages: list, last_summary_at: int) -> bool:
    """Only summarize every 10 messages, not every turn."""
    return len(messages) - last_summary_at >= 10
```

```python
# In nodes.py — summary update runs AFTER main response, asynchronously
# Never blocks the main conversation thread

import asyncio

async def update_summary_async(state: LeadState) -> str:
    """Background task — runs after reply is sent. Never blocks user."""
    if not should_update_summary(state["messages"], state.get("last_summary_at", 0)):
        return state.get("conversation_summary", "")

    old_messages = state["messages"][:-8]
    text = "\n".join([f"{m['role']}: {m['content']}" for m in old_messages])

    # Use FAST small model for summarization — not the main 70B
    summary_prompt = f"""
Summarize this conversation in 2-3 sentences. 
Focus on: what the lead is interested in, concerns raised, information provided.
Keep names and specific project/location details.

Conversation:
{text}

Summary:"""

    response = llm_fast.invoke([HumanMessage(content=summary_prompt)])
    return response.content
```

---

## Fix 4 — RAG Pipeline Overhaul (Wrong Information Fix)

### Current problem
Wrong information is returned because:
1. Chunks split at wrong boundaries — a fact starts in chunk N and ends in chunk N+1
2. Cosine similarity retrieves topically similar but factually wrong chunks
3. No re-ranking — first 4 results returned regardless of actual relevance quality

### Fix: Smarter chunking + re-ranking + source citation

```python
# kb/embedder.py — improved chunking

from pypdf import PdfReader

def chunk_text_smart(text: str) -> list[str]:
    """
    Semantic-aware chunking:
    - Splits on paragraph boundaries, not arbitrary word count
    - Keeps sentences whole — never splits mid-sentence
    - Overlaps at paragraph level, not word level
    """
    import re

    # Split on double newlines (paragraph breaks)
    paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]

    chunks = []
    current_chunk = []
    current_length = 0
    max_chunk_words = 400

    for para in paragraphs:
        para_words = len(para.split())

        if current_length + para_words > max_chunk_words and current_chunk:
            # Save current chunk
            chunks.append("\n\n".join(current_chunk))
            # Overlap: keep last paragraph in next chunk
            current_chunk = [current_chunk[-1], para]
            current_length = len(current_chunk[-1].split()) + para_words
        else:
            current_chunk.append(para)
            current_length += para_words

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks


def embed_pdf_v2(file_path: str, kb_id: str) -> dict:
    """Improved PDF embedding with metadata preservation."""
    reader = PdfReader(file_path)

    # Extract with page numbers preserved
    pages_text = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        if text.strip():
            pages_text.append({"page": i + 1, "text": text})

    # Chunk with page metadata
    all_chunks = []
    for page_data in pages_text:
        page_chunks = chunk_text_smart(page_data["text"])
        for chunk in page_chunks:
            all_chunks.append({
                "text": chunk,
                "page": page_data["page"],
                "kb_id": kb_id
            })

    # Delete old collection — UUID-based names always
    collection_name = f"kb_{kb_id.replace('-', '_')}"
    try:
        chroma_client.delete_collection(collection_name)
    except Exception:
        pass

    collection = chroma_client.create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"}
    )

    # Embed in batches
    batch_size = 32
    for i in range(0, len(all_chunks), batch_size):
        batch = all_chunks[i:i + batch_size]
        texts = [c["text"] for c in batch]
        vectors = embeddings_model.embed_documents(texts)
        collection.add(
            ids=[f"{kb_id}_{i + j}" for j in range(len(batch))],
            embeddings=vectors,
            documents=texts,
            metadatas=[{"kb_id": c["kb_id"], "page": c["page"]} for c in batch]
        )

    return {"collection_name": collection_name, "chunk_count": len(all_chunks)}
```

```python
# kb/retriever.py — with re-ranking and source citation

def retrieve_context(query: str, kb_id: str, k: int = 6) -> tuple[str, list]:
    """
    Returns (context_string, sources_list)
    Retrieves k=6, then re-ranks to return top 3 most relevant.
    """
    collection_name = f"kb_{kb_id.replace('-', '_')}"
    try:
        collection = chroma_client.get_collection(collection_name)
    except Exception:
        return "No knowledge base found.", []

    query_vector = embeddings_model.embed_query(query)

    # Retrieve more than needed — then re-rank
    results = collection.query(
        query_embeddings=[query_vector],
        n_results=min(k, collection.count()),
        include=["documents", "metadatas", "distances"]
    )

    if not results["documents"][0]:
        return "No relevant information found.", []

    docs = results["documents"][0]
    metas = results["metadatas"][0]
    distances = results["distances"][0]

    # Filter out low-relevance chunks (distance > 0.7 = not similar enough)
    filtered = [
        (doc, meta, dist)
        for doc, meta, dist in zip(docs, metas, distances)
        if dist < 0.7
    ]

    if not filtered:
        return "No relevant information found.", []

    # Format with source citation
    context_parts = []
    sources = []
    for i, (doc, meta, dist) in enumerate(filtered[:3]):
        page_ref = f"[Page {meta.get('page', '?')}]"
        context_parts.append(f"{page_ref}\n{doc}")
        sources.append({"page": meta.get("page"), "relevance": round(1 - dist, 2)})

    return "\n\n---\n\n".join(context_parts), sources
```

---

## Fix 5 — Web Search Fallback (Make It Actually Work)

### Current problem
The web search tool exists but the LLM doesn't trigger it because the instruction is buried in the prompt and the agent doesn't clearly understand when to use it.

### Fix: Explicit decision node + better tool definition

```python
# agents/lead_agent/tools.py

@tool
def search_knowledge_base(query: str, kb_id: str) -> str:
    """
    ALWAYS call this first for ANY question about:
    - Project names, locations, configurations
    - Pricing, payment plans, EMI
    - Amenities, possession dates, developer info
    - Any factual claim about the business or its products

    Returns relevant information or 'No relevant information found.'
    """
    context, sources = retrieve_context(query, kb_id)
    if sources:
        return f"{context}\n\n[Sources: {sources}]"
    return "No relevant information found."


@tool
def search_web_for_projects(query: str) -> str:
    """
    ONLY call this if search_knowledge_base returns 'No relevant information found.'
    Use for: developer group info, RERA details, location facts, market rates.
    NEVER use this to invent or guess project-specific details.
    Prefix all web-sourced info with: 'Based on publicly available information:'
    """
    from duckduckgo_search import DDGS
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=3))
        if not results:
            return "No web results found."

        formatted = []
        for r in results:
            formatted.append(f"Source: {r.get('href', '')}\n{r.get('body', '')}")

        return "Based on publicly available information:\n\n" + "\n\n---\n\n".join(formatted)
    except Exception as e:
        return f"Web search unavailable: {str(e)}"
```

```python
# utils/prompts.py — explicit tool use instructions

TOOL_USE_RULES = """
TOOL USE — STRICT RULES:
1. For EVERY factual question → call search_knowledge_base FIRST
2. If search_knowledge_base returns 'No relevant information found' → call search_web_for_projects
3. NEVER answer factual questions from memory alone
4. NEVER mix KB info with web info without clearly labeling the source
5. If neither KB nor web has the answer → say 'I'll need to check with our team on that specific detail'
"""
```

---

## Fix 6 — Response Formatting (Human-like + Readable)

### Current problem
Agent replies are either too long and paragraph-heavy, or too short and robotic. No consistent formatting. Doesn't feel human.

### Fix: Response format instructions in system prompt

```python
# utils/prompts.py

FORMATTING_RULES = """
RESPONSE FORMATTING — FOLLOW EXACTLY:

LENGTH:
- First response to a new topic: 2-3 sentences max
- Answering a specific question: answer + 1 follow-up question
- Sharing details (pricing, specs): use short bullet points, not paragraphs
- Never write more than 4 lines without a line break

STRUCTURE:
- Lead with the most important info first
- Use line breaks between distinct points
- Use bullet points (•) for lists of 3+ items
- Never use markdown headers (##) or bold (**text**) — this is WhatsApp
- Use emojis sparingly — 1 per message maximum, only when natural

TONE — READ THIS CAREFULLY:
- Sound like a knowledgeable friend, not a brochure
- Ask ONE question at a time, never stack multiple questions
- Acknowledge what the lead said before answering
- Use the lead's name naturally — once every 3-4 messages, not every message
- When giving prices: always give context (EMI options, what's included)
- When you don't know something: "Let me check on that" not "I don't have that information"

NEVER DO:
- Never say "Certainly!", "Absolutely!", "Great question!"
- Never start with "As an AI..." or "I'm here to help..."
- Never repeat the same information twice in one message
- Never end every message with "Is there anything else?" — vary your closings
- Never use corporate speak: "cutting-edge", "state-of-the-art", "world-class"

REAL ESTATE SPECIFIC:
- When discussing prices: mention possession timeline in same breath
- When mentioning amenities: connect to lifestyle benefit, not just list features
- When asked about developer: only state what KB confirms — never assume group associations
- When asked about location: mention connectivity + upcoming infrastructure
"""
```

---

## Fix 7 — SSE Streaming (Make It Feel Like ChatGPT)

### Current problem
SSE sends the full response after generation completes — feels slow and robotic. No word-by-word streaming.

### Fix: True token streaming via Groq's streaming API

```python
# main.py — streaming endpoint

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import json
import asyncio

@app.post("/agent/message/stream")
async def handle_message_stream(payload: AgentMessageRequest):
    """
    Streams agent response token by token.
    Frontend receives words as they are generated — feels instant.
    """
    async def generate():
        config = {"configurable": {"thread_id": payload.thread_id}}

        # Step 1: Retrieve KB context (before streaming starts)
        kb_context, sources = retrieve_context(
            payload.message,
            payload.kb_id,
            k=4
        )

        # Step 2: Check if web search needed
        if "No relevant information found" in kb_context:
            # Send a "thinking" event to frontend
            yield f"data: {json.dumps({'type': 'thinking', 'text': 'Searching for more info...'})}\n\n"
            await asyncio.sleep(0.1)
            web_results = search_web_for_projects.invoke({"query": payload.message})
            kb_context = web_results

        # Step 3: Build messages
        system_prompt = build_lead_system_prompt_with_context(
            state=payload,
            company_context=kb_context
        )

        messages = build_message_history(payload.thread_id, system_prompt)

        # Step 4: Stream from Groq
        full_response = ""
        async for chunk in llm.astream(messages):
            if chunk.content:
                full_response += chunk.content
                yield f"data: {json.dumps({'type': 'token', 'text': chunk.content})}\n\n"

        # Step 5: After streaming — run qualification silently
        yield f"data: {json.dumps({'type': 'done', 'text': ''})}\n\n"

        # Step 6: Background qualification (non-blocking)
        asyncio.create_task(
            run_qualification_async(payload.thread_id, full_response, payload)
        )

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


async def run_qualification_async(thread_id: str, full_response: str, payload):
    """
    Runs after response is already sent to user.
    Updates qualification score, stage, intent signals in DB.
    Never blocks the main conversation thread.
    Uses FAST small model — not the main 70B.
    """
    try:
        last_messages = get_last_messages(thread_id, n=6)
        signals = await qualify_conversation_async(last_messages, llm_fast)
        await update_lead_qualification(payload.lead_id, signals)
    except Exception:
        pass  # Graceful failure — never crash main thread
```

```python
# Frontend — how to consume SSE stream (JavaScript)

const response = await fetch('/agent/message/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let agentMessage = '';

while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n\n').filter(l => l.startsWith('data: '));

    for (const line of lines) {
        const data = JSON.parse(line.slice(6));

        if (data.type === 'thinking') {
            // Show "Agent is searching..." indicator
            setAgentThinking(data.text);
        }
        else if (data.type === 'token') {
            // Append word by word — ChatGPT style
            agentMessage += data.text;
            setCurrentMessage(agentMessage);
        }
        else if (data.type === 'done') {
            // Finalize message
            setMessages(prev => [...prev, { role: 'agent', content: agentMessage }]);
            setAgentThinking(null);
        }
    }
}
```

---

## Fix 8 — Anti-Hallucination (Real Estate Specific)

This is critical for real estate — wrong developer group associations destroy trust.

```python
# utils/prompts.py

ANTI_HALLUCINATION_RULES = """
FACTUAL ACCURACY — NON-NEGOTIABLE:

DEVELOPER GROUPS:
- NEVER associate a project with a developer group unless the KB explicitly states it
- If asked "Is this a Godrej/Lodha/Prestige project?" and KB doesn't confirm → say:
  "I want to make sure I give you accurate information on that — let me verify the exact details"
- Do NOT guess based on project name similarity

PRICING:
- Only quote prices from KB
- If KB has a price range → give the range, don't pick one number
- Always add: "Prices are subject to change — I'll confirm the current rates"

POSSESSION DATES:
- Only state what KB explicitly mentions
- If not in KB → "Possession timeline is something I'd want to confirm directly"

RERA NUMBERS:
- Never invent or guess RERA registration numbers
- If asked → "I can get you the official RERA number — let me confirm that"

COMPARISON WITH OTHER PROJECTS:
- Never compare or rank against competitor projects
- Redirect: "I can share what makes this project stand out specifically"
"""
```

---

## Fix 9 — Sentiment-Aware Escalation

Currently the agent only escalates when lead explicitly says "call me". It misses frustrated leads.

```python
# agents/lead_agent/nodes.py — add to conversation_node output

class AgentResponse(BaseModel):
    reply: str
    qualification_signals: List[str]
    detected_stage: str
    wants_human: bool
    sentiment: str          # positive | neutral | negative | frustrated | angry
    confidence: float       # 0.0-1.0 — how confident agent is in its answer
    kb_search_needed: bool

# In graph router — escalate on frustration too
def route_after_qualify(state: LeadState) -> str:
    if state.get("human_handoff"):
        return "escalate"
    if state.get("stage") == "qualified":
        return "escalate"
    if state.get("sentiment") in ["frustrated", "angry"]:
        return "escalate"   # Don't make angry leads angrier with bot replies
    if state.get("confidence", 1.0) < 0.4:
        return "escalate"   # Agent not confident → better to pass to human
    return "end"
```

---

## Fix 10 — Response Caching (Eliminate Duplicate API Calls)

Same question asked by many leads = same KB retrieval + same LLM response.

```python
# utils/cache.py

import hashlib
import json
from functools import lru_cache

# In-memory cache (use Redis in production)
_response_cache = {}
_kb_cache = {}

def get_cache_key(query: str, kb_id: str) -> str:
    return hashlib.md5(f"{query.lower().strip()}_{kb_id}".encode()).hexdigest()

def get_cached_kb_result(query: str, kb_id: str) -> str | None:
    key = get_cache_key(query, kb_id)
    return _kb_cache.get(key)

def cache_kb_result(query: str, kb_id: str, result: str, ttl_seconds: int = 3600):
    key = get_cache_key(query, kb_id)
    _kb_cache[key] = result  # Add TTL logic if using Redis

# Usage in retriever
def retrieve_context_cached(query: str, kb_id: str) -> tuple[str, list]:
    cached = get_cached_kb_result(query, kb_id)
    if cached:
        return cached, []
    result, sources = retrieve_context(query, kb_id)
    if "No relevant information found" not in result:
        cache_kb_result(query, kb_id, result)
    return result, sources
```

---

## Complete Updated System Prompt Template

```python
# utils/prompts.py — build_lead_system_prompt()

def build_lead_system_prompt(state) -> str:
    return f"""You are Priya, a sales consultant at this real estate company.

COMPANY KNOWLEDGE BASE:
{state.get('company_context', 'No context loaded yet.')}

CONVERSATION SUMMARY (earlier messages):
{state.get('conversation_summary', 'New conversation.')}

YOUR IDENTITY:
- Name: Priya (or whatever name the business configures)
- Role: Sales consultant — knowledgeable, helpful, honest
- You are NOT a bot. You are a human consultant.
- If asked directly "are you a bot/AI?" → say: "I'm a sales consultant here to help you — what would you like to know about the project?"

CURRENT LEAD CONTEXT:
- Name: {state.get('lead_name', 'the lead')}
- Qualification score: {state.get('qualification_score', 0)}/4
- Stage: {state.get('stage', 'opener')}
- Detected sentiment: {state.get('sentiment', 'neutral')}
- Previous signals: {', '.join(state.get('intent_signals', [])) or 'none yet'}

{TOOL_USE_RULES}

{ANTI_HALLUCINATION_RULES}

{FORMATTING_RULES}

QUALIFICATION GOAL (do this subtly, never directly ask):
Naturally discover: budget range, purchase timeline, decision-making authority, specific interest in a project/configuration.
Score updates automatically — focus on helping, not interrogating.

CURRENT TASK:
Respond to the lead's latest message. Be helpful, honest, and human.
"""
```

---

## Updated requirements.txt

```txt
# Core
fastapi
uvicorn[standard]
python-dotenv
pydantic-settings
pydantic

# LangChain — NO langchain_community
langchain-core
langchain-groq          # PRIMARY LLM — replace ChatMistralAI for conversation
langchain-mistralai     # KEEP for embeddings only
langgraph
langgraph-checkpoint-postgres

# Vector DB
chromadb
pypdf

# Web search fallback
duckduckgo-search

# Utilities
psycopg2-binary
python-multipart
httpx
```

---

## Migration Steps — Do These In Order

```
Step 1: Install langchain-groq, get free Groq API key
         → Test basic ChatGroq call in isolation
         → Confirm 30 RPM limit is working

Step 2: Replace ChatMistralAI with ChatGroq in config/settings.py
         → Keep MistralAIEmbeddings untouched
         → Run existing tests — confirm no regressions

Step 3: Implement single-pass structured output (Fix 2)
         → Remove qualify_node as separate LLM call
         → Move qualification into AgentResponse schema
         → Verify score calculation logic

Step 4: Improve chunking strategy (Fix 4)
         → Re-embed existing PDFs with new chunker
         → Test retrieval quality on known questions
         → Verify no wrong developer group associations

Step 5: Fix web search tool invocation (Fix 5)
         → Test with a question definitely not in KB
         → Verify "Based on publicly available information:" prefix appears
         → Verify KB is always checked BEFORE web search

Step 6: Update system prompt with formatting + anti-hallucination rules (Fix 6, Fix 8)
         → Run 10 test conversations
         → Check: no "Certainly!", no markdown, no fabricated facts

Step 7: Implement streaming endpoint (Fix 7)
         → Test /agent/message/stream endpoint
         → Connect frontend SSE consumer
         → Verify token-by-token delivery

Step 8: Add sentiment escalation (Fix 9)
         → Test with frustrated language
         → Verify escalation triggers correctly

Step 9: Add response caching (Fix 10)
         → Test same question twice — second should be instant
```

---

## What This Achieves

| Problem | Before | After |
|---|---|---|
| 429 errors | Every 1-2 messages | Rare — 30 RPM headroom |
| LLM calls per message | 3-4 | 1 |
| Wrong information | Frequent | Rare — re-ranked + filtered |
| Web search not triggering | Broken | Explicit tool rules |
| Response formatting | Inconsistent | Structured, WhatsApp-native |
| Streaming | Full response at once | Token-by-token like ChatGPT |
| Angry lead handling | Ignored | Auto-escalate to human |
| Repeated KB lookups | Every time | Cached for 1 hour |
| Developer group hallucination | Common | Blocked by strict rules |