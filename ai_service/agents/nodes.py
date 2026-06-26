from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_mistralai import ChatMistralAI
from langchain_groq import ChatGroq
from agents.state import AgentState
from agents.tools import TOOLS
from utils.prompts import build_system_prompt
from utils.memory import prepare_conversation_context
from config.settings import settings
import time
import os
import re
from urllib.parse import urlparse

# Initialize LLMs
llm_primary = ChatMistralAI(
    model="mistral-small-latest",
    api_key=settings.mistral_api_key,
    temperature=0.0,
    max_tokens=500
)

llm_fallback = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=settings.groq_api_key,
    temperature=0.0,
    max_tokens=500
)

# Bind tools
llm_primary_with_tools = llm_primary.bind_tools(TOOLS)
llm_fallback_with_tools = llm_fallback.bind_tools(TOOLS)

_projects_cache = {}

def get_dynamic_projects(kb_id: str = "main-kb") -> list[tuple[str, list[str]]]:
    """Dynamically extracts project names and aliases from Chroma vector database sources."""
    now = time.time()
    # Cache for 60 seconds to avoid vectorstore lookups on every message
    cache_entry = _projects_cache.get(kb_id)
    if cache_entry and (now - cache_entry["timestamp"] < 60):
        return cache_entry["data"]

    from kb.ingestion.pdf_ingestor import get_chroma_db
    try:
        vectorstore = get_chroma_db(kb_id)
        collection = vectorstore._collection
        data = collection.get(include=["metadatas"])
        metas = data.get("metadatas", [])
    except Exception as e:
        print(f"Error accessing Chroma to get project list: {e}")
        return []

    sources = set()
    for meta in metas:
        src = meta.get("source")
        if src:
            sources.add(src)

    projects = []
    for src in sources:
        # Extract filename from URL if applicable
        name = src
        if name.startswith("http://") or name.startswith("https://"):
            name = os.path.basename(urlparse(name).path)
        # Remove file extension
        if "." in name:
            name = name.rsplit(".", 1)[0]
            
        # Clean name
        name_clean = name.replace("_", " ").replace("-", " ")
        for word in ["official", "brochure", "compressed", "pdf", "png", "jpg", "jpeg", "developer", "profile"]:
            name_clean = re.sub(rf'\b{word}\b', '', name_clean, flags=re.IGNORECASE)
        name_clean = re.sub(r'\s+', ' ', name_clean).strip()
        
        if not name_clean or name_clean.lower() in ["developer", "profile", "main", "kb"]:
            continue
            
        # Build keywords
        name_lower = name_clean.lower()
        keywords = [name_lower]
        if " " in name_lower:
            keywords.append(name_lower.replace(" ", "_"))
            keywords.append(name_lower.replace(" ", ""))
            parts = name_lower.split()
            for part in parts:
                if len(part) > 3 and part not in ["codename", "project"]:
                    keywords.append(part)
            # Special aliases for known common project names
            if "dear life" in name_lower:
                keywords.extend(["dear life", "dear_life"])
            if "page 22" in name_lower:
                keywords.extend(["page 22", "page_22", "page22"])
            if "levvel 7" in name_lower:
                keywords.extend(["levvel 7", "levvel_7", "levvel7"])
            if "forever young" in name_lower:
                keywords.extend(["forever young", "forever_young", "foreveryoung"])
            if "life in blue" in name_lower:
                keywords.extend(["life in blue", "life_in_blue"])
                
        keywords = list(set([kw for kw in keywords if kw]))
        projects.append((name_lower, keywords))

    _projects_cache[kb_id] = {
        "timestamp": now,
        "data": projects
    }
    return projects

def check_relevance(text: str, caption: str, url: str, kb_id: str = "main-kb") -> bool:
    text_lower = text.lower()
    caption_lower = caption.lower() if caption else ""
    url_lower = url.lower() if url else ""
    
    projects = get_dynamic_projects(kb_id)
    
    # Check if the asset itself belongs to a specific project
    asset_project = None
    for proj_id, keywords in projects:
        if any(kw in caption_lower or kw in url_lower for kw in keywords):
            asset_project = proj_id
            break
            
    # Check if the conversation text mentions any known project keywords
    any_project_in_text = any(
        any(kw in text_lower for kw in proj_kws)
        for _, proj_kws in projects
    )
            
    # If the asset is identified as belonging to a project,
    # it is ONLY relevant if that project is mentioned in the text
    if asset_project:
        proj_kws = next(kws for proj_id, kws in projects if proj_id == asset_project)
        return any(kw in text_lower for kw in proj_kws)
        
    # If the asset is unidentified (no project keywords in caption/url),
    # it passes through only if the conversation context is generic (no projects mentioned)
    return not any_project_in_text

