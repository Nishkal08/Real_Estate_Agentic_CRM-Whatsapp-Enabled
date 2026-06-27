import sys, urllib.request, json
sys.stdout.reconfigure(encoding='utf-8')

REAL_KB = "abc57a29-99f8-4891-9749-df9126f0b22d"

def ask(msg, thread="test-pricing-001"):
    payload = json.dumps({
        'thread_id': thread,
        'business_id': 'test-biz',
        'lead_id': 'test-lead',
        'lead_name': 'Nishkal',
        'message': msg,
        'kb_id': REAL_KB,
        'campaign_config': {}
    }).encode()
    req = urllib.request.Request('http://127.0.0.1:8000/agent/message', data=payload)
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req, timeout=40) as r:
        data = json.loads(r.read())
        return data.get('reply', '')

tests = [
    ("What are the prices for Reneev Page 22?", "test-001"),
    ("Tell me about Life In Blue price and config", "test-002"),
    ("Compare Codename Dear Life and Reneev Page 22", "test-003"),
    ("Show me all available projects", "test-004"),
]

for msg, tid in tests:
    print(f"\n{'='*55}")
    print(f"Q: {msg}")
    print(f"{'='*55}")
    reply = ask(msg, tid)
    print(reply[:600])
