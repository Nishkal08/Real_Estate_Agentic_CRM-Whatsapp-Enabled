from langgraph.graph import StateGraph, END
from agents.state import AgentState
from agents.nodes import conversation_node, escalation_node
from checkpointer import get_checkpointer

def should_continue(state: dict) -> str:
    """Routing logic."""
    if state.get("human_handoff"):
        return "escalate"
    
    # If the last message(s) are from tools, route back to agent
    messages = state.get("messages", [])
    if messages and messages[-1].get("role") == "tool":
        return "agent"
        
    return "end"

def build_agent_graph() -> StateGraph:
    """Constructs the LangGraph."""
    graph = StateGraph(AgentState)
    
    graph.add_node("agent", conversation_node)
    graph.add_node("escalate", escalation_node)
    
    graph.set_entry_point("agent")
    
    graph.add_conditional_edges(
        "agent",
        should_continue,
        {
            "escalate": "escalate",
            "agent": "agent",
            "end": END
        }
    )
    
    graph.add_edge("escalate", END)
    
    checkpointer = get_checkpointer()
    return graph.compile(checkpointer=checkpointer)
