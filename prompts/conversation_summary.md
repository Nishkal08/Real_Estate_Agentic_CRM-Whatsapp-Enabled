# AI Agent Project Summary & Handover Context

This document summarizes the progress, architectural choices, and current state of the AI Real Estate Agent project. Use this context to seamlessly start a new conversation.

## 1. Project Goal & Architecture
We are building a highly capable **AI Sales and Conversation Agent** for a real estate firm, specifically tailored to the **Aryan Group**.
- **Framework**: FastAPI (Backend) + LangGraph (Agent workflows) + Vite/React (Frontend).
- **Core LLM**: Upgraded to **Mistral Medium** (`mistral-medium-latest`) via `langchain-mistralai` for robust tool calling and logical reasoning.
- **Agent Roles**:
  - `lead_agent`: Handles sales, qualification scoring, and booking slots.
  - `conversation_agent`: Handles customer support and general inquiries.

## 2. Key Accomplishments
- **Domain Adaptation**: Hardcoded the default company context across the system to exclusively represent the **Aryan Group**, focusing on luxury residential and commercial properties. The agent will decline inquiries outside this scope.
- **State Management**: LangGraph checkpointer is fully integrated to maintain conversational memory across threads.
- **500 Error Resolution**: Fixed a major bug where `ChatMistralAI` threw a 400/500 error when receiving `AIMessage` objects with empty `content` strings alongside `tool_calls`. The graph nodes now correctly handle Mistral's strict validation.
- **Stream Integration**: Built a FastAPI streaming endpoint (`/agent/stream`) utilizing Server-Sent Events (SSE) to stream tokens to the frontend UI in real time.

## 3. Current Active Bug (Requires Immediate Fix)
**The UI Text Duplication Issue ("HelloHello!!")**:
- **Symptom**: When using the AI Sandbox UI, the agent's text responses occasionally stream duplicated chunks (e.g., "Welcome to Ary! Welcome to Aryan Group.").
- **Root Cause**: The `astream_events` (v2) from LangGraph is emitting `on_chat_model_stream` events from BOTH the inner `ChatMistralAI` node and the outer `RunnableBinding` (the tool-wrapper node).
- **Current Attempt**: We added a filter in `routers/agent.py` to only yield chunks if `event["name"].startswith("Chat")`. However, the duplication is still bypassing the filter.
- **Next Step**: The next session must identify the exact `event["name"]` for the inner model vs the wrapper by checking the FastAPI logs, and tighten the filter in `routers/agent.py` so only a single unique event source is yielded.

## 4. Next Steps for New Session
1. **Fix the Stream Duplication Bug**: Check the printed `STREAM EVENT NAME` in the backend logs (added in `routers/agent.py`) and write a strict filter to stop double-streaming.
2. **Postman MCP Testing**: We installed the Postman MCP server. In the new session, you can utilize it to run automated test suites against the `/agent/message` and `/agent/stream` endpoints.
3. **Frontend Sandbox Polish**: Clean up the UI chat window to ensure thread IDs are correctly managed so conversations don't bleed or crash.
