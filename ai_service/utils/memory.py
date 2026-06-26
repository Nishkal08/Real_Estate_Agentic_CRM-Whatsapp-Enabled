def get_recent_messages(messages: list, limit: int = 8) -> list:
    """Returns the most recent N messages to keep context window manageable."""
    return messages[-limit:]

def prepare_conversation_context(messages: list, window_size: int = 8, summary: str = "") -> tuple[list, str]:
    """
    Prepares conversational context for the LLM.
    Filters out any non-conversational roles (e.g. 'tool') to maintain a clean history.
    """
    conversational = [m for m in messages if m.get("role") in ["lead", "agent", "human"]]
    recent = conversational[-window_size:]
    return recent, summary