def conversation_node(state: AgentState) -> dict:
    # Prepare conversation window (last 8 messages + cached summary)
    recent_messages, summary = prepare_conversation_context(
        messages=state["messages"],
        window_size=8,
        summary=state.get("conversation_summary", "")
    )

    # Build system prompt
    system_prompt = build_system_prompt(
        agent_name=state.get("agent_name", "Pranjal"),
        agent_tone=state.get("agent_tone", "friendly"),
        language=state.get("language", "en"),
        conversation_summary=summary,
        qualification_score=state.get("qualification_score", 0),
        stage=state.get("stage", "opener"),
        sentiment=state.get("sentiment", "neutral"),
        intent_signals=state.get("intent_signals", []),
        kb_id=state.get("kb_id") or "main-kb",
        lead_name=state.get("lead_name", "")
    )

    # Build message list
    lc_messages = [SystemMessage(content=system_prompt)]
    for msg in recent_messages:
        if msg["role"] == "lead":
            lc_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] in ["agent", "human"]:
            lc_messages.append(AIMessage(content=msg["content"]))

    max_retries = 3
    used_fallback = False
    images_found = list(state.get("images_to_send", []) or [])
    brochure_found = state.get("brochure_url")
    final_reply = ""

    # ReAct-style internal loop (max 5 cycles)
    current_messages = list(lc_messages)
    for cycle in range(5):
        used_fallback = False  # Reset fallback flag at the start of each cycle
        response = None
        for attempt in range(max_retries):
            try:
                if not used_fallback:
                    response = llm_primary_with_tools.invoke(current_messages)
                else:
                    response = llm_fallback_with_tools.invoke(current_messages)
                break
            except Exception as e:
                print(f"LLM call failed (cycle {cycle+1}, attempt {attempt+1}/3) model: {'llama-3.1-8b-instant' if used_fallback else 'mistral-small-latest'}, error: {e}")
                used_fallback = True  # switch to fallback on any exception
                if attempt < max_retries - 1:
                    time.sleep(1)
                else:
                    try:
                        response = llm_fallback_with_tools.invoke(current_messages)
                    except Exception as final_err:
                        print(f"LLM fallback also failed: {final_err}")
                        raise final_err

        if not response:
            break

        # If the model didn't call any tools, this is our final response!
        if not (hasattr(response, "tool_calls") and response.tool_calls):
            final_reply = response.content
            break

        # Monospaced tool execution logic is appended to current_messages
        current_messages.append(response)

        has_handoff = False
        handoff_reason = ""
        for tool_call in response.tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]

            # Execute tool
            result = execute_tool(tool_name, tool_args, state)
            current_messages.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))

            # Parse special results
            if tool_name == "search_knowledge_base":
                import json
                
                # Robustly attempt JSON parsing first
                parsed_json = None
                try:
                    stripped = result.strip()
                    if stripped.startswith(('[', '{')):
                        parsed_json = json.loads(stripped)
                except Exception:
                    pass
                
                if parsed_json:
                    def extract_from_json(data):
                        nonlocal brochure_found
                        if isinstance(data, dict):
                            url = data.get("url") or data.get("image") or data.get("brochure")
                            if url and isinstance(url, str) and url.startswith("http"):
                                url_clean = url.strip(".,[]()")
                                caption = data.get("caption") or data.get("description") or "Project Photo"
                                is_brochure = "brochure" in data or url_clean.endswith(".pdf") or "brochure" in url_clean.lower()
                                if is_brochure:
                                    if not brochure_found:
                                        brochure_found = url_clean
                                else:
                                    exists = any(isinstance(item, dict) and item.get("url") == url_clean for item in images_found)
                                    if not exists:
                                        images_found.append({"url": url_clean, "caption": caption})
                            for v in data.values():
                                extract_from_json(v)
                        elif isinstance(data, list):
                            for item in data:
                                extract_from_json(item)
                    extract_from_json(parsed_json)
                
                # Fallback to robust line-by-line and regex URL scanning
                urls = re.findall(r'https?://[^\s|#|\|]+', result)
                for url in urls:
                    url_clean = url.strip(".,[]()\"'")
                    if url_clean.endswith(".pdf") or "brochure" in url_clean.lower():
                        if not brochure_found:
                            brochure_found = url_clean
                    elif any(url_clean.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp", ".gif"]) or any(kw in url_clean.lower() for kw in ["image", "photo"]):
                        caption = "Project Photo"
                        # Search for description on the matching line in raw result
                        for line in result.split("\n"):
                            if url_clean in line:
                                match_desc = re.search(r'(?:Description|Caption):\s*(.+)$', line, re.IGNORECASE)
                                if match_desc:
                                    caption = match_desc.group(1).strip(".,[]()\"'")
                                    break
                        exists = any(isinstance(item, dict) and item.get("url") == url_clean for item in images_found)
                        if not exists:
                            images_found.append({"url": url_clean, "caption": caption})
            elif tool_name == "flag_human_handoff":
                has_handoff = True
                handoff_reason = tool_args.get("reason", "Lead requested human")

        if has_handoff:
            return {
                "human_handoff": True,
                "handoff_reason": handoff_reason,
                "last_agent_message": "Let me connect you with one of our senior consultants right away. They'll be in touch shortly! 🙏",
                "messages": [{"role": "agent", "content": "Let me connect you with one of our senior consultants right away. They'll be in touch shortly! 🙏"}],
                "stage": "handoff",
                "qualification_score": state.get("qualification_score", 0),
                "intent_signals": state.get("intent_signals", []),
                "task_complete": True
            }

    if not final_reply and response and response.content:
        final_reply = response.content

    if not final_reply:
        print(f"[Warning] ReAct loop exhausted all 5 cycles without producing a text reply for lead {state.get('lead_id')}.")
        final_reply = "I'm looking into that for you. Could you give me just a moment? 🙏"

    # Qualification scoring
    signal_map = {
        "asked_price": 1, "mentioned_budget": 1, "mentioned_timeline": 1,
        "is_decision_maker": 1, "specific_project_interest": 1
    }

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

    # Format reply for WhatsApp
    from utils.formatters import format_for_whatsapp
    
    # Filter images and brochures based on conversation context (latest user message + agent response)
    user_msg = state["messages"][-1]["content"] if state["messages"] else ""
    context_text = f"{user_msg} {final_reply}"
    kb_id = state.get("kb_id") or "main-kb"
    
    filtered_images = []
    for img in images_found:
        url = img.get("url") if isinstance(img, dict) else img
        caption = img.get("caption") if isinstance(img, dict) else ""
        if check_relevance(context_text, caption, url, kb_id):
            filtered_images.append(img)
            
    filtered_brochure = brochure_found
    if brochure_found:
        if not check_relevance(context_text, "brochure", brochure_found, kb_id):
            filtered_brochure = None
            
    formatted_reply = format_for_whatsapp(
        reply=final_reply,
        brochure_url=filtered_brochure,
        has_images=len(filtered_images) > 0
    )

    return {
        "messages": [{"role": "agent", "content": formatted_reply}],
        "last_agent_message": formatted_reply,
        "qualification_score": score,
        "intent_signals": new_signals,
        "stage": determine_stage(score, state.get("stage", "opener")),
        "human_handoff": False,
        "images_to_send": filtered_images,
        "brochure_url": filtered_brochure,
        "task_complete": False
    }

def execute_tool(tool_name: str, tool_args: dict, state: AgentState) -> str:
    """Execute a tool by name with given arguments."""
    from agents.tools import (
        search_knowledge_base, flag_human_handoff,
        get_available_slots, book_site_visit
    )
    tool_map = {
        "search_knowledge_base": search_knowledge_base,
        "flag_human_handoff": flag_human_handoff,
        "get_available_slots": get_available_slots,
        "book_site_visit": book_site_visit
    }
    tool_fn = tool_map.get(tool_name)
    if not tool_fn:
        return f"Unknown tool: {tool_name}"
    
    # Inject lead_id/kb_id/etc. if needed by tool parameters but not generated by LLM
    if tool_name == "search_knowledge_base":
        if not tool_args.get("kb_id") or tool_args["kb_id"] == "null" or tool_args["kb_id"] == "None":
            tool_args["kb_id"] = state.get("kb_id") or "main-kb"
    if tool_name == "flag_human_handoff" and "lead_id" not in tool_args:
        tool_args["lead_id"] = state.get("lead_id", "test_lead")
    if tool_name == "get_available_slots" and "business_id" not in tool_args:
        tool_args["business_id"] = state.get("business_id", "default")
    if tool_name == "book_site_visit":
        if "business_id" not in tool_args:
            tool_args["business_id"] = state.get("business_id", "default")
        if "phone" not in tool_args:
            tool_args["phone"] = state.get("lead_phone") or state.get("lead_id") or ""
    
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

def escalation_node(state: AgentState) -> dict:
    """
    Fires when lead qualifies or requests human.
    Note: The actual downstream handoff notifications, DB status updates,
    and CRM writes are managed in the webhook handler (e.g. whatsapp.js).
    """
    farewell = (
        f"Thank you {state.get('lead_name', 'for your interest')}! 🙏\n"
        f"Our senior consultant will reach out to you shortly "
        f"to discuss further. Have a great day!"
    )
    return {
        "messages": [{"role": "agent", "content": farewell}],
        "last_agent_message": farewell,
        "stage": "handoff",
        "qualification_score": state.get("qualification_score", 0),
        "intent_signals": state.get("intent_signals", []),
        "human_handoff": True,
        "task_complete": True
    }
