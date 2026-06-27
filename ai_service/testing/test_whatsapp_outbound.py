"""
End-to-end WhatsApp outbound test.
Tests the full outbound flow: Agent → Twilio → WhatsApp delivery.
Run: python testing/test_whatsapp_outbound.py
"""
import sys, json, time, urllib.request
sys.stdout.reconfigure(encoding='utf-8')

BASE = "http://127.0.0.1:8000"
REAL_KB = "abc57a29-99f8-4891-9749-df9126f0b22d"
TEST_PHONE = "+918000334811"   # whitelisted sandbox number

def ask(msg, thread, kb_id=REAL_KB):
    payload = json.dumps({
        "thread_id":     thread,
        "business_id":   "test-biz",
        "lead_id":       "test-lead",
        "lead_name":     "Nishkal",
        "message":       msg,
        "kb_id":         kb_id,
        "campaign_config": {"agent_name": "Pranjal", "agentTone": "friendly", "language": "en"}
    }).encode()
    req = urllib.request.Request(f"{BASE}/agent/message", data=payload)
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read())

def send_whatsapp(phone, message):
    """Call the Python sender directly to test Twilio."""
    sys.path.insert(0, '.')
    from dotenv import load_dotenv
    load_dotenv()
    from whatsapp.sender import send_full_agent_response
    return send_full_agent_response(
        to_phone=phone,
        text_reply=message,
        images=[],
        brochure_url=None
    )

def send_whatsapp_with_brochure(phone, message, brochure_url):
    sys.path.insert(0, '.')
    from dotenv import load_dotenv
    load_dotenv()
    from whatsapp.sender import send_full_agent_response
    return send_full_agent_response(
        to_phone=phone,
        text_reply=message,
        images=[],
        brochure_url=brochure_url
    )

PASS = 0; FAIL = 0

def check(label, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  OK  {label}")
    else:
        FAIL += 1
        print(f"  FAIL {label}")
        if detail:
            print(f"       {detail}")

print("=" * 60)
print("WHATSAPP OUTBOUND END-TO-END TEST")
print("=" * 60)
print()

# ── TEST 1: Agent generates response ────────────────────────
print("1. Agent Response Generation")
r1 = ask("I'm interested in a 3BHK near Jagatpur around 1.8 Cr", "wa-test-001")
reply = r1.get("reply", "")
score = r1.get("qualification_score", 0)
stage = r1.get("stage", "")
check("Agent returns reply", bool(reply), f"reply='{reply[:60]}...'")
check("Reply has content (>20 chars)", len(reply) > 20)
check("Reply under 900 chars", len(reply) <= 900, f"len={len(reply)}")
check("Score is int", isinstance(score, int))
check("Stage set", bool(stage))
print(f"   -> Stage: {stage} | Score: {score}")
print(f"   -> Reply ({len(reply)} chars): {reply[:150]}...")
print()

# ── TEST 2: Outbound with brochure ──────────────────────────
print("2. Agent Response With Brochure")
r2 = ask("Can you share the brochure for Reneev Page 22?", "wa-test-002")
reply2 = r2.get("reply", "")
brochure = r2.get("brochure_url")
check("Agent returns reply", bool(reply2))
check("Brochure URL returned (if available)", brochure is None or "cloudinary" in str(brochure) or "res.cloud" in str(brochure) or "http" in str(brochure), f"brochure={brochure}")
print(f"   -> Brochure URL: {brochure}")
print(f"   -> Reply: {reply2[:120]}...")
print()

# ── TEST 3: Send via Twilio sender (direct Python) ───────────
print("3. Twilio Sender — Text Message (Direct)")
try:
    twilio_result = send_whatsapp(TEST_PHONE, reply)
    success = twilio_result.get("success", False)
    results = twilio_result.get("results", [{}])
    first = results[0] if results else {}
    sid = first.get("sid", "")
    check("send_full_agent_response returns success", success, str(twilio_result))
    check("SID returned", bool(sid), f"sid={sid}")
    check("Not a blocked SID", not str(sid).startswith("blocked_"), f"sid={sid}")
    is_stub = str(sid).startswith("stub_")
    if is_stub:
        print("   -> Running in STUB mode (no real Twilio send). SID:", sid)
    else:
        print("   -> REAL Twilio message sent. SID:", sid)
except Exception as e:
    FAIL += 1
    print(f"  FAIL Twilio sender threw exception: {e}")
print()

# ── TEST 4: Send with Brochure ───────────────────────────────
print("4. Twilio Sender — Message + Brochure URL")
try:
    BROCHURE_CDN = "https://res.cloudinary.com/dq4rdlrmb/raw/upload/v1782573116/real-estate-assets/reneev-page-22-brochure.pdf"
    brochure_result = send_whatsapp_with_brochure(TEST_PHONE, "Here is the Reneev Page 22 brochure:", BROCHURE_CDN)
    results_b = brochure_result.get("results", [])
    check("Brochure send returns success", brochure_result.get("success"), str(brochure_result))
    check("Multiple messages sent (text + brochure)", len(results_b) >= 2, f"messages sent: {len(results_b)}")
    for i, r in enumerate(results_b):
        sid = r.get("sid", "")
        print(f"   -> Msg {i+1}: SID={sid}")
except Exception as e:
    FAIL += 1
    print(f"  FAIL Brochure send threw exception: {e}")
print()

# ── TEST 5: Outbound opener (campaign style) ─────────────────
print("5. Outbound Campaign Opener Message")
opener_msg = (
    "Hi Nishkal! I'm Pranjal from Horizon Group. "
    "We have some exciting residential projects in Ahmedabad. "
    "Are you looking for a home for personal use or investment? "
    "I'd love to share details that match your requirements!"
)
try:
    opener_result = send_whatsapp(TEST_PHONE, opener_msg)
    check("Opener send returns success", opener_result.get("success"), str(opener_result))
    sid = (opener_result.get("results") or [{}])[0].get("sid", "")
    print(f"   -> SID: {sid}")
    print(f"   -> Message ({len(opener_msg)} chars): {opener_msg[:100]}...")
except Exception as e:
    FAIL += 1
    print(f"  FAIL Opener send threw exception: {e}")
print()

# ── TEST 6: Inbound reply simulation (agent response) ────────
print("6. Inbound Reply → Agent → Outbound Response Flow")
r6 = ask("Tell me more about Life In Blue 2BHK pricing", "wa-inbound-001")
reply6 = r6.get("reply", "")
check("Agent responds to inbound-style message", bool(reply6) and len(reply6) > 20)
check("Pricing in response", "95" in reply6 or "lakh" in reply6.lower() or "bhk" in reply6.lower())
check("Length OK for WhatsApp", len(reply6) <= 900, f"len={len(reply6)}")
try:
    outbound6 = send_whatsapp(TEST_PHONE, reply6)
    check("Outbound send success after inbound", outbound6.get("success"))
    print(f"   -> Reply: {reply6[:120]}...")
except Exception as e:
    FAIL += 1
    print(f"  FAIL Outbound send failed: {e}")
print()

# ── SUMMARY ─────────────────────────────────────────────────
print("=" * 60)
print(f"RESULTS: {PASS} PASS  |  {FAIL} FAIL")
print("=" * 60)
if FAIL > 0:
    print("\nAction needed: Review FAILed tests above.")
else:
    print("\nAll WhatsApp outbound checks PASS.")
    print("Safe to deploy and test on real WhatsApp numbers.")
