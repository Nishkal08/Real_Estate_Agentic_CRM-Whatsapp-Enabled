import re
from langchain_core.tools import tool
from kb.retriever import retrieve_context
from typing import Optional
from config.settings import settings


@tool
def search_knowledge_base(query: str, kb_id: str) -> str:
    """
    PRIMARY tool. ALWAYS call this first for ANY question about:
    - Horizon Group projects, locations, configurations
    - Pricing, payment plans, EMI options
    - Amenities, specifications, possession dates
    - Developer group information, RERA details
    - Any factual claim about projects or developers

    Returns relevant text from the knowledge base.
    """
    context, sources = retrieve_context(query=query, kb_id=kb_id)
    if sources:
        return f"{context}\n\n[Retrieved from KB — {len(sources)} sources]"
    return "No relevant information found in knowledge base."


# Images and brochures are extracted directly from search_knowledge_base results (no separate tool needed).


@tool
def flag_human_handoff(lead_id: str, reason: str) -> str:
    """
    Call this ONLY when:
    - Lead explicitly asks to speak to a human, agent, manager, or representative.
    - Lead is angry, frustrated, or uses abusive language.
    - Lead wants to make a final booking or sign an agreement.
    DO NOT call this for standard project inquiries, pricing questions, photo/brochure requests, or site visit scheduling.
    """
    return f"HANDOFF_REQUESTED|{reason}"


@tool
def get_available_slots(date: str, business_id: str = "default") -> str:
    """
    Call this ONLY when the lead explicitly asks to schedule a site visit, book a meeting, or requests a callback.
    The date parameter MUST be in YYYY-MM-DD format. If the lead specifies a relative date (like 'tomorrow' or 'next Monday'),
    convert it to YYYY-MM-DD based on the current date/time provided in the system prompt.
    Do NOT call this for general project questions, photo requests, or brochure requests.
    """
    import urllib.request
    import json

    url = f"{settings.backend_url}/api/booking/slots?date={date}"
    req = urllib.request.Request(url)
    req.add_header('x-service-token', settings.jwt_secret)
    req.add_header('x-business-id', business_id)

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode())
            if res_data.get("success"):
                slots = res_data["data"]["slots"]
                available = [s["time"] for s in slots if s.get("available")]
                if available:
                    formatted = []
                    for t in available:
                        h, m = map(int, t.split(':'))
                        ampm = 'PM' if h >= 12 else 'AM'
                        h_12 = h - 12 if h > 12 else (12 if h == 0 else h)
                        formatted.append(f"{h_12}:{m:02d} {ampm}")
                    return f"Available slots for {date}: {', '.join(formatted)}"
                return f"No available slots on {date}."
            return "Failed to fetch slots."
    except Exception as e:
        print(f"Error fetching slots: {e}")
        return "Internal scheduling system is temporarily offline. Let me check with our sales office."


@tool
def book_site_visit(lead_name: str, phone: str, date: str, time: str, project: str, business_id: str = "default") -> str:
    """
    Call this ONLY after the lead has explicitly confirmed a specific date and time slot for their site visit or meeting.
    The date parameter MUST be in YYYY-MM-DD format (e.g. '2026-06-26').
    The time parameter MUST be in HH:MM format (e.g. '14:30').
    Do NOT call this unless a specific slot has been agreed upon.
    """
    import urllib.request
    import json

    url = f"{settings.backend_url}/api/booking/book"
    payload = {
        "date": date,
        "time": time,
        "name": lead_name,
        "phone": phone,
        "notes": f"Project: {project}",
        "status": "pending"
    }

    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header('Content-Type', 'application/json')
    req.add_header('x-service-token', settings.jwt_secret)
    req.add_header('x-business-id', business_id)

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode())
            if res_data.get("success"):
                return f"BOOKED_PENDING|{date}|{time}|{project}"
            return "Booking failed."
    except Exception as e:
        print(f"Error booking site visit: {e}")
        return "Internal booking system is offline. I will confirm this appointment with you shortly."


TOOLS = [
    search_knowledge_base,
    flag_human_handoff,
    get_available_slots,
    book_site_visit
]
